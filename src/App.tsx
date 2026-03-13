/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Layout as LayoutIcon, 
  CheckCircle, 
  MessageSquare, 
  Github, 
  Loader2, 
  ChevronRight,
  BookOpen,
  Code2,
  Terminal,
  Settings
} from 'lucide-react';
import { fetchRepoData } from './services/github';
import { analyzeArchitecture, generateOnboarding, getMentorResponse } from './services/gemini';
import { RepoStructure, Role, RoleOnboarding, ChatMessage } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({ startOnLoad: true, theme: 'neutral' });

const Mermaid = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  
  useEffect(() => {
    if (chart) {
      mermaid.render('mermaid-svg', chart).then(({ svg }) => {
        setSvg(svg);
      });
    }
  }, [chart]);

  return <div className="overflow-auto p-4 bg-white rounded-xl border border-black/5" dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState<RepoStructure | null>(null);
  const [activeTab, setActiveTab] = useState<'viz' | 'onboarding' | 'chat'>('viz');
  
  // Feature 1 State
  const [arch, setArch] = useState<{ explanation: string, mermaid: string, summary: string } | null>(null);
  
  // Feature 2 State
  const [role, setRole] = useState<Role>('frontend');
  const [onboarding, setOnboarding] = useState<RoleOnboarding | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Feature 3 State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    try {
      const data = await fetchRepoData(url);
      setRepoData(data);
      const analysis = await analyzeArchitecture(data);
      setArch(analysis);
      setActiveTab('viz');
    } catch (err) {
      console.error(err);
      alert("Failed to analyze repository. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: Role) => {
    setRole(newRole);
    if (!repoData) return;
    
    setOnboardingLoading(true);
    try {
      const data = await generateOnboarding(repoData, newRole);
      setOnboarding(data);
    } catch (err) {
      console.error(err);
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || !repoData) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      const response = await getMentorResponse(repoData, [...chatHistory, userMsg], input);
      setChatHistory(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'onboarding' && !onboarding && repoData) {
      handleRoleChange(role);
    }
  }, [activeTab, repoData]);

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#141414] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">RepoInsight</h1>
            <p className="text-xs text-black/40 font-medium uppercase tracking-widest">AI Onboarding Assistant</p>
          </div>
        </div>
        
        <form onSubmit={handleAnalyze} className="flex-1 max-w-2xl mx-12 relative">
          <input 
            type="text" 
            placeholder="Enter GitHub Repository URL (e.g., https://github.com/facebook/react)"
            className="w-full bg-black/5 border-none rounded-2xl px-12 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={18} />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Analyze'}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-black/40 hover:text-black transition-colors">
            <Github size={20} />
          </a>
          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40">
            <Settings size={18} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {!repoData ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl"
            >
              <h2 className="text-5xl font-bold tracking-tighter mb-6">Onboard to any codebase in minutes.</h2>
              <p className="text-lg text-black/60 mb-10">
                RepoInsight uses AI to visualize architecture, generate role-specific checklists, and answer your technical questions instantly.
              </p>
              <div className="grid grid-cols-3 gap-6 text-left">
                {[
                  { icon: LayoutIcon, title: "Visualize", desc: "Architecture diagrams" },
                  { icon: CheckCircle, title: "Onboard", desc: "Role-based steps" },
                  { icon: MessageSquare, title: "Mentor", desc: "AI-powered chat" }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <item.icon className="text-emerald-600 mb-3" size={24} />
                    <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-black/40">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <aside className="col-span-3 space-y-2">
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center">
                    <Github size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-black/40 font-bold uppercase tracking-wider truncate">{repoData.owner}</p>
                    <p className="font-bold truncate">{repoData.repo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-black/60">
                  <Code2 size={14} />
                  <span>{repoData.files.length} files detected</span>
                </div>
              </div>

              {[
                { id: 'viz', icon: LayoutIcon, label: 'Visualization' },
                { id: 'onboarding', icon: CheckCircle, label: 'Onboarding' },
                { id: 'chat', icon: MessageSquare, label: 'AI Mentor' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : 'bg-white text-black/60 hover:bg-black/5 border border-black/5'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="active" className="ml-auto"><ChevronRight size={16} /></motion.div>}
                </button>
              ))}
            </aside>

            {/* Content Area */}
            <section className="col-span-9">
              <AnimatePresence mode="wait">
                {activeTab === 'viz' && (
                  <motion.div
                    key="viz"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
                      <h2 className="text-2xl font-bold mb-2">Architecture Overview</h2>
                      <p className="text-black/60 mb-8">{arch?.summary}</p>
                      
                      <div className="mb-10">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4">System Flow</h3>
                        {arch?.mermaid ? (
                          <Mermaid chart={arch.mermaid} />
                        ) : (
                          <div className="h-64 bg-black/5 rounded-xl animate-pulse flex items-center justify-center">
                            <Loader2 className="animate-spin text-black/20" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4">Detailed Explanation</h3>
                        <div className="prose prose-sm max-w-none text-black/80">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{arch?.explanation || ''}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'onboarding' && (
                  <motion.div
                    key="onboarding"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex gap-2 mb-6">
                      {(['frontend', 'backend', 'devops'] as Role[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                            role === r 
                              ? 'bg-black text-white' 
                              : 'bg-white text-black/40 hover:bg-black/5 border border-black/5'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    {onboardingLoading ? (
                      <div className="h-64 bg-white rounded-[2rem] border border-black/5 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="animate-spin mx-auto mb-4 text-emerald-600" size={32} />
                          <p className="text-sm font-bold text-black/40">Generating custom checklist...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {onboarding?.steps.map((step, i) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm flex gap-6"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                              <p className="text-black/60 mb-4 leading-relaxed">{step.description}</p>
                              {step.files && step.files.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {step.files.map((f, fi) => (
                                    <span key={fi} className="px-3 py-1 bg-black/5 rounded-lg text-[10px] font-mono font-bold text-black/60">
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-[calc(100vh-12rem)] flex flex-col"
                  >
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-6 scrollbar-hide">
                      {chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                          <MessageSquare size={48} className="mb-4" />
                          <p className="text-sm font-bold">Ask me anything about the codebase.</p>
                          <p className="text-xs mt-1">"Where is authentication implemented?"</p>
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-6 rounded-[2rem] ${
                            msg.role === 'user' 
                              ? 'bg-black text-white rounded-tr-none' 
                              : 'bg-white text-black border border-black/5 shadow-sm rounded-tl-none'
                          }`}>
                            <div className="prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-black/5 shadow-sm">
                            <Loader2 className="animate-spin text-emerald-600" size={20} />
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="relative">
                      <input
                        type="text"
                        placeholder="Ask a question about the repository..."
                        className="w-full bg-white border border-black/5 rounded-[2rem] px-8 py-6 text-sm shadow-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !input}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

import { GoogleGenAI, Type } from "@google/genai";
import { RepoStructure, Role, RoleOnboarding } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeArchitecture(structure: RepoStructure) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze the following repository structure and provide a high-level architecture explanation and a Mermaid.js diagram.
    
    Repository: ${structure.owner}/${structure.repo}
    Files:
    ${structure.files.map(f => f.path).join('\n')}
    
    README Snippet:
    ${structure.readme?.slice(0, 1000) || "No README found"}
    
    Return the response in JSON format with the following structure:
    {
      "explanation": "High-level architecture explanation",
      "mermaid": "Mermaid diagram code (graph TD...)",
      "summary": "Simplified developer-friendly explanation"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          mermaid: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["explanation", "mermaid", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateOnboarding(structure: RepoStructure, role: Role): Promise<RoleOnboarding> {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Generate a step-by-step onboarding checklist for a ${role} developer for this repository.
    
    Repository: ${structure.owner}/${structure.repo}
    Files:
    ${structure.files.map(f => f.path).join('\n')}
    
    Return the response in JSON format with the following structure:
    {
      "role": "${role}",
      "steps": [
        {
          "title": "Step title",
          "description": "Detailed explanation of what to do and why",
          "files": ["relevant/file/path.ts"]
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                files: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description"]
            }
          }
        },
        required: ["role", "steps"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function getMentorResponse(structure: RepoStructure, history: { role: string, text: string }[], question: string) {
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `
        You are an expert AI Mentor for developers. You are helping a new developer understand a repository.
        Use the following repository structure as context:
        ${structure.files.map(f => f.path).join('\n')}
        
        When answering:
        - Reference specific files and modules.
        - Explain the logic clearly.
        - Suggest where to start reading code.
        - Be encouraging and helpful.
      `
    }
  });

  // Reconstruct history
  for (const msg of history.slice(0, -1)) {
    // Note: sendMessage doesn't support full history easily in this SDK version without manual management
    // but we can just send the last few or use the chat object if we kept it in state.
    // For simplicity, we'll just send the current question with context.
  }

  const response = await chat.sendMessage({ message: question });
  return response.text;
}

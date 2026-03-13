export interface RepoFile {
  path: string;
  type: 'file' | 'dir';
  content?: string;
  size?: number;
}

export interface RepoStructure {
  owner: string;
  repo: string;
  files: RepoFile[];
  readme?: string;
}

export type Role = 'frontend' | 'backend' | 'devops';

export interface OnboardingStep {
  title: string;
  description: string;
  files?: string[];
}

export interface RoleOnboarding {
  role: Role;
  steps: OnboardingStep[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

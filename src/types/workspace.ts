export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'code' | 'zip' | 'figma';
  url?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'claude' | 'openai' | 'mistral' | 'heftcoder';
  badge?: 'hot' | 'new' | 'pro';
}

export interface ProjectStatus {
  status: 'idle' | 'working' | 'complete' | 'error';
  message?: string;
}

export type UserTier = 'basic' | 'plus' | 'pro' | 'studio';

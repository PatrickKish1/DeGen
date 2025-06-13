// types/chat.ts
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  threadId?: string;
}

export interface ChatThread {
  id: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatRequest {
  message: string;
  threadId?: string;
  senderAddress?: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  threadId: string;
  timestamp: string;
  messageType?: 'general' | 'command' | 'question' | 'casual';
  analysisType?: 'general' | 'technical' | 'market';
  error?: boolean;
  isDirect?: boolean;
  contextUsed?: any;
}

export interface GroqServiceConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
}

export interface ConversationState {
  messages: any[];
  threadId: string;
  userAddress?: string;
  analysisType?: string;
  contextData?: string;
  command?: string;
  parameters?: string;
}

export interface ServiceResponse {
  response: {
    content: string;
  } | string;
  messageType: 'general' | 'command' | 'question' | 'casual';
  analysisType: 'general' | 'technical' | 'market';
  threadId: string;
  timestamp: string;
  isDirect?: boolean;
  contextUsed?: any;
  error?: boolean;
}
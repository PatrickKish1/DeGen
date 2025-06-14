/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  threadId?: string;
  toolCalls?: ToolCall[];
  metadata?: MessageMetadata;
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
  tools?: string[];
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
  toolResults?: ToolResult[];
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
  toolResults?: ToolResult[];
}

// XMTP Types
export interface XMTPMessage {
  id: string;
  content: string;
  senderInboxId: string;
  conversationId: string;
  sentAt: string;
  timestamp: string;
  contentType?: string;
}

export interface XMTPConversation {
  id: string;
  topic: string;
  peerInboxId: string;
  peerAddress: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: XMTPMessage;
  isGroupChat: boolean;
  messages: XMTPMessage[];
}

export interface XMTPConfig {
  walletKey: string;
  encryptionKey: string;
  env: 'dev' | 'production';
  groqApiKey?: string;
}

// Tool System Types
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BlockchainTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>, userAddress?: string) => Promise<any>;
}

export interface MessageMetadata {
  gasUsed?: string;
  transactionHash?: string;
  blockNumber?: string;
  network?: string;
  toolsUsed?: string[];
}

// Balance and Transaction Types
export interface BalanceInfo {
  usdc: string;
  eth: string;
  address: string;
  network: string;
  timestamp: string;
}

export interface TransactionRequest {
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
  network: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasEstimate?: string;
  totalCost?: string;
}

// DeFi Protocol Types
export interface ProtocolInfo {
  name: string;
  tvl: string;
  apy: string;
  risk: 'low' | 'medium' | 'high';
  description: string;
}

export interface YieldOpportunity {
  protocol: string;
  pool: string;
  apy: string;
  tvl: string;
  risk: string;
  minimumDeposit: string;
}

// Network Types
export interface NetworkStatus {
  name: string;
  chainId: number;
  blockNumber: string;
  gasPrice: string;
  isHealthy: boolean;
  lastUpdated: string;
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Component Props Types
export interface ChatInterfaceProps {
  mode: 'ai' | 'p2p';
  isInitialized: boolean;
  agentAddress?: string;
  agentInboxId?: string;
  // P2P specific props
  conversations?: XMTPConversation[];
  onCreateConversation?: (peerAddress: string) => Promise<XMTPConversation>;
  onSendMessage?: (messageOrConversationId: string, contentOrSenderAddress?: string) => Promise<string>;
  onGetMessages?: (conversationId: string) => Promise<XMTPMessage[]>;
  onStartListening?: (conversationId: string) => void;
}

export interface MessageListProps {
  className?: string;
}

// Tool Function Types
export type ToolFunction = (args: Record<string, any>, userAddress?: string) => Promise<any>;

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
  function: ToolFunction;
}

// Wallet Types
export interface WalletInfo {
  address: string;
  balance: BalanceInfo;
  network: string;
  isConnected: boolean;
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: string;
  change24h: string;
  volume24h: string;
  marketCap: string;
}

export interface DeFiProtocolData {
  name: string;
  tvl: string;
  volume24h: string;
  fees24h: string;
  users24h: string;
}

// Quick Commands
export interface QuickCommand {
  id: string;
  label: string;
  command: string;
  description: string;
  category: 'wallet' | 'defi' | 'trading' | 'info';
  icon?: string;
}
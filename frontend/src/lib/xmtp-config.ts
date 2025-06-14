/* eslint-disable @typescript-eslint/no-explicit-any */

import type { XmtpEnv } from "@xmtp/xmtp-js";

export interface XMTPConfig {
  walletKey: string;
  encryptionKey: string;
  xmtpEnv: XmtpEnv;
  networkId: string;
  groqApiKey: string;
}

export const DEFAULT_XMTP_CONFIG: Partial<XMTPConfig> = {
  xmtpEnv: "dev" as XmtpEnv,
  networkId: "base-sepolia",
};

/**
 * Create XMTP configuration from environment or user input
 */
export function createXMTPConfig(overrides: Partial<XMTPConfig> = {}): XMTPConfig {
  const config: XMTPConfig = {
    walletKey: process.env.WALLET_KEY || overrides.walletKey || "",
    encryptionKey: process.env.ENCRYPTION_KEY || overrides.encryptionKey || "",
    xmtpEnv: (process.env.XMTP_ENV as XmtpEnv) || overrides.xmtpEnv || "dev",
    networkId: process.env.NETWORK_ID || overrides.networkId || "base-sepolia",
    groqApiKey: process.env.GROQ_API_KEY || overrides.groqApiKey || "",
  };

  // Validate required fields
  const requiredFields: (keyof XMTPConfig)[] = ['walletKey', 'encryptionKey', 'groqApiKey'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
  }

  return config;
}

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  const bytes = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof global !== 'undefined' && global.crypto) {
    global.crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate configuration
 */
export function validateXMTPConfig(config: XMTPConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Validate wallet key
    if (!config.walletKey) {
      errors.push('Wallet key is required');
    } else if (!config.walletKey.match(/^(0x)?[a-fA-F0-9]{64}$/)) {
      errors.push('Invalid wallet key format (must be 64 hex characters)');
    }

    // Validate encryption key
    if (!config.encryptionKey) {
      errors.push('Encryption key is required');
    } else if (!config.encryptionKey.match(/^[a-fA-F0-9]{64}$/)) {
      errors.push('Invalid encryption key format (must be 64 hex characters)');
    }

    // Validate Groq API key
    if (!config.groqApiKey) {
      errors.push('Groq API key is required');
    } else if (!config.groqApiKey.startsWith('gsk_')) {
      errors.push('Invalid Groq API key format (must start with gsk_)');
    }

    // Validate network ID
    const validNetworks = ['base-sepolia', 'base-mainnet'];
    if (!validNetworks.includes(config.networkId)) {
      errors.push(`Invalid network ID. Must be one of: ${validNetworks.join(', ')}`);
    }

    // Validate XMTP environment
    const validEnvs = ['dev', 'production'];
    if (!validEnvs.includes(config.xmtpEnv)) {
      errors.push(`Invalid XMTP environment. Must be one of: ${validEnvs.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Configuration validation failed:', error);
    errors.push('Configuration validation failed');
    return { isValid: false, errors };
  }
}

/**
 * Sanitize wallet key (ensure it has 0x prefix)
 */
export function sanitizeWalletKey(key: string): string {
  if (!key) return '';
  return key.startsWith('0x') ? key : `0x${key}`;
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(networkId: string): string {
  switch (networkId) {
    case 'base-sepolia':
      return 'Base Sepolia (Testnet)';
    case 'base-mainnet':
      return 'Base Mainnet';
    default:
      return networkId;
  }
}

/**
 * Get environment display name
 */
export function getEnvironmentDisplayName(env: XmtpEnv): string {
  switch (env) {
    case 'dev':
      return 'Development';
    case 'production':
      return 'Production';
    default:
      return env;
  }
}

// AI Commands and Prompts
export const AI_COMMANDS = {
  BALANCE: '/balance',
  TRANSFER: '/tx',
  HELP: '/help',
  STATUS: '/status',
  HISTORY: '/history',
  INFO: '/info',
  NETWORK: '/network',
} as const;

export const AI_SYSTEM_PROMPT = `You are a helpful DeFi and blockchain assistant integrated with XMTP messaging on the Base network. You can help users with:

**🔧 Transaction Commands:**
- /balance - Check USDC balance on Base
- /tx <amount> - Initiate USDC transfer (e.g., /tx 0.1)
- /status - Check system status and network health
- /network - Show current network information
- /help - Show available commands and features

**💡 General Assistance:**
- Explain DeFi concepts and protocols (Uniswap, Aave, Compound)
- Provide market insights and trading strategies
- Answer blockchain and cryptocurrency questions
- Guide users through wallet operations
- Help with Base network transactions

**🗣️ Communication Style:**
- Keep responses concise and mobile-friendly
- Use emojis sparingly for clarity and engagement
- Provide step-by-step instructions when needed
- Always confirm transaction details before processing
- Be friendly, professional, and supportive

**🔒 Safety Guidelines:**
- Never ask for private keys or seed phrases
- Always verify transaction amounts and recipients
- Warn about potential risks in DeFi operations
- Suggest users verify contract addresses
- Explain gas fees and transaction costs

**🌐 Current Context:**
- Network: Base (Ethereum L2)
- Supported Token: USDC
- Communication: XMTP protocol
- AI Model: Groq Llama

**📱 XMTP Features:**
- Real-time messaging between wallets
- Transaction previews and confirmations
- Onchain transaction notifications
- Wallet-to-wallet communication

Remember: You're communicating through XMTP, so responses should be mobile-friendly and easy to read in a chat interface. Always prioritize user safety and provide clear, actionable guidance.`;

export const GROQ_MODEL_CONFIG = {
  model: "llama3-8b-8192",
  temperature: 0.7,
  max_tokens: 500,
  top_p: 1,
  stream: false,
} as const;

/**
 * Get AI response configuration based on message type
 */
export function getAIResponseConfig(messageType: 'command' | 'question' | 'casual') {
  const baseConfig = { ...GROQ_MODEL_CONFIG };

  switch (messageType) {
    case 'command':
      return {
        ...baseConfig,
        temperature: 0.3, // More deterministic for commands
        max_tokens: 300,
      };
    case 'question':
      return {
        ...baseConfig,
        temperature: 0.7, // Balanced for explanations
        max_tokens: 500,
      };
    case 'casual':
      return {
        ...baseConfig,
        temperature: 0.8, // More creative for casual chat
        max_tokens: 200,
      };
    default:
      return baseConfig;
  }
}

/**
 * Detect message type based on content
 */
export function detectMessageType(content: string): 'command' | 'question' | 'casual' {
  const lowerContent = content.toLowerCase().trim();
  
  if (lowerContent.startsWith('/')) {
    return 'command';
  }
  
  const questionWords = ['how', 'what', 'when', 'where', 'why', 'which', 'who', 'can you', 'could you', 'explain', 'tell me'];
  const hasQuestionWord = questionWords.some(word => lowerContent.includes(word));
  const hasQuestionMark = content.includes('?');
  
  if (hasQuestionWord || hasQuestionMark) {
    return 'question';
  }
  
  return 'casual';
}

/**
 * Format error messages for user display
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // Handle common error types
    if (error.message.includes('insufficient funds')) {
      return '❌ Insufficient funds to complete the transaction';
    }
    
    if (error.message.includes('network')) {
      return '❌ Network connection issue. Please try again';
    }
    
    if (error.message.includes('gas')) {
      return '❌ Gas estimation failed. The transaction may fail';
    }
    
    if (error.message.includes('unauthorized')) {
      return '❌ Transaction not authorized. Please check your wallet';
    }
    
    return `❌ Error: ${error.message}`;
  }
  
  return '❌ An unexpected error occurred. Please try again';
}

/**
 * Generate helpful tips based on user interaction
 */
export function generateTips(userAddress: string, messageCount: number): string[] {
  const tips: string[] = [];
  
  if (messageCount < 3) {
    tips.push("💡 Try /help to see all available commands");
    tips.push("💰 Use /balance to check your USDC balance");
  }
  
  if (messageCount < 5) {
    tips.push("🔄 Send USDC with /tx <amount> (e.g., /tx 0.1)");
    tips.push("📊 Check system status with /status");
  }
  
  tips.push("🌐 You're on Base network - enjoy low fees!");
  tips.push("💬 Ask me anything about DeFi, trading, or blockchain");
  
  return tips;
}

/**
 * Configuration for different environments
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    xmtpEnv: 'dev' as XmtpEnv,
    networkId: 'base-sepolia',
    logLevel: 'debug',
    enableAnalytics: false,
  },
  staging: {
    xmtpEnv: 'dev' as XmtpEnv,
    networkId: 'base-sepolia',
    logLevel: 'info',
    enableAnalytics: true,
  },
  production: {
    xmtpEnv: 'production' as XmtpEnv,
    networkId: 'base-mainnet',
    logLevel: 'warn',
    enableAnalytics: true,
  },
} as const;

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig(env: keyof typeof ENVIRONMENT_CONFIGS = 'development') {
  return ENVIRONMENT_CONFIGS[env] || ENVIRONMENT_CONFIGS.development;
}
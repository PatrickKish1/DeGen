// import { IdentifierKind, type Client, type Signer } from "@xmtp/xmtp-js";
// import { fromString, toString } from "uint8arrays";
// import { createWalletClient, http, toBytes } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { base, baseSepolia } from "viem/chains";

// interface User {
//   key: `0x${string}`;
//   account: ReturnType<typeof privateKeyToAccount>;
//   wallet: ReturnType<typeof createWalletClient>;
// }

// /**
//  * Create a user object from a private key
//  */
// export const createUser = (key: string): User => {
//   const sanitizedKey = key.startsWith("0x") ? key : `0x${key}`;
//   const account = privateKeyToAccount(sanitizedKey as `0x${string}`);
  
//   return {
//     key: sanitizedKey as `0x${string}`,
//     account,
//     wallet: createWalletClient({
//       account,
//       chain: baseSepolia, // Default to testnet
//       transport: http(),
//     }),
//   };
// };

// /**
//  * Create an XMTP signer from a private key
//  */
// export const createSigner = (key: string): Signer => {
//   const sanitizedKey = key.startsWith("0x") ? key : `0x${key}`;
//   const user = createUser(sanitizedKey);
  
//   return {
//     type: "EOA",
//     getIdentifier: () => ({
//       identifierKind: IdentifierKind.Ethereum,
//       identifier: user.account.address.toLowerCase(), 
//     }),
//     signMessage: async (message: string) => {
//       try {
//         const signature = await user.wallet.signMessage({
//           message,
//           account: user.account,
//         });
//         return toBytes(signature);
//       } catch (error) {
//         console.error('Error signing message:', error);
//         const errorMessage = error instanceof Error ? error.message : String(error);
//         throw new Error(`Failed to sign message: ${errorMessage}`);
//       }
//     },
//   };
// };

// /**
//  * Generate a random encryption key for browser environment
//  */
// export const generateEncryptionKeyHex = (): string => {
//   let uint8Array: Uint8Array;
  
//   if (typeof window !== 'undefined' && window.crypto) {
//     // Browser environment
//     uint8Array = new Uint8Array(32);
//     window.crypto.getRandomValues(uint8Array);
//   } else if (typeof global !== 'undefined' && global.crypto) {
//     // Node.js environment with crypto
//     uint8Array = new Uint8Array(32);
//     global.crypto.getRandomValues(uint8Array);
//   } else {
//     // Fallback for environments without crypto
//     uint8Array = new Uint8Array(32);
//     for (let i = 0; i < 32; i++) {
//       uint8Array[i] = Math.floor(Math.random() * 256);
//     }
//   }
  
//   return toString(uint8Array, "hex");
// };

// /**
//  * Get the encryption key from a hex string
//  */
// export const getEncryptionKeyFromHex = (hex: string): Uint8Array => {
//   try {
//     // Remove 0x prefix if present
//     const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    
//     if (cleanHex.length !== 64) {
//       throw new Error('Encryption key must be 64 hex characters (32 bytes)');
//     }
    
//     return fromString(cleanHex, "hex");
//   } catch (error) {
//     console.error('Error parsing encryption key:', error);
//     const errorMessage = error instanceof Error ? error.message : String(error);
//     throw new Error(`Invalid encryption key format: ${errorMessage}`);
//   }
// };

// /**
//  * Get database path for XMTP client storage
//  */
// export const getDbPath = (description: string = "xmtp"): string => {
//   if (typeof window !== 'undefined') {
//     // Browser environment - use IndexedDB path
//     return `xmtp_${description}_db`;
//   }
  
//   // Node.js environment
//   const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? ".data/xmtp";
  
//   // Create database directory if it doesn't exist (Node.js only)
//   if (typeof require !== 'undefined') {
//     try {
//       const fs = require('fs');
//       if (!fs.existsSync(volumePath)) {
//         fs.mkdirSync(volumePath, { recursive: true });
//       }
//     } catch (error) {
//       console.warn('Could not create database directory:', error);
//     }
//   }
  
//   return `${volumePath}/${description}.db3`;
// };

// /**
//  * Log agent details for debugging
//  */
// export const logAgentDetails = async (
//   clients: Client | Client[],
// ): Promise<void> => {
//   const clientArray = Array.isArray(clients) ? clients : [clients];
//   const clientsByAddress = clientArray.reduce((acc: Record<string, Client[]>, client) => {
//     const address = client.accountIdentifier?.identifier as string;
//     acc[address] = acc[address] ?? [];
//     acc[address].push(client);
//     return acc;
//   }, {});

//   for (const [address, clientGroup] of Object.entries(clientsByAddress)) {
//     const firstClient = clientGroup[0];
//     const inboxId = firstClient.inboxId;
//     const environments = clientGroup
//       .map((c: Client) => c.options?.env ?? "dev")
//       .join(", ");

//     console.log(`\x1b[38;2;252;76;52m
//         ██╗  ██╗███╗   ███╗████████╗██████╗ 
//         ╚██╗██╔╝████╗ ████║╚══██╔══╝██╔══██╗
//          ╚███╔╝ ██╔████╔██║   ██║   ██████╔╝
//          ██╔██╗ ██║╚██╔╝██║   ██║   ██╔═══╝ 
//         ██╔╝ ██╗██║ ╚═╝ ██║   ██║   ██║     
//         ╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝   ╚═╝     
//       \x1b[0m`);

//     const urls = [`https://xmtp.chat/dm/${address}`];

//     try {
//       const conversations = await firstClient.conversations.list();
//       const installations = await firstClient.preferences.inboxState();

//       console.log(`
//     ✓ XMTP Client:
//     • Address: ${address}
//     • Installations: ${installations.installations.length}
//     • Conversations: ${conversations.length}
//     • InboxId: ${inboxId}
//     • Networks: ${environments}
//     ${urls.map((url) => `• URL: ${url}`).join("\n")}`);
//     } catch (error) {
//       console.error('Error logging agent details:', error);
//       console.log(`
//     ✓ XMTP Client:
//     • Address: ${address}
//     • InboxId: ${inboxId}
//     • Networks: ${environments}
//     • Status: Initialized but could not fetch details`);
//     }
//   }
// };

// /**
//  * Validate environment variables and configuration
//  */
// export function validateEnvironment(vars: string[]): Record<string, string> {
//   const missing = vars.filter((v) => !process.env[v]);

//   if (missing.length && typeof require !== 'undefined') {
//     try {
//       const path = require('path');
//       const fs = require('fs');
      
//       const envPath = path.resolve(process.cwd(), ".env");
//       if (fs.existsSync(envPath)) {
//         const envVars = fs
//           .readFileSync(envPath, "utf-8")
//           .split("\n")
//           .filter((line: string) => line.trim() && !line.startsWith("#"))
//           .reduce((acc: Record<string, string>, line: string) => {
//             const [key, ...val] = line.split("=");
//             if (key && val.length) acc[key.trim()] = val.join("=").trim();
//             return acc;
//           }, {});

//         missing.forEach((v) => {
//           if (envVars[v]) process.env[v] = envVars[v];
//         });
//       }
//     } catch (e) {
//       console.error('Error reading .env file:', e);
//     }

//     const stillMissing = vars.filter((v) => !process.env[v]);
//     if (stillMissing.length) {
//       console.error("Missing env vars:", stillMissing.join(", "));
//       if (typeof process !== 'undefined' && process.exit) {
//         process.exit(1);
//       }
//     }
//   }

//   return vars.reduce((acc: Record<string, string>, key) => {
//     acc[key] = process.env[key] as string;
//     return acc;
//   }, {});
// }

// /**
//  * Create wallet client for specific network
//  */
// export const createWalletForNetwork = (key: string, networkId: string) => {
//   const sanitizedKey = key.startsWith("0x") ? key : `0x${key}`;
//   const account = privateKeyToAccount(sanitizedKey as `0x${string}`);
  
//   const chain = networkId === 'base-mainnet' ? base : baseSepolia;
  
//   return createWalletClient({
//     account,
//     chain,
//     transport: http(),
//   });
// };

// /**
//  * Validate wallet private key format
//  */
// export const validatePrivateKey = (key: string): { isValid: boolean; error?: string } => {
//   if (!key) {
//     return { isValid: false, error: 'Private key is required' };
//   }

//   // Remove 0x prefix for validation
//   const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  
//   if (cleanKey.length !== 64) {
//     return { isValid: false, error: 'Private key must be 64 hex characters' };
//   }

//   if (!/^[a-fA-F0-9]+$/.test(cleanKey)) {
//     return { isValid: false, error: 'Private key must contain only hex characters' };
//   }

//   // Check if key is all zeros (invalid)
//   if (cleanKey === '0'.repeat(64)) {
//     return { isValid: false, error: 'Private key cannot be all zeros' };
//   }

//   return { isValid: true };
// };

// /**
//  * Get address from private key
//  */
// export const getAddressFromPrivateKey = (key: string): string => {
//   try {
//     const sanitizedKey = key.startsWith("0x") ? key : `0x${key}`;
//     const account = privateKeyToAccount(sanitizedKey as `0x${string}`);
//     return account.address;
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : String(error);
//     throw new Error(`Invalid private key: ${errorMessage}`);
//   }
// };

// /**
//  * Format address for display
//  */
// export const formatAddress = (address: string, length: number = 6): string => {
//   if (!address || address.length < 10) return address;
//   return `${address.slice(0, length)}...${address.slice(-4)}`;
// };

// /**
//  * Validate Ethereum address
//  */
// export const isValidAddress = (address: string): boolean => {
//   return Boolean(address && address.startsWith('0x') && address.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(address));
// };

// /**
//  * Sleep utility for async operations
//  */
// export const sleep = (ms: number): Promise<void> => {
//   return new Promise(resolve => setTimeout(resolve, ms));
// };

// /**
//  * Retry utility for network operations
//  */
// export const retry = async <T>(
//   fn: () => Promise<T>,
//   retries: number = 3,
//   delay: number = 1000
// ): Promise<T> => {
//   try {
//     return await fn();
//   } catch (error) {
//     if (retries <= 0) {
//       throw error;
//     }
    
//     console.warn(`Operation failed, retrying in ${delay}ms... (${retries} retries left)`);
//     await sleep(delay);
//     return retry(fn, retries - 1, delay * 2); // Exponential backoff
//   }
// };

// /**
//  * Safe JSON parse with error handling
//  */
// export const safeJsonParse = <T>(json: string, fallback: T): T => {
//   try {
//     return JSON.parse(json);
//   } catch (error) {
//     console.warn('Failed to parse JSON:', error);
//     return fallback;
//   }
// };

// /**
//  * Generate random ID for messages/conversations
//  */
// export const generateId = (): string => {
//   return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// };

// /**
//  * Format timestamp for display
//  */
// export const formatTimestamp = (timestamp: Date | string | number): string => {
//   const date = new Date(timestamp);
//   const now = new Date();
//   const diffMs = now.getTime() - date.getTime();
//   const diffMins = Math.floor(diffMs / (1000 * 60));
//   const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
//   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

//   if (diffMins < 1) {
//     return 'Just now';
//   } else if (diffMins < 60) {
//     return `${diffMins}m ago`;
//   } else if (diffHours < 24) {
//     return `${diffHours}h ago`;
//   } else if (diffDays < 7) {
//     return `${diffDays}d ago`;
//   } else {
//     return date.toLocaleDateString();
//   }
// };

// /**
//  * Debounce utility for search/input operations
//  */
// export const debounce = <T extends (...args: any[]) => any>(
//   func: T,
//   wait: number
// ): ((...args: Parameters<T>) => void) => {
//   let timeout: NodeJS.Timeout;
  
//   return (...args: Parameters<T>) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// /**
//  * Local storage utilities with error handling
//  */
// export const storage = {
//   get: <T>(key: string, fallback: T): T => {
//     if (typeof window === 'undefined') return fallback;
    
//     try {
//       const item = localStorage.getItem(key);
//       return item ? JSON.parse(item) : fallback;
//     } catch (error) {
//       console.warn(`Failed to get ${key} from localStorage:`, error);
//       return fallback;
//     }
//   },

//   set: (key: string, value: any): void => {
//     if (typeof window === 'undefined') return;
    
//     try {
//       localStorage.setItem(key, JSON.stringify(value));
//     } catch (error) {
//       console.warn(`Failed to set ${key} in localStorage:`, error);
//     }
//   },

//   remove: (key: string): void => {
//     if (typeof window === 'undefined') return;
    
//     try {
//       localStorage.removeItem(key);
//     } catch (error) {
//       console.warn(`Failed to remove ${key} from localStorage:`, error);
//     }
//   }
// };

// /**
//  * Error boundary utility for async operations
//  */
// export const withErrorBoundary = async <T>(
//   operation: () => Promise<T>,
//   errorHandler?: (error: Error) => T | Promise<T>
// ): Promise<T | null> => {
//   try {
//     return await operation();
//   } catch (error) {
//     const errorObj = error instanceof Error ? error : new Error(String(error));
//     console.error('Operation failed:', errorObj);
    
//     if (errorHandler) {
//       try {
//         return await errorHandler(errorObj);
//       } catch (handlerError) {
//         console.error('Error handler failed:', handlerError);
//       }
//     }
    
//     return null;
//   }
// };

// /**
//  * Network status checker
//  */
// export const checkNetworkStatus = async (): Promise<{
//   isOnline: boolean;
//   latency?: number;
// }> => {
//   if (typeof navigator === 'undefined') {
//     return { isOnline: true };
//   }

//   const isOnline = navigator.onLine;
//   if (!isOnline) {
//     return { isOnline: false };
//   }

//   try {
//     const start = Date.now();
//     await fetch('https://api.base.org/health', { 
//       method: 'HEAD',
//       mode: 'no-cors'
//     });
//     const latency = Date.now() - start;
    
//     return { isOnline: true, latency };
//   } catch (error) {
//     return { isOnline: false };
//   }
// };

// /**
//  * Performance monitoring utility
//  */
// export class PerformanceMonitor {
//   private timers: Map<string, number> = new Map();

//   start(label: string): void {
//     this.timers.set(label, performance.now());
//   }

//   end(label: string): number {
//     const start = this.timers.get(label);
//     if (!start) {
//       console.warn(`Timer ${label} was not started`);
//       return 0;
//     }

//     const duration = performance.now() - start;
//     this.timers.delete(label);
    
//     console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
//     return duration;
//   }

//   clear(): void {
//     this.timers.clear();
//   }
// }

// // Export singleton instance
// export const perf = new PerformanceMonitor();
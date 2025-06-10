import { Client, type Signer, IdentifierKind } from '@xmtp/node-sdk';
import { fromString, toString } from "uint8arrays";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

export interface User {
  key: `0x${string}`;
  account: ReturnType<typeof privateKeyToAccount>;
  wallet: ReturnType<typeof createWalletClient>;
}

/**
 * Create a user object from a private key
 */
export const createUser = (key: string): User => {
  const sanitizedKey = key.startsWith("0x") ? key : `0x${key}`;
  const account = privateKeyToAccount(sanitizedKey as `0x${string}`);
  
  return {
    key: sanitizedKey as `0x${string}`,
    account,
    wallet: createWalletClient({
      account,
      chain: baseSepolia, // Default to testnet
      transport: http(),
    }),
  };
};

/**
 * Create an XMTP signer from a private key - Node SDK version
 */
export const createNodeSigner = (key: string): Signer => {
  const sanitizedKey = key.startsWith("0x") ? key : `0x${key}`;
  const user = createUser(sanitizedKey);
  
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum, // Use the enum from Node SDK
      identifier: user.account.address.toLowerCase(), 
    }),
    signMessage: async (message: string) => {
      try {
        const signature = await user.wallet.signMessage({
          message,
          account: user.account,
        });
        // Convert hex signature to Uint8Array
        const signatureBytes = new Uint8Array(
          signature.slice(2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        return signatureBytes;
      } catch (error) {
        console.error('Error signing message:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to sign message: ${errorMessage}`);
      }
    },
  };
};

/**
 * Generate a random encryption key
 */
export const generateEncryptionKeyHex = (): string => {
  const uint8Array = new Uint8Array(32);
  
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(uint8Array);
  } else {
    // Fallback for Node.js
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(32);
    uint8Array.set(randomBytes);
  }
  
  return toString(uint8Array, "hex");
};

/**
 * Get the encryption key from a hex string
 */
export const getEncryptionKeyFromHex = (hex: string): Uint8Array => {
  try {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    
    if (cleanHex.length !== 64) {
      throw new Error('Encryption key must be 64 hex characters (32 bytes)');
    }
    
    return fromString(cleanHex, "hex");
  } catch (error) {
    console.error('Error parsing encryption key:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid encryption key format: ${errorMessage}`);
  }
};

/**
 * Get database path for XMTP client storage - Node.js version
 */
export const getDbPath = (description: string = "xmtp"): string => {
  const path = require('path');
  const fs = require('fs');
  
  // Use a data directory in your project
  const dataDir = path.join(process.cwd(), 'data', 'xmtp');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return path.join(dataDir, `${description}.db3`);
};

/**
 * Initialize XMTP Client with Node SDK
 */
export const initializeXMTPClient = async (config: {
  walletKey: string;
  encryptionKey: string;
  env: 'dev' | 'production';
  description?: string;
}) => {
  const signer = createNodeSigner(config.walletKey);
  const dbEncryptionKey = getEncryptionKeyFromHex(config.encryptionKey);
  const dbPath = getDbPath(config.description || 'default');

  const client = await Client.create(signer, {
    env: config.env,
    dbEncryptionKey,
    dbPath,
  });

  return {
    client,
    address: client.accountIdentifier?.identifier,
    inboxId: client.inboxId
  };
};

/**
 * Safe error handling for API routes
 */
export const handleAPIError = (error: unknown) => {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return {
      error: error.message,
      type: 'application_error'
    };
  }
  
  return {
    error: 'An unknown error occurred',
    type: 'unknown_error'
  };
};

/**
 * Validate request data
 */
export const validateRequestData = (data: any, requiredFields: string[]) => {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
};
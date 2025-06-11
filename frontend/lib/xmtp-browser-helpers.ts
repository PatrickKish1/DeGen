export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}


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
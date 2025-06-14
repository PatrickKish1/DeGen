export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}


/**
 * Get database path for XMTP client storage - Browser version
 * In the browser, we don't use file paths but instead use IndexedDB
 * so we just need to return a unique string identifier
 */
export const getDbPath = (description: string = "xmtp"): string => {
  return `${description}-db`;
};
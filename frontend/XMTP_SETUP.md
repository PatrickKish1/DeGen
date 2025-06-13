# XMTP Integration Setup

This document provides instructions for setting up XMTP integration in the Belgrade frontend application.

## Environment Configuration

Create a `.env.local` file in the frontend directory with the following variables:

```
# XMTP Configuration for Lite Mode
XMTP_WALLET_KEY=  # Private key of the wallet used for XMTP in Lite mode
XMTP_ENCRYPTION_KEY=  # Encryption key for XMTP client
XMTP_ENV=dev  # dev or production

# Network Configuration
NETWORK_ID=base-sepolia  # base-sepolia or base-mainnet

# AI Provider
GROQ_API_KEY=  # Your Groq API key for AI responses

# Optional: USDC Configuration
USDC_CONTRACT_ADDRESS=  # USDC contract address for the selected network
```

## Generating XMTP Keys

You can generate random XMTP keys using the helper function in `lib/xmtp-browser-helpers.ts`:

```typescript
import { generateEncryptionKey } from '@/lib/xmtp-browser-helpers';

// In browser console or in a script
const key = generateEncryptionKey();
console.log(key);
```

For the wallet key, you'll need to use a private key of an Ethereum wallet. For testing, you can generate a new one using ethers.js or other wallet libraries.

## Testing XMTP Integration

1. After setting up the environment variables, restart the development server:
   ```
   npm run dev
   ```

2. Navigate to the Messages tab in the UI

3. Use the "Lite" mode for using the configured environment variables, or switch to "Pro" mode to provide your own wallet and encryption keys.

4. For AI chat, you need a valid GROQ API key in the environment variables.

5. For P2P chat, you need to know the wallet address of the recipient.

## Troubleshooting

If you see "Initialize XMTP to start P2P messaging" or similar messages, it means the XMTP client isn't properly initialized. Check that:

1. Your environment variables are correctly set
2. The server API routes are working properly (check the Network tab in browser dev tools)
3. The wallet key and encryption key formats are valid

For more information, refer to the [XMTP documentation](https://docs.xmtp.org/). 
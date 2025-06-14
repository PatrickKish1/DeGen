import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get configuration from environment variables
    const config = {
      walletKey: process.env.XMTP_WALLET_KEY || '',
      encryptionKey: process.env.XMTP_ENCRYPTION_KEY || '',
      env: (process.env.XMTP_ENV as 'dev' | 'production') || 'dev',
      groqApiKey: process.env.GROQ_API_KEY || '',
      networkId: process.env.NETWORK_ID || 'base-sepolia'
    };

    // Validate required environment variables
    const requiredFields = ['walletKey', 'encryptionKey', 'groqApiKey'];
    const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing environment variables: ${missingFields.map(f => `XMTP_${f.toUpperCase()}`).join(', ')}`,
          missingFields 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        walletKey: config.walletKey,
        encryptionKey: config.encryptionKey,
        env: config.env,
        groqApiKey: config.groqApiKey,
        networkId: config.networkId
      }
    });

  } catch (error) {
    console.error('Error getting environment config:', error);
    return NextResponse.json(
      { error: 'Failed to get environment configuration' },
      { status: 500 }
    );
  }
}
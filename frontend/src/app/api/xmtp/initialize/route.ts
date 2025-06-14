/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { initializeXMTPClient, handleAPIError } from '@/lib/xmtp-node-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletKey, encryptionKey, env = 'dev' } = body;

    if (!walletKey || !encryptionKey) {
      return NextResponse.json(
        { error: 'Missing walletKey or encryptionKey' },
        { status: 400 }
      );
    }

    const { client, address, inboxId } = await initializeXMTPClient({
      walletKey,
      encryptionKey,
      env,
      description: `client_${Date.now()}`
    });

    // Store client instance in memory or database
    // For demo purposes, we'll return the connection info
    
    return NextResponse.json({
      success: true,
      address,
      inboxId,
      message: 'XMTP client initialized successfully'
    });

  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { initializeXMTPClient } from '@/lib/xmtp-node-helpers';
import { USDCHandler } from '@/lib/usdc-service';
import { ContentTypeWalletSendCalls } from '@xmtp/content-type-wallet-send-calls';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromAddress, toAddress, amount, conversationId } = body;

    if (!fromAddress || !toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAddress, toAddress, amount' },
        { status: 400 }
      );
    }

    // Get network and initialize USDC handler
    const networkId = process.env.NETWORK_ID || 'base-sepolia';
    const usdcHandler = new USDCHandler(networkId);

    // Validate the transaction
    const validation = usdcHandler.validateTransfer(fromAddress, toAddress, amount);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid transaction: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse amount to contract format (6 decimals for USDC)
    const amountInDecimals = usdcHandler.parseAmount(amount);

    // Create wallet send calls
    const walletSendCalls = usdcHandler.createUSDCTransferCalls(
      toAddress, // recipient
      fromAddress, // sender
      amountInDecimals
    );

    // If conversationId is provided, send the transaction request via XMTP
    if (conversationId) {
      try {
        const config = {
          walletKey: process.env.XMTP_WALLET_KEY || '',
          encryptionKey: process.env.XMTP_ENCRYPTION_KEY || '',
          env: (process.env.XMTP_ENV as 'dev' | 'production') || 'dev'
        };

        const { client } = await initializeXMTPClient(config);
        const conversation = await client.conversations.getConversationById(conversationId);
        
        if (conversation) {
          // Send transaction request with proper content type
          await conversation.send(`${walletSendCalls}`, ContentTypeWalletSendCalls);
        }
      } catch (error) {
        console.error('Error sending transaction via XMTP:', error);
        // Continue with the response even if XMTP sending fails
      }
    }

    return NextResponse.json({
      success: true,
      transaction: walletSendCalls,
      details: {
        from: fromAddress,
        to: toAddress,
        amount: amount,
        amountInDecimals: amountInDecimals,
        network: networkId,
        token: 'USDC'
      }
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
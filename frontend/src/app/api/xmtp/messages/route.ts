/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { initializeXMTPClient, handleAPIError } from '@/lib/xmtp-node-helpers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletKey = searchParams.get('walletKey');
    const encryptionKey = searchParams.get('encryptionKey');
    const conversationId = searchParams.get('conversationId');
    const env = (searchParams.get('env') as 'dev' | 'production') || 'dev';

    if (!walletKey || !encryptionKey || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { client } = await initializeXMTPClient({
      walletKey,
      encryptionKey,
      env
    });

    const conversation = await client.conversations.getConversationById(conversationId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = await conversation.messages();
    
    // Handle messages properly - they should be DecodedMessage objects, not strings
    const messageData = messages.map(msg => {
      // Check if msg is actually a DecodedMessage object
      if (typeof msg === 'string') {
        // Fallback for unexpected string messages
        return {
          id: Date.now().toString() + Math.random(),
          content: msg,
          senderInboxId: 'unknown',
          sentAt: new Date().toISOString(),
          contentType: 'text'
        };
      }
      
      // Handle proper DecodedMessage objects
      return {
        id: msg.id || Date.now().toString() + Math.random(),
        content: msg.content || '',
        senderInboxId: msg.senderInboxId || 'unknown',
        sentAt: msg.sentAt ? (msg.sentAt instanceof Date ? msg.sentAt.toISOString() : msg.sentAt) : new Date().toISOString(),
        contentType: msg.contentType?.typeId || 'text'
      };
    });

    return NextResponse.json({
      success: true,
      messages: messageData,
      count: messages.length
    });

  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletKey, encryptionKey, env = 'dev', conversationId, content, contentType = 'text' } = body;

    if (!walletKey || !encryptionKey || !conversationId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { client } = await initializeXMTPClient({
      walletKey,
      encryptionKey,
      env
    });

    const conversation = await client.conversations.getConversationById(conversationId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Send message
    const sentMessage = await conversation.send(content);

    // Handle the sent message response properly
    const messageResponse = {
      id: sentMessage || Date.now().toString(),
      content: typeof sentMessage === 'string' ? sentMessage : (sentMessage || content),
      senderInboxId: client.inboxId,
      sentAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: messageResponse
    });

  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
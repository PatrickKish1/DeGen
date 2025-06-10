import { NextRequest, NextResponse } from 'next/server';
import { initializeXMTPClient, handleAPIError } from '@/lib/xmtp-node-helpers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletKey = searchParams.get('walletKey');
    const encryptionKey = searchParams.get('encryptionKey');
    const env = (searchParams.get('env') as 'dev' | 'production') || 'dev';

    if (!walletKey || !encryptionKey) {
      return NextResponse.json(
        { error: 'Missing walletKey or encryptionKey' },
        { status: 400 }
      );
    }

    const { client } = await initializeXMTPClient({
      walletKey,
      encryptionKey,
      env
    });

    // Sync conversations
    await client.conversations.sync();
    
    // Get all conversations
    const conversations = await client.conversations.list();
    
    const conversationData = conversations.map(conv => {
      // Handle both DM and Group conversation types
      const baseData = {
        id: conv.id,
        createdAt: conv.createdAt,
        lastMessage: conv.lastMessage,
      };

      // Check if it's a DM or Group conversation
      if ('peerInboxId' in conv) {
        // It's a DM
        return {
          ...baseData,
          peerInboxId: conv.peerInboxId,
          isGroupChat: false,
          topic: conv.id, // fallback to id if topic doesn't exist
        };
      } else {
        // It's a Group
        return {
          ...baseData,
          peerInboxId: null, // Groups don't have a single peer
          isGroupChat: true,
          topic: conv.id, // Groups use id instead of topic
          groupName: ('name' in conv) ? conv.name : 'Group Chat',
          memberCount: ('memberInboxIds' in conv) ? conv.memberInboxIds || 0 : 0,
        };
      }
    });

    return NextResponse.json({
      success: true,
      conversations: conversationData,
      count: conversations.length
    });

  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletKey, encryptionKey, env = 'dev', peerAddress } = body;

    if (!walletKey || !encryptionKey || !peerAddress) {
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

    // Create new DM conversation
    const conversation = await client.conversations.newDm(peerAddress);
    
    // Send welcome message
    await conversation.send('👋 Hello! I\'m your AI assistant. Try /help to see available commands.');

    // Return conversation data based on type
    const conversationData = {
      id: conversation.id,
      createdAt: conversation.createdAt,
      peerInboxId: 'peerInboxId' in conversation ? conversation.peerInboxId : null,
      isGroupChat: false,
      topic: ('topic' in conversation) ? conversation.topic : conversation.id,
    };

    return NextResponse.json({
      success: true,
      conversation: conversationData
    });

  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
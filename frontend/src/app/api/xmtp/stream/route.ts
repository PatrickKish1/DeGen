import { NextRequest } from 'next/server';
import { initializeXMTPClient, handleAPIError } from '@/lib/xmtp-node-helpers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletKey = searchParams.get('walletKey');
  const encryptionKey = searchParams.get('encryptionKey');
  const env = (searchParams.get('env') as 'dev' | 'production') || 'dev';

  if (!walletKey || !encryptionKey) {
    return new Response('Missing walletKey or encryptionKey', { status: 400 });
  }

  // Create a server-sent events stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { client } = await initializeXMTPClient({
          walletKey,
          encryptionKey,
          env
        });

        // Start streaming messages
        const messageStream = await client.conversations.streamAllMessages();
        
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

        for await (const message of messageStream) {
          // Add null checks for message and its properties
          if (!message) {
            continue;
          }

          // Check if message is from a different sender
          if (message.senderInboxId && message.senderInboxId !== client.inboxId) {
            const messageData = {
              type: 'message',
              id: message.id || Date.now().toString() + Math.random(),
              content: message.content || '',
              senderInboxId: message.senderInboxId || 'unknown',
              conversationId: message.conversationId || 'unknown',
              sentAt: message.sentAt ? (message.sentAt instanceof Date ? message.sentAt.toISOString() : message.sentAt) : new Date().toISOString(),
              timestamp: new Date().toISOString()
            };

            controller.enqueue(`data: ${JSON.stringify(messageData)}\n\n`);
          }
        }
      } catch (error) {
        const errorData = handleAPIError(error);
        controller.enqueue(`data: ${JSON.stringify({ ...errorData })}\n\n`);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
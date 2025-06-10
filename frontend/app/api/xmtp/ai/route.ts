
import { NextRequest, NextResponse } from 'next/server';
import { initializeXMTPClient, handleAPIError } from '@/lib/xmtp-node-helpers';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, senderAddress, conversationId, walletKey, encryptionKey, env = 'dev' } = body;

    if (!message || !senderAddress) {
      return NextResponse.json(
        { error: 'Missing message or senderAddress' },
        { status: 400 }
      );
    }

    // Process AI command
    let response = '';
    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage === '/help') {
      response = `🤖 **Available Commands:**

💰 \`/balance\` - Check your USDC balance
💸 \`/tx <amount>\` - Send USDC to the agent
❓ \`/help\` - Show this help message
📊 \`/status\` - System status

**Ask me anything about:**
• DeFi protocols and strategies
• Blockchain transactions
• Market insights
• Cryptocurrency questions

Just type your question naturally!`;
    } else if (lowerMessage === '/status') {
      response = `📊 **System Status:**

🌐 Network: Base Sepolia
💰 Token: USDC
🤖 Agent: Active
📞 XMTP: Connected

All systems operational! ✅`;
    } else if (lowerMessage === '/balance') {
      // Mock balance check
      response = `💰 Your USDC balance: 125.50 USDC`;
    } else if (lowerMessage.startsWith('/tx ')) {
      const parts = message.split(' ');
      if (parts.length < 2) {
        response = "❌ Please provide an amount. Usage: /tx <amount>";
      } else {
        const amount = parseFloat(parts[1]);
        if (isNaN(amount) || amount <= 0) {
          response = "❌ Please provide a valid amount. Usage: /tx <amount>";
        } else {
          response = `🔄 Preparing transaction for ${amount} USDC...`;
          // Here you would create the actual transaction
        }
      }
    } else {
      // Use Groq for general AI responses
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are a helpful DeFi and blockchain assistant. Keep responses concise but informative. Help users with DeFi protocols, blockchain transactions, and crypto questions.`
            },
            {
              role: "user",
              content: message
            }
          ],
          model: "llama3-8b-8192",
          temperature: 0.7,
          max_tokens: 500,
        });

        response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";
      } catch (error) {
        console.error('Groq API error:', error);
        response = "❌ Sorry, I encountered an error processing your request. Please try again.";
      }
    }

    // If we have conversation details, send the response back via XMTP
    if (conversationId && walletKey && encryptionKey) {
      try {
        const { client } = await initializeXMTPClient({
          walletKey,
          encryptionKey,
          env
        });

        const conversation = await client.conversations.getConversationById(conversationId);
        if (conversation) {
          await conversation.send(response);
        }
      } catch (error) {
        console.error('Failed to send XMTP response:', error);
      }
    }

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
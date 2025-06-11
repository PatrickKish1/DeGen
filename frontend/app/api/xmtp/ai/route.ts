import { USDCHandler } from '@/lib/usdc-service';
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful DeFi and blockchain assistant integrated with XMTP messaging on the Base network. You can help users with:

**🔧 Available Commands:**
- /balance - Check USDC balance on Base
- /tx <amount> - Initiate USDC transfer (e.g., /tx 0.1)
- /status - Check system status and network health
- /help - Show available commands

**💡 General Assistance:**
- Explain DeFi concepts and protocols
- Provide blockchain guidance
- Answer cryptocurrency questions
- Help with Base network transactions

**🗣️ Communication Style:**
- Keep responses concise and mobile-friendly
- Be friendly, professional, and supportive
- Always prioritize user safety
- Provide clear, actionable guidance

Remember: You're communicating through XMTP, so responses should be mobile-friendly and easy to read in a chat interface.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, senderAddress } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    // Handle specific commands
    if (message.toLowerCase().trim() === '/balance' && senderAddress) {
      try {
        const networkId = process.env.NETWORK_ID || 'base-sepolia';
        const usdcHandler = new USDCHandler(networkId);
        const balance = await usdcHandler.getUSDCBalance(senderAddress);
        
        return NextResponse.json({
          success: true,
          response: `💰 Your USDC balance is: ${balance} USDC\n\nNetwork: ${networkId === 'base-sepolia' ? 'Base Sepolia (Testnet)' : 'Base Mainnet'}`
        });
      } catch (error) {
        return NextResponse.json({
          success: true,
          response: `❌ Unable to fetch balance. Please check your wallet address and try again.`
        });
      }
    }

    if (message.toLowerCase().trim() === '/status') {
      const networkId = process.env.NETWORK_ID || 'base-sepolia';
      return NextResponse.json({
        success: true,
        response: `✅ System Status: Online\n🌐 Network: ${networkId === 'base-sepolia' ? 'Base Sepolia (Testnet)' : 'Base Mainnet'}\n💬 XMTP: Connected\n🤖 AI: Active\n\nAll systems operational!`
      });
    }

    if (message.toLowerCase().trim() === '/help') {
      return NextResponse.json({
        success: true,
        response: `🤖 **Available Commands:**\n\n💰 **/balance** - Check your USDC balance\n💸 **/tx <amount>** - Send USDC (e.g., /tx 0.1)\n📊 **/status** - System status\n❓ **/help** - Show this help\n\n**General Chat:**\nAsk me anything about DeFi, blockchain, or cryptocurrencies!\n\nExample: "How does Uniswap work?" or "What is yield farming?"`
      });
    }

    // Handle transaction commands
    if (message.toLowerCase().startsWith('/tx ')) {
      const amount = parseFloat(message.split(' ')[1]);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({
          success: true,
          response: `❌ Invalid amount. Please use: /tx <amount>\n\nExample: /tx 0.1 (to send 0.1 USDC)`
        });
      }

      return NextResponse.json({
        success: true,
        response: `💸 **Transaction Preview**\n\nAmount: ${amount} USDC\nNetwork: Base\nNote: This will create a transaction request that you can approve in your wallet.\n\nUse this command in a P2P chat to send USDC to that person.`
      });
    }

    // Regular AI chat processing
    const messages: GroqMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages,
        temperature: 0.7,
        max_tokens: 400,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Error processing AI message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process message';
    
    return NextResponse.json({
      success: true,
      response: `❌ Sorry, I encountered an error: ${errorMessage}`
    });
  }
}
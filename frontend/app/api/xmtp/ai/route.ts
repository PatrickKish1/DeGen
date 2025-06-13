import { NextRequest, NextResponse } from 'next/server';

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

    // Get Groq API key from environment
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Detect message type for better AI responses
    const messageType = detectMessageType(message);
    const aiConfig = getAIResponseConfig(messageType);

    // Create enhanced prompt with context
    const systemPrompt = `You are a helpful DeFi and blockchain assistant integrated with XMTP messaging on the Base network. You can help users with:

**🔧 Available Commands:**
- /balance - Check USDC balance on Base
- /tx <amount> - Initiate USDC transfer (e.g., /tx 0.1)
- /status - Check system status and network health
- /help - Show available commands

**💡 Assistance Areas:**
- DeFi protocols and strategies
- Base network transactions
- Blockchain concepts
- Wallet operations
- Market insights

**Current Context:**
- User Address: ${senderAddress || 'Not connected'}
- Network: Base (Ethereum L2)
- Supported Token: USDC
- Communication: XMTP protocol

**Response Guidelines:**
- Keep responses concise and mobile-friendly
- Use emojis sparingly for clarity
- Be friendly and professional
- Always prioritize user safety
- Explain risks in DeFi operations

Remember: Responses appear in a chat interface, so be conversational and helpful.`;

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.max_tokens,
        top_p: aiConfig.top_p,
        stream: aiConfig.stream,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      console.error('Groq API error:', errorData);
      
      return NextResponse.json({
        response: "I'm currently experiencing some technical difficulties. Please try again in a moment, or use the quick commands for basic operations."
      });
    }

    const groqData = await groqResponse.json();
    const aiResponse = groqData.choices?.[0]?.message?.content || 
      "I apologize, but I couldn't process your request at the moment. Please try again.";

    return NextResponse.json({
      response: aiResponse,
      messageType,
      senderAddress,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI API error:', error);
    
    return NextResponse.json({
      response: "I encountered an error processing your request. Please try again or use the quick commands for basic operations.",
      error: process.env.NODE_ENV === 'development' ? `` : undefined
    });
  }
}

// Helper functions
function detectMessageType(content: string): 'command' | 'question' | 'casual' {
  const lowerContent = content.toLowerCase().trim();
  
  if (lowerContent.startsWith('/')) {
    return 'command';
  }
  
  const questionWords = ['how', 'what', 'when', 'where', 'why', 'which', 'who', 'can you', 'could you', 'explain', 'tell me'];
  const hasQuestionWord = questionWords.some(word => lowerContent.includes(word));
  const hasQuestionMark = content.includes('?');
  
  if (hasQuestionWord || hasQuestionMark) {
    return 'question';
  }
  
  return 'casual';
}

function getAIResponseConfig(messageType: 'command' | 'question' | 'casual') {
  const baseConfig = {
    model: "llama3-8b-8192",
    temperature: 0.7,
    max_tokens: 500,
    top_p: 1,
    stream: false,
  };

  switch (messageType) {
    case 'command':
      return {
        ...baseConfig,
        temperature: 0.3,
        max_tokens: 300,
      };
    case 'question':
      return {
        ...baseConfig,
        temperature: 0.7,
        max_tokens: 500,
      };
    case 'casual':
      return {
        ...baseConfig,
        temperature: 0.8,
        max_tokens: 200,
      };
    default:
      return baseConfig;
  }
}
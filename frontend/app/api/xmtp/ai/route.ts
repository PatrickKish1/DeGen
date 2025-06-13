import { NextRequest, NextResponse } from 'next/server';
import groqChatService from '@/lib/helpers/GroqService';
import type { ChatRequest, ChatResponse } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { 
      message, 
      senderAddress, 
      threadId,
      conversationHistory = []
    } = body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if service is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured - missing GROQ_API_KEY' },
        { status: 500 }
      );
    }

    // Process the message through our chat service
    const result = await groqChatService.chatWithAssistant(
      message.trim(),
      senderAddress,
      threadId
    );

    // Extract response content properly
    const responseContent = typeof result.response === 'string' 
      ? result.response 
      : result.response.content || 'No response available';

    // Format the response
    const response: ChatResponse = {
      response: responseContent,
      threadId: result.threadId,
      timestamp: result.timestamp,
      messageType: result.messageType || 'general',
      analysisType: result.analysisType || 'general',
      isDirect: result.isDirect || false,
      contextUsed: result.contextUsed || null,
      error: result.error || false
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI API route error:', error);

    // Try to get a basic error message from the service
    try {
      const fallbackResult = await groqChatService.chatWithAssistant(
        "I need help - there was an error processing my request",
        undefined,
        undefined
      );
      
      const fallbackContent = typeof fallbackResult.response === 'string'
        ? fallbackResult.response
        : fallbackResult.response.content || 'Error processing request';
      
      return NextResponse.json({
        response: "I encountered an error processing your request. Here are the available commands: /help, /status, /balance. Please try again or use one of these commands.",
        error: true,
        fallback: true,
        timestamp: new Date().toISOString(),
        threadId: fallbackResult.threadId,
        messageType: 'general' as const,
        analysisType: 'general' as const,
        originalError: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      
      return NextResponse.json({
        response: "I'm currently experiencing technical difficulties. Please try again in a moment. Available commands: /help, /status, /balance",
        error: true,
        timestamp: new Date().toISOString(),
        threadId: null,
        messageType: 'general' as const,
        analysisType: 'general' as const,
        originalError: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }, { status: 500 });
    }
  }
}

// Health check endpoint
export async function GET() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'GROQ_API_KEY not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const healthCheck = await groqChatService.healthCheck();
    
    return NextResponse.json({
      ...healthCheck,
      endpoint: 'DeFi AI Assistant API',
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: (error as Error).message,
      endpoint: 'DeFi AI Assistant API',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Conversation management endpoints
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, threadId } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'getHistory':
        const history = await groqChatService.getConversationHistory(threadId);
        return NextResponse.json({
          threadId,
          history,
          timestamp: new Date().toISOString()
        });

      case 'clearHistory':
        const result = await groqChatService.clearConversationHistory(threadId);
        return NextResponse.json({
          threadId,
          ...result,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: getHistory, clearHistory' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Conversation management error:', error);
    
    return NextResponse.json({
      error: 'Failed to manage conversation',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
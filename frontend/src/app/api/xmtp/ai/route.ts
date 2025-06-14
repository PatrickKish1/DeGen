/* eslint-disable @typescript-eslint/no-unused-vars */

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
      conversationHistory = [],
      tools = []
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

    // Process the message through our enhanced chat service with tools
    const result = await groqChatService.chatWithAssistant(
      message.trim(),
      senderAddress,
      threadId
    );

    // Extract response content properly
    const responseContent = typeof result.response === 'string' 
      ? result.response 
      : result.response.content || 'No response available';

    // Format the response with tool results
    const response: ChatResponse = {
      response: responseContent,
      threadId: result.threadId,
      timestamp: result.timestamp,
      messageType: result.messageType || 'general',
      analysisType: result.analysisType || 'general',
      isDirect: result.isDirect || false,
      contextUsed: result.contextUsed || null,
      error: result.error || false,
      toolResults: result.toolResults || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI API route error:', error);

    // Enhanced error handling with fallback
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
        response: "I encountered an error processing your request. Here are the available commands:\n\n🔧 **Financial Commands:**\n• /balance - Check wallet balances\n• /transfer <amount> <address> - Create USDC transfer\n• /gas - Check current gas prices\n\n📊 **DeFi Commands:**\n• /yields - Show yield opportunities\n• /protocols - List DeFi protocols\n• /status - Network status\n• /validate <address> - Validate address\n• /help - Show all commands\n\nPlease try again or use one of these commands.",
        error: true,
        fallback: true,
        timestamp: new Date().toISOString(),
        threadId: fallbackResult.threadId,
        messageType: 'general' as const,
        analysisType: 'general' as const,
        toolResults: [],
        originalError: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      
      return NextResponse.json({
        response: "I'm currently experiencing technical difficulties. Please try again in a moment.\n\n🔧 **Available Commands:**\n• /balance, /gas, /yields, /protocols, /status, /help\n\n💡 You can also ask questions naturally about DeFi, blockchain, or trading.",
        error: true,
        timestamp: new Date().toISOString(),
        threadId: null,
        messageType: 'general' as const,
        analysisType: 'general' as const,
        toolResults: [],
        originalError: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }, { status: 500 });
    }
  }
}

// Enhanced health check endpoint with tools information
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
      endpoint: 'Enhanced DeFi AI Assistant API',
      version: '2.0.0',
      features: [
        'Groq LLM Integration',
        'Blockchain Tools',
        'Real-time Data',
        'Base Sepolia Network',
        'USDC Operations',
        'DeFi Protocol Integration',
        'Gas Estimation',
        'Yield Opportunities',
        'Address Validation'
      ],
      capabilities: {
        naturalLanguage: true,
        commandProcessing: true,
        blockchainTools: true,
        realTimeData: true,
        conversationMemory: true,
        multiThreadSupport: true
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: (error as Error).message,
      endpoint: 'Enhanced DeFi AI Assistant API',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Enhanced conversation management endpoints
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, threadId, messageIds } = body;

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
          timestamp: new Date().toISOString(),
          hasTools: true,
          capabilities: ['blockchain_tools', 'real_time_data', 'defi_protocols']
        });

      case 'clearHistory':
        const clearResult = await groqChatService.clearConversationHistory(threadId);
        return NextResponse.json({
          threadId,
          ...clearResult,
          timestamp: new Date().toISOString()
        });

      case 'deleteMessages':
        if (!messageIds || !Array.isArray(messageIds)) {
          return NextResponse.json(
            { error: 'Message IDs array is required for deleteMessages action' },
            { status: 400 }
          );
        }
        
        const deleteResult = await groqChatService.deleteMessages(threadId, messageIds);
        return NextResponse.json({
          threadId,
          ...deleteResult,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: getHistory, clearHistory, deleteMessages' },
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

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChatGroq } from "@langchain/groq";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
  Annotation,
} from "@langchain/langgraph";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  RemoveMessage,
  trimMessages,
  ToolMessage,
} from "@langchain/core/messages";
import { v4 as uuidv4 } from 'uuid';
import type { 
  ChatRequest, 
  ChatResponse, 
  ServiceResponse, 
  GroqServiceConfig,
  ConversationState,
  ToolCall,
  ToolResult 
} from '@/types/chat';
import { blockchainTools, executeTool } from '@/lib/tools/blockchain-tools';

class GroqChatService {
  private llm: ChatGroq;
  private trimmer: any;
  private memorySaver: MemorySaver;
  private basePrompt!: ChatPromptTemplate;
  private commandPrompt!: ChatPromptTemplate;
  private marketPrompt!: ChatPromptTemplate;
  private GraphAnnotation: any;
  private workflow: any;
  private app: any;

  constructor(config?: Partial<GroqServiceConfig>) {
    const defaultConfig: GroqServiceConfig = {
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      maxTokens: 2048,
      apiKey: process.env.GROQ_API_KEY || ''
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.llm = new ChatGroq({
      model: finalConfig.model,
      temperature: finalConfig.temperature,
      maxTokens: finalConfig.maxTokens,
      apiKey: finalConfig.apiKey,
    });

    // Initialize message trimmer
    this.trimmer = trimMessages({
      maxTokens: 4000,
      strategy: "last",
      tokenCounter: (msgs: string | any[]) => msgs.length,
      includeSystem: true,
      allowPartial: false,
      startOn: "human",
    });

    // Initialize state and chat history
    this.memorySaver = new MemorySaver();
    this.initializePrompts();
    this.initializeGraph();
  }

  /**
   * Initialize prompt templates with blockchain tools information
   */
  private initializePrompts(): void {
    const toolsDescription = this.generateToolsDescription();

    // Base DeFi assistant prompt
    this.basePrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are an advanced DeFi and blockchain assistant integrated with XMTP messaging on the Base Sepolia network.
        You help users with DeFi protocols, blockchain transactions, and crypto operations safely and efficiently.

        **🎯 Your Capabilities:**
        - DeFi protocol analysis and recommendations
        - Base Sepolia network transaction guidance
        - Blockchain concept explanations
        - Market insights and risk assessment
        - Wallet operation assistance
        - XMTP messaging integration
        - Real-time blockchain tool execution

        **🔧 Available Blockchain Tools:**
        ${toolsDescription}

        **📊 Current Context:**
        - User Address: {userAddress}
        - Network: Base Sepolia (Ethereum L2 Testnet)
        - Protocol: XMTP messaging
        - Supported Assets: USDC, ETH
        - Analysis Type: {analysisType}
        - Additional Context: {contextData}

        **🛡️ Safety Guidelines:**
        - Always emphasize security best practices
        - Warn about DeFi risks and impermanent loss
        - Verify transaction details before execution
        - Recommend using reputable, audited protocols
        - Advise users to never share private keys
        - Always validate addresses before transactions

        **🤖 Tool Usage:**
        When users ask about balances, transactions, or DeFi operations, use the appropriate tools to provide real-time data.
        Always explain what you're doing when using tools and interpret the results for the user.

        **📱 Quick Commands:**
        - /balance - Check wallet balances
        - /transfer [amount] [address] - Create transfer transaction
        - /gas - Check current gas prices
        - /yields - Show yield opportunities
        - /protocols - List DeFi protocols
        - /status - Network status
        - /validate [address] - Validate wallet address
        - /help - Show all commands

        Provide helpful, accurate, and context-aware responses. Keep responses concise but informative for mobile chat interface.
        Use tools proactively when users ask questions that require real-time blockchain data.`
      ),
      new MessagesPlaceholder("messages"),
    ]);

    // Command processing prompt
    this.commandPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are processing a command for a DeFi user on Base Sepolia network with access to blockchain tools.
        
        **User Context:**
        - Address: {userAddress}
        - Command: {command}
        - Parameters: {parameters}
        
        **Available Tools:**
        ${toolsDescription}
        
        **Command Processing Rules:**
        - For /balance: Use get_balance tool to fetch real balances
        - For /transfer: Use create_transfer tool with validation
        - For /gas: Use estimate_gas tool for current rates
        - For /yields: Use get_yield_opportunities tool
        - For /protocols: Use get_protocol_info tool
        - For /status: Use get_network_status tool
        - For /validate: Use validate_address tool
        - For /help: Provide comprehensive command list with examples
        
        Always use appropriate tools for real data and provide clear explanations of results.`
      ),
      new MessagesPlaceholder("messages"),
    ]);

    // Market analysis prompt
    this.marketPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are providing DeFi market analysis and insights with access to real-time blockchain tools.
        
        **Analysis Focus:**
        - Current DeFi trends and opportunities
        - Base Sepolia ecosystem updates
        - Yield farming and liquidity mining prospects
        - Risk assessment for DeFi protocols
        - Gas optimization strategies
        
        **Available Tools:**
        ${toolsDescription}
        
        **User Portfolio Context:**
        - Address: {userAddress}
        - Network: Base Sepolia
        - Primary Assets: USDC, ETH
        
        Use tools to fetch real-time data and provide actionable insights with clear risk assessments and recommendations.`
      ),
      new MessagesPlaceholder("messages"),
    ]);
  }

  /**
   * Generate tools description for prompts
   */
  private generateToolsDescription(): string {
    return blockchainTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');
  }

  /**
   * Initialize the LangGraph state and workflow
   */
  private initializeGraph(): void {
    // Define state annotation
    this.GraphAnnotation = Annotation.Root({
      ...MessagesAnnotation.spec,
      userAddress: Annotation<string>(),
      analysisType: Annotation<string>(),
      contextData: Annotation<string>(),
      command: Annotation<string>(),
      parameters: Annotation<string>(),
      toolResults: Annotation<ToolResult[]>(),
    });

    // Define tool execution function
    const executeTools = async (state: ConversationState & { toolResults?: ToolResult[] }) => {
      const lastMessage = state.messages[state.messages.length - 1];
      const toolCalls = this.extractToolCalls(lastMessage?.content || '');
      
      if (toolCalls.length === 0) {
        return { toolResults: [] };
      }

      const toolResults: ToolResult[] = [];
      
      for (const toolCall of toolCalls) {
        try {
          const result = await executeTool(toolCall.name, toolCall.arguments, state.userAddress);
          toolResults.push({
            toolCallId: toolCall.id,
            result,
            metadata: { executedAt: new Date().toISOString() }
          });
        } catch (error) {
          toolResults.push({
            toolCallId: toolCall.id,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { toolResults };
    };

    // Define model call function
    const callModel = async (state: ConversationState & { toolResults?: ToolResult[] }) => {
      try {
        const trimmedMessages = await this.trimmer.invoke(state.messages);
        const prompt = this.selectPrompt(state.analysisType);
        
        // Add tool results to context if available
        let contextData = state.contextData || 'No additional context';
        if (state.toolResults && state.toolResults.length > 0) {
          const toolResultsText = state.toolResults.map(tr => 
            `Tool ${tr.toolCallId}: ${tr.error || JSON.stringify(tr.result)}`
          ).join('\n');
          contextData += `\n\nTool Results:\n${toolResultsText}`;
        }

        const chain = prompt.pipe(this.llm);
        
        const response = await chain.invoke({
          messages: trimmedMessages,
          userAddress: state.userAddress || 'Not connected',
          analysisType: state.analysisType || 'general',
          contextData,
          command: state.command || '',
          parameters: state.parameters || '',
        });

        return { messages: [response] };
      } catch (error) {
        console.error('Error in model call:', error);
        throw error;
      }
    };

    // Create workflow
    this.workflow = new StateGraph(this.GraphAnnotation)
      .addNode("executeTools", executeTools)
      .addNode("model", callModel)
      .addEdge(START, "executeTools")
      .addEdge("executeTools", "model")
      .addEdge("model", END);

    // Compile application with memory
    this.app = this.workflow.compile({ checkpointer: this.memorySaver });
  }

  /**
   * Extract tool calls from message content
   */
  private extractToolCalls(content: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    
    // Check for command-style tool calls
    const commandMatch = content.match(/^\/(\w+)(?:\s+(.+))?$/);
    if (commandMatch) {
      const command = commandMatch[1];
      const params = commandMatch[2] || '';
      
      switch (command) {
        case 'balance':
          toolCalls.push({
            id: uuidv4(),
            name: 'get_balance',
            arguments: params ? { address: params.trim() } : {}
          });
          break;
        case 'transfer':
          const transferParts = params.split(' ');
          if (transferParts.length >= 2) {
            toolCalls.push({
              id: uuidv4(),
              name: 'create_transfer',
              arguments: {
                amount: transferParts[0],
                toAddress: transferParts[1]
              }
            });
          }
          break;
        case 'gas':
          toolCalls.push({
            id: uuidv4(),
            name: 'estimate_gas',
            arguments: { transactionType: 'transfer' }
          });
          break;
        case 'yields':
          toolCalls.push({
            id: uuidv4(),
            name: 'get_yield_opportunities',
            arguments: {}
          });
          break;
        case 'protocols':
          toolCalls.push({
            id: uuidv4(),
            name: 'get_protocol_info',
            arguments: {}
          });
          break;
        case 'status':
          toolCalls.push({
            id: uuidv4(),
            name: 'get_network_status',
            arguments: {}
          });
          break;
        case 'validate':
          if (params) {
            toolCalls.push({
              id: uuidv4(),
              name: 'validate_address',
              arguments: { address: params.trim() }
            });
          }
          break;
      }
    }

    // Check for natural language tool triggers
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('balance') || lowerContent.includes('how much')) {
      toolCalls.push({
        id: uuidv4(),
        name: 'get_balance',
        arguments: {}
      });
    }
    
    if (lowerContent.includes('gas price') || lowerContent.includes('transaction cost')) {
      toolCalls.push({
        id: uuidv4(),
        name: 'get_network_status',
        arguments: {}
      });
    }
    
    if (lowerContent.includes('yield') || lowerContent.includes('farming') || lowerContent.includes('apy')) {
      toolCalls.push({
        id: uuidv4(),
        name: 'get_yield_opportunities',
        arguments: {}
      });
    }

    return toolCalls;
  }

  /**
   * Select appropriate prompt based on analysis type
   */
  private selectPrompt(analysisType?: string): ChatPromptTemplate {
    switch (analysisType?.toLowerCase()) {
      case 'command':
        return this.commandPrompt;
      case 'market':
      case 'analysis':
        return this.marketPrompt;
      default:
        return this.basePrompt;
    }
  }

  /**
   * Detect message type and extract relevant information
   */
  private analyzeMessage(message: string) {
    const messageType = this.detectMessageType(message);
    
    let command = '';
    let parameters = '';
    
    if (messageType === 'command') {
      const parts = message.trim().split(' ');
      command = parts[0];
      parameters = parts.slice(1).join(' ');
    }

    const analysisType = this.determineAnalysisType(message, messageType);

    return {
      messageType,
      analysisType,
      command,
      parameters
    };
  }

  /**
   * Detect message type
   */
  private detectMessageType(content: string): 'general' | 'command' | 'question' | 'casual' {
    const lowerContent = content.toLowerCase().trim();
    
    if (lowerContent.startsWith('/')) {
      return 'command';
    }
    
    const questionIndicators = [
      'how', 'what', 'when', 'where', 'why', 'which', 'who', 
      'can you', 'could you', 'would you', 'should i', 
      'explain', 'tell me', 'help me', 'show me',
      'is it', 'are there', 'do you', 'does it'
    ];
    
    const hasQuestionIndicator = questionIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );
    const hasQuestionMark = content.includes('?');
    
    if (hasQuestionIndicator || hasQuestionMark) {
      return 'question';
    }
    
    return 'casual';
  }

  /**
   * Determine analysis type from message content
   */
  private determineAnalysisType(message: string, messageType: string): 'general' | 'technical' | 'market' {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('market') || 
        messageLower.includes('price') || 
        messageLower.includes('yield') ||
        messageLower.includes('apy') ||
        messageLower.includes('farming')) {
      return 'market';
    }

    if (messageLower.includes('technical') ||
        messageLower.includes('analysis') ||
        messageLower.includes('chart')) {
      return 'technical';
    }
    
    return 'general';
  }

  /**
   * Process direct commands without AI
   */
  private processDirectCommand(command: string, parameters: string, userAddress?: string) {
    const cmd = command.toLowerCase();

    switch (cmd) {
      case '/help':
        return {
          response: `🔧 **Available Commands:**

**💰 Financial:**
• /balance [address] - Check USDC & ETH balance
• /transfer <amount> <address> - Create USDC transfer
• /gas - Check current gas prices

**📊 DeFi & Analysis:**
• /yields [minApy] - Show yield opportunities
• /protocols [name] - List DeFi protocols info
• /status - Network & system status

**🔍 Utility:**
• /validate <address> - Validate wallet address
• /help - This command list

💡 You can also ask me anything about DeFi, Base network, or blockchain concepts!
I have access to real-time blockchain tools for accurate data.`,
          isDirect: true
        };

      case '/status':
        return {
          response: `✅ **System Status**

🌐 **Base Sepolia Network:** Operational
🔗 **XMTP Protocol:** Connected
💰 **USDC Support:** Active
🤖 **AI Assistant:** Online with Blockchain Tools
⚡ **Tools Available:** ${blockchainTools.length} tools ready

${userAddress ? `👤 **Your Address:** ${userAddress.slice(0, 8)}...${userAddress.slice(-6)}` : '🔌 **Wallet:** Not connected'}

All systems operational! Use /help to see available commands. 🚀`,
          isDirect: true
        };

      default:
        return null;
    }
  }

  /**
   * Main chat processing function
   */
  public async chatWithAssistant(
    message: string, 
    userAddress?: string, 
    threadId?: string
  ): Promise<ServiceResponse> {
    try {
      const messageAnalysis = this.analyzeMessage(message);
      
      // Try direct command processing first for simple commands
      if (messageAnalysis.messageType === 'command') {
        const directResponse = this.processDirectCommand(
          messageAnalysis.command, 
          messageAnalysis.parameters, 
          userAddress
        );
        
        if (directResponse?.isDirect) {
          return {
            response: { content: directResponse.response },
            messageType: messageAnalysis.messageType,
            analysisType: messageAnalysis.analysisType,
            threadId: threadId || uuidv4(),
            timestamp: new Date().toISOString(),
            isDirect: true
          };
        }
      }

      // Prepare input state for AI processing with tools
      const input = {
        messages: [{ role: 'user', content: message }],
        userAddress: userAddress || 'Not connected',
        analysisType: messageAnalysis.analysisType,
        contextData: JSON.stringify({
          messageType: messageAnalysis.messageType,
          hasWallet: !!userAddress,
          network: 'Base Sepolia',
          toolsAvailable: blockchainTools.map(t => t.name)
        }),
        command: messageAnalysis.command,
        parameters: messageAnalysis.parameters,
        toolResults: []
      };

      // Generate config with thread ID
      const config = {
        configurable: {
          thread_id: threadId || uuidv4()
        }
      };

      // Get response from AI model with tool execution
      const response = await this.app.invoke(input, config);
      const finalState = response;

      return {
        response: finalState.messages[finalState.messages.length - 1],
        messageType: messageAnalysis.messageType,
        analysisType: messageAnalysis.analysisType,
        threadId: config.configurable.thread_id,
        timestamp: new Date().toISOString(),
        isDirect: false,
        toolResults: finalState.toolResults || [],
        contextUsed: {
          hasWallet: !!userAddress,
          network: 'Base Sepolia',
          toolsExecuted: finalState.toolResults?.length || 0
        }
      };

    } catch (error) {
      console.error('Error in chat processing:', error);
      
      return {
        response: { 
          content: "I'm experiencing some technical difficulties right now. You can still use basic commands like /help, /status, or try asking your question again in a moment." 
        },
        messageType: 'general' as const,
        analysisType: 'general' as const,
        error: true,
        timestamp: new Date().toISOString(),
        threadId: threadId || uuidv4()
      };
    }
  }

  /**
   * Get conversation history for a thread
   */
  public async getConversationHistory(threadId: string): Promise<any> {
    try {
      const checkpoint = await this.memorySaver.get({ configurable: { thread_id: threadId } });
      
      if (checkpoint && 'channel_values' in checkpoint) {
        return (checkpoint as any).channel_values || { messages: [] };
      }
      
      return { messages: [] };
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return { messages: [] };
    }
  }

  /**
   * Clear conversation history for a thread
   */
  public async clearConversationHistory(threadId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentState = await this.app.getState({ configurable: { thread_id: threadId } });
      
      if (!currentState?.values?.messages || currentState.values.messages.length === 0) {
        return { success: true, message: 'No conversation history to clear' };
      }

      const removeMessages = currentState.values.messages.map((msg: any) => 
        new RemoveMessage({ id: msg.id })
      );

      await this.app.updateState(
        { configurable: { thread_id: threadId } },
        { messages: removeMessages }
      );

      return { success: true, message: 'Conversation history cleared' };
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      
      try {
        await this.app.updateState(
          { configurable: { thread_id: threadId } },
          { messages: [] }
        );
        return { success: true, message: 'Conversation history reset' };
      } catch (fallbackError) {
        console.error('Fallback clear also failed:', fallbackError);
        throw new Error('Failed to clear conversation history');
      }
    }
  }

  /**
   * Delete specific messages by IDs
   */
  public async deleteMessages(threadId: string, messageIds: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const removeMessages = messageIds.map(id => new RemoveMessage({ id }));
      
      await this.app.updateState(
        { configurable: { thread_id: threadId } },
        { messages: removeMessages }
      );

      return { 
        success: true, 
        message: `Deleted ${messageIds.length} message${messageIds.length === 1 ? '' : 's'}` 
      };
    } catch (error) {
      console.error('Error deleting messages:', error);
      throw error;
    }
  }

  /**
   * Health check for the service with tools
   */
  public async healthCheck(): Promise<any> {
    try {
      const testResponse = await this.llm.invoke([
        new SystemMessage("Respond with 'OK' if you're working properly."),
        new HumanMessage("Health check")
      ]);
      
      return {
        status: 'healthy',
        llm: 'connected',
        memory: 'initialized',
        tools: `${blockchainTools.length} tools available`,
        toolNames: blockchainTools.map(t => t.name),
        timestamp: new Date().toISOString(),
        testResponse: testResponse.content
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const groqChatService = new GroqChatService();
Object.freeze(groqChatService);

export default groqChatService;
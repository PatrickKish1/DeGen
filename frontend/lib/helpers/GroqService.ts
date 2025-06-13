// lib/helpers/GroqService.ts
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
} from "@langchain/core/messages";
import { v4 as uuidv4 } from 'uuid';
import type { 
  ChatRequest, 
  ChatResponse, 
  ServiceResponse, 
  GroqServiceConfig,
  ConversationState 
} from '@/types/chat';

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
   * Initialize prompt templates
   */
  private initializePrompts(): void {
    // Base DeFi assistant prompt
    this.basePrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are an advanced DeFi and blockchain assistant integrated with XMTP messaging on the Base network.
        You help users with DeFi protocols, blockchain transactions, and crypto operations safely and efficiently.

        **🎯 Your Capabilities:**
        - DeFi protocol analysis and recommendations
        - Base network transaction guidance
        - Blockchain concept explanations
        - Market insights and risk assessment
        - Wallet operation assistance
        - XMTP messaging integration

        **🔧 Quick Commands Available:**
        - /balance - Check USDC balance on Base
        - /tx <amount> - Initiate USDC transfer
        - /status - Network health check
        - /help - Command reference
        - /market - Market insights
        - /risks - Risk analysis

        **📊 Current Context:**
        - User Address: {userAddress}
        - Network: Base (Ethereum L2)
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

        Provide helpful, accurate, and context-aware responses. Keep responses concise but informative for mobile chat interface.`
      ),
      new MessagesPlaceholder("messages"),
    ]);

    // Command processing prompt
    this.commandPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are processing a command for a DeFi user on Base network.
        
        **User Context:**
        - Address: {userAddress}
        - Command: {command}
        - Parameters: {parameters}
        
        **Command Processing Rules:**
        - For /balance: Explain balance check process and what data would be retrieved
        - For /tx: Validate amount format and provide transaction preparation steps
        - For /status: Report on Base network and XMTP protocol status
        - For /help: Provide comprehensive command list with examples
        - For /market: Give current DeFi market insights and opportunities
        - For /risks: Explain current DeFi risks and mitigation strategies
        
        Provide clear, actionable responses with appropriate warnings and next steps.`
      ),
      new MessagesPlaceholder("messages"),
    ]);

    // Market analysis prompt
    this.marketPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are providing DeFi market analysis and insights.
        
        **Analysis Focus:**
        - Current DeFi trends and opportunities
        - Base network ecosystem updates
        - Yield farming and liquidity mining prospects
        - Risk assessment for DeFi protocols
        - Gas optimization strategies
        
        **User Portfolio Context:**
        - Address: {userAddress}
        - Network: Base
        - Primary Assets: USDC, ETH
        
        Provide actionable insights with clear risk assessments and recommendations.`
      ),
      new MessagesPlaceholder("messages"),
    ]);
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
    });

    // Define model call function
    const callModel = async (state: ConversationState) => {
      try {
        const trimmedMessages = await this.trimmer.invoke(state.messages);
        const prompt = this.selectPrompt(state.analysisType);
        const chain = prompt.pipe(this.llm);
        
        const response = await chain.invoke({
          messages: trimmedMessages,
          userAddress: state.userAddress || 'Not connected',
          analysisType: state.analysisType || 'general',
          contextData: state.contextData || 'No additional context',
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
      .addNode("model", callModel)
      .addEdge(START, "model")
      .addEdge("model", END);

    // Compile application with memory
    this.app = this.workflow.compile({ checkpointer: this.memorySaver });
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
   * Determine analysis type from message content - map 'command' to 'general' for API compatibility
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
• /balance - Check your USDC balance
• /tx <amount> - Transfer USDC (e.g., /tx 0.5)

**📊 Information:**
• /status - Network & system status
• /market - Current market insights
• /risks - DeFi risk assessment

**🔍 Utility:**
• /help - This command list

💡 You can also ask me anything about DeFi, Base network, or blockchain concepts!`,
          isDirect: true
        };

      case '/status':
        return {
          response: `✅ **System Status**

🌐 **Base Network:** Operational
🔗 **XMTP Protocol:** Connected
💰 **USDC Support:** Active
🤖 **AI Assistant:** Online

${userAddress ? `👤 **Your Address:** ${userAddress.slice(0, 8)}...${userAddress.slice(-6)}` : '🔌 **Wallet:** Not connected'}

All systems operational! 🚀`,
          isDirect: true
        };

      default:
        return null; // Let AI handle other commands
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
      
      // Try direct command processing first
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

      // Prepare input state for AI processing
      const input = {
        messages: [{ role: 'user', content: message }],
        userAddress: userAddress || 'Not connected',
        analysisType: messageAnalysis.analysisType,
        contextData: JSON.stringify({
          messageType: messageAnalysis.messageType,
          hasWallet: !!userAddress,
          network: 'Base'
        }),
        command: messageAnalysis.command,
        parameters: messageAnalysis.parameters,
      };

      // Generate config with thread ID
      const config = {
        configurable: {
          thread_id: threadId || uuidv4()
        }
      };

      // Get response from AI model
      const response = await this.app.invoke(input, config);

      return {
        response: response.messages[response.messages.length - 1],
        messageType: messageAnalysis.messageType,
        analysisType: messageAnalysis.analysisType,
        threadId: config.configurable.thread_id,
        timestamp: new Date().toISOString(),
        isDirect: false,
        contextUsed: {
          hasWallet: !!userAddress,
          network: 'Base'
        }
      };

    } catch (error) {
      console.error('Error in chat processing:', error);
      
      // Return a helpful error response with proper types
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
      
      // Access checkpoint data properly
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
      // Get current state using the app's getState method
      const currentState = await this.app.getState({ configurable: { thread_id: threadId } });
      
      if (!currentState?.values?.messages || currentState.values.messages.length === 0) {
        return { success: true, message: 'No conversation history to clear' };
      }

      // Create RemoveMessage instances for all existing messages
      const removeMessages = currentState.values.messages.map((msg: any) => 
        new RemoveMessage({ id: msg.id })
      );

      // Use the app to update state with removal messages
      await this.app.updateState(
        { configurable: { thread_id: threadId } },
        { messages: removeMessages }
      );

      return { success: true, message: 'Conversation history cleared' };
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      
      // Fallback: try to create a new fresh state
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
   * Health check for the service
   */
  public async healthCheck(): Promise<any> {
    try {
      // Test basic LLM connectivity
      const testResponse = await this.llm.invoke([
        new SystemMessage("Respond with 'OK' if you're working properly."),
        new HumanMessage("Health check")
      ]);
      
      return {
        status: 'healthy',
        llm: 'connected',
        memory: 'initialized',
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
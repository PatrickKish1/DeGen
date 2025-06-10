// import { useState, useCallback } from 'react';
// import { Client, type XmtpEnv, type DecodedMessage } from "@xmtp/xmtp-js";
// import { TransactionReferenceCodec, type TransactionReference } from "@xmtp/content-type-transaction-reference";
// import {
//   ContentTypeWalletSendCalls,
//   WalletSendCallsCodec,
//   type WalletSendCallsParams,
// } from "@xmtp/content-type-wallet-send-calls";
// import { createSigner, getEncryptionKeyFromHex } from "./helpers/client";
// import { USDCHandler } from "./usdc-service";
// import Groq from "groq-sdk";

// // Define the union type for all content types
// type ContentTypes = string | TransactionReference | WalletSendCallsParams;

// // XMTP Chat Handler Class
// export class XMTPChatHandler {
//   private client: Client<ContentTypes> | null = null;
//   private usdcHandler: USDCHandler;
//   private groq: Groq;
//   private agentAddress: string = "";
//   private conversations: Map<string, any> = new Map();

//   constructor(
//     private walletKey: string,
//     private encryptionKey: string,
//     private xmtpEnv: XmtpEnv,
//     private networkId: string,
//     private groqApiKey: string
//   ) {
//     this.usdcHandler = new USDCHandler(networkId);
//     this.groq = new Groq({
//       apiKey: groqApiKey,
//       dangerouslyAllowBrowser: true // Enable for browser usage
//     });
//   }

//   // Initialize XMTP client
//   async initialize(): Promise<void> {
//     try {
//       const signer = createSigner(this.walletKey);
//       const dbEncryptionKey = getEncryptionKeyFromHex(this.encryptionKey);

//       this.client = await Client.create(signer, {
//         dbEncryptionKey,
//         env: this.xmtpEnv,
//         codecs: [new WalletSendCallsCodec(), new TransactionReferenceCodec()],
//       }) as Client<ContentTypes>;

//       const identifier = await signer.getIdentifier();
//       this.agentAddress = identifier.identifier;

//       console.log("✓ XMTP Client initialized");
//       await this.client.conversations.sync();
//       console.log("✓ Conversations synced");

//       // Load existing conversations
//       await this.loadConversations();
//     } catch (error) {
//       console.error("Failed to initialize XMTP client:", error);
//       throw error;
//     }
//   }

//   // Load existing conversations
//   async loadConversations(): Promise<void> {
//     if (!this.client) return;

//     try {
//       const conversations = await this.client.conversations.list();
//       for (const conv of conversations) {
//         this.conversations.set(conv.id, conv);
//       }
//       console.log(`✓ Loaded ${conversations.length} conversations`);
//     } catch (error) {
//       console.error("Failed to load conversations:", error);
//     }
//   }

//   // Get agent address
//   getAgentAddress(): string {
//     return this.agentAddress;
//   }

//   // Start listening for messages
//   async startMessageListener(onMessage: (message: any) => void): Promise<void> {
//     if (!this.client) {
//       throw new Error("Client not initialized");
//     }

//     console.log("Waiting for messages...");
//     const stream = await this.client.conversations.streamAllMessages();

//     for await (const message of stream) {
//       if (
//         message?.senderInboxId.toLowerCase() === this.client.inboxId.toLowerCase() ||
//         message?.contentType?.typeId !== "text"
//       ) {
//         continue;
//       }

//       console.log(
//         `Received message: ${message.content as string} by ${message.senderInboxId}`
//       );

//       const conversation = await this.client.conversations.getConversationById(
//         message.conversationId
//       );

//       if (!conversation) {
//         console.log("Unable to find conversation, skipping");
//         continue;
//       }

//       // Cache conversation
//       this.conversations.set(conversation.id, conversation);

//       const inboxState = await this.client.preferences.inboxStateFromInboxIds([
//         message.senderInboxId,
//       ]);
//       const memberAddress = inboxState[0]?.identifiers[0]?.identifier;
      
//       if (!memberAddress) {
//         console.log("Unable to find member address, skipping");
//         continue;
//       }

//       onMessage({
//         content: message.content as string,
//         senderAddress: memberAddress,
//         conversation: conversation,
//         timestamp: new Date().toISOString(),
//         messageId: message.id
//       });

//       // Auto-respond to commands
//       if ((message.content as string).startsWith('/')) {
//         await this.handleCommand(message.content as string, memberAddress, conversation);
//       }
//     }
//   }

//   // Handle AI commands
//   async handleCommand(command: string, senderAddress: string, conversation: any): Promise<void> {
//     try {
//       const response = await this.processAICommand(command, senderAddress);
//       await conversation.send(response);

//       // Handle transaction commands
//       if (command.toLowerCase().startsWith('/tx ')) {
//         const parts = command.split(' ');
//         if (parts.length >= 2) {
//           const amount = parseFloat(parts[1]);
//           if (!isNaN(amount) && amount > 0) {
//             const walletCalls = await this.createUSDCTransfer(senderAddress, amount);
            
//             // Send wallet send calls for user to approve
//             await conversation.send(walletCalls, ContentTypeWalletSendCalls);
            
//             await conversation.send(
//               `💰 Transaction request sent! Please approve the ${amount} USDC transfer in your wallet.`
//             );
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Error handling command:', error);
//       await conversation.send('Sorry, I encountered an error processing your command.');
//     }
//   }

//   // Process AI command using Groq
//   async processAICommand(command: string, senderAddress: string): Promise<string> {
//     const lowerCommand = command.toLowerCase().trim();

//     try {
//       // Handle specific commands
//       if (lowerCommand === "/balance") {
//         const result = await this.usdcHandler.getUSDCBalance(senderAddress);
//         return `💰 Your USDC balance: ${result} USDC`;
//       } 
      
//       if (lowerCommand.startsWith("/tx ")) {
//         const parts = command.split(" ");
//         if (parts.length < 2) {
//           return "❌ Please provide an amount. Usage: /tx <amount>";
//         }
        
//         const amount = parseFloat(parts[1]);
//         if (isNaN(amount) || amount <= 0) {
//           return "❌ Please provide a valid amount. Usage: /tx <amount>";
//         }
        
//         return `🔄 Preparing transaction for ${amount} USDC to ${this.agentAddress.slice(0, 6)}...${this.agentAddress.slice(-4)}`;
//       }

//       if (lowerCommand === "/help") {
//         return `🤖 **Available Commands:**

// 💰 \`/balance\` - Check your USDC balance
// 💸 \`/tx <amount>\` - Send USDC to the agent (e.g. /tx 0.1)
// ❓ \`/help\` - Show this help message

// **Ask me anything about:**
// • DeFi protocols and strategies
// • Blockchain transactions
// • Market insights
// • Cryptocurrency questions

// Just type your question naturally!`;
//       }

//       if (lowerCommand === "/status") {
//         const networkConfig = this.usdcHandler.getNetworkConfig();
//         return `📊 **System Status:**

// 🌐 Network: ${networkConfig.networkName}
// 💰 Token: USDC (${networkConfig.tokenAddress.slice(0, 6)}...${networkConfig.tokenAddress.slice(-4)})
// 🤖 Agent: ${this.agentAddress.slice(0, 6)}...${this.agentAddress.slice(-4)}
// 📞 Conversations: ${this.conversations.size}

// All systems operational! ✅`;
//       }

//       // Use Groq for general AI responses
//       const completion = await this.groq.chat.completions.create({
//         messages: [
//           {
//             role: "system",
//             content: `You are a helpful DeFi and blockchain assistant on XMTP. You can help users with:

// **Core Functions:**
// - Understanding DeFi protocols (Uniswap, Aave, Compound, etc.)
// - Explaining blockchain transactions and gas fees
// - Providing market insights and analysis
// - Answering crypto-related questions
// - Helping with wallet operations

// **Communication Style:**
// - Keep responses concise but informative
// - Use emojis sparingly for clarity
// - Be friendly and professional
// - Provide actionable advice
// - Always prioritize user safety

// **Available Commands:**
// - /balance - Check USDC balance
// - /tx <amount> - Send USDC
// - /help - Show commands
// - /status - System status

// **Safety Guidelines:**
// - Never ask for private keys or seed phrases
// - Always verify transaction details
// - Warn about potential risks
// - Suggest users verify contract addresses

// Current network: ${this.networkId}
// Agent address: ${this.agentAddress}`
//           },
//           {
//             role: "user",
//             content: command
//           }
//         ],
//         model: "llama3-8b-8192",
//         temperature: 0.7,
//         max_tokens: 500,
//         top_p: 1,
//       });

//       const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";
      
//       // Add helpful footer for new users
//       if (!lowerCommand.startsWith('/')) {
//         return `${response}\n\n💡 *Tip: Try /help for available commands or /balance to check your USDC balance*`;
//       }
      
//       return response;
//     } catch (error) {
//       console.error("Error processing AI command:", error);
      
//       const errorMessage = error instanceof Error ? error.message : String(error);
//       if (errorMessage.includes('API key')) {
//         return "❌ AI service configuration error. Please check the Groq API key.";
//       }
      
//       return "❌ Sorry, I encountered an error processing your command. Please try again.";
//     }
//   }

//   // Create conversation (DM)
//   async createConversation(peerAddress: string): Promise<any> {
//     if (!this.client) {
//       throw new Error("Client not initialized");
//     }

//     try {
//       // For XMTP v3, we need to create a DM using newDm method
//       // First, we need to get the inbox ID from the address
//       const conversation = await this.client.conversations.newDm(peerAddress);
//       this.conversations.set(conversation.id, conversation);
      
//       // Send welcome message
//       await conversation.send(
//         `👋 Welcome to XMTP! I'm your DeFi assistant.\n\nTry:\n• /help - See available commands\n• /balance - Check your USDC balance\n• Ask me about DeFi, trading, or blockchain!`
//       );
      
//       return conversation;
//     } catch (error) {
//       console.error('Error creating conversation:', error);
//       throw new Error('Failed to create conversation');
//     }
//   }

//   // Send message to conversation
//   async sendMessage(conversationId: string, content: string): Promise<void> {
//     if (!this.client) {
//       throw new Error("Client not initialized");
//     }

//     const conversation = this.conversations.get(conversationId) || 
//                         await this.client.conversations.getConversationById(conversationId);
    
//     if (!conversation) {
//       throw new Error("Conversation not found");
//     }

//     await conversation.send(content);
//   }

//   // Create USDC transfer transaction
//   async createUSDCTransfer(recipientAddress: string, amount: number): Promise<WalletSendCallsParams> {
//     const amountInDecimals = this.usdcHandler.parseAmount(amount);
//     return this.usdcHandler.createUSDCTransferCalls(
//       this.agentAddress,
//       recipientAddress,
//       amountInDecimals
//     );
//   }

//   // Send wallet send calls
//   async sendWalletCalls(conversationId: string, walletSendCalls: WalletSendCallsParams): Promise<void> {
//     if (!this.client) {
//       throw new Error("Client not initialized");
//     }

//     const conversation = this.conversations.get(conversationId) || 
//                         await this.client.conversations.getConversationById(conversationId);
    
//     if (!conversation) {
//       throw new Error("Conversation not found");
//     }

//     await conversation.send(walletSendCalls, ContentTypeWalletSendCalls);
//   }

//   // Get conversations list
//   getConversations(): any[] {
//     return Array.from(this.conversations.values());
//   }

//   // Get conversation by peer address
//   getConversationByPeer(peerAddress: string): any | null {
//     const conversationsArray = Array.from(this.conversations.values());
//     for (const conversation of conversationsArray) {
//       if (conversation.peerAddress?.toLowerCase() === peerAddress.toLowerCase()) {
//         return conversation;
//       }
//     }
//     return null;
//   }

//   // Load messages for a conversation
//   async loadMessages(conversationId: string): Promise<any[]> {
//     const conversation = this.conversations.get(conversationId);
//     if (!conversation) {
//       throw new Error("Conversation not found");
//     }

//     try {
//       const messages = await conversation.messages();
//       return messages.map((msg: DecodedMessage<unknown>) => ({
//         id: msg.id,
//         content: msg.content,
//         senderAddress: msg.senderInboxId, // Use senderInboxId from the DecodedMessage type
//         timestamp: msg.sentAt, // Use sentAt which is a Date property from the DecodedMessage type
//         contentType: msg.contentType?.typeId
//       }));
//     } catch (error) {
//       console.error('Error loading messages:', error);
//       return [];
//     }
//   }

//   // Check if client is initialized
//   isInitialized(): boolean {
//     return this.client !== null;
//   }

//   // Clean up resources
//   async cleanup(): Promise<void> {
//     // Close streams and cleanup if needed
//     this.conversations.clear();
//     this.client = null;
//   }
// }

// // React Hook for XMTP Chat
// export function useXMTPChat() {
//   const [chatHandler, setChatHandler] = useState<XMTPChatHandler | null>(null);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isInitializing, setIsInitializing] = useState(false);

//   const initialize = useCallback(async (config: {
//     walletKey: string;
//     encryptionKey: string;
//     xmtpEnv: XmtpEnv;
//     networkId: string;
//     groqApiKey: string;
//   }) => {
//     try {
//       setError(null);
//       setIsInitializing(true);
      
//       const handler = new XMTPChatHandler(
//         config.walletKey,
//         config.encryptionKey,
//         config.xmtpEnv,
//         config.networkId,
//         config.groqApiKey
//       );

//       await handler.initialize();
//       setChatHandler(handler);
//       setIsInitialized(true);
      
//       console.log('✅ XMTP Chat initialized successfully');
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP';
//       setError(errorMessage);
//       setIsInitialized(false);
//       setChatHandler(null);
//       console.error('❌ XMTP initialization error:', err);
//       throw new Error(errorMessage);
//     } finally {
//       setIsInitializing(false);
//     }
//   }, []);

//   const createConversation = useCallback(async (peerAddress: string) => {
//     if (!chatHandler || !chatHandler.isInitialized()) {
//       throw new Error('Chat handler not initialized');
//     }
//     return await chatHandler.createConversation(peerAddress);
//   }, [chatHandler]);

//   const sendMessage = useCallback(async (conversationId: string, content: string) => {
//     if (!chatHandler || !chatHandler.isInitialized()) {
//       throw new Error('Chat handler not initialized');
//     }
//     await chatHandler.sendMessage(conversationId, content);
//   }, [chatHandler]);

//   const processAIMessage = useCallback(async (message: string, senderAddress: string) => {
//     if (!chatHandler || !chatHandler.isInitialized()) {
//       throw new Error('Chat handler not initialized');
//     }
//     return await chatHandler.processAICommand(message, senderAddress);
//   }, [chatHandler]);

//   const createTransaction = useCallback(async (recipientAddress: string, amount: number) => {
//     if (!chatHandler || !chatHandler.isInitialized()) {
//       throw new Error('Chat handler not initialized');
//     }
//     return await chatHandler.createUSDCTransfer(recipientAddress, amount);
//   }, [chatHandler]);

//   const getAgentAddress = useCallback(() => {
//     return chatHandler?.getAgentAddress() || '';
//   }, [chatHandler]);

//   const startListening = useCallback(async (onMessage: (message: any) => void) => {
//     if (!chatHandler || !chatHandler.isInitialized()) {
//       throw new Error('Chat handler not initialized');
//     }
//     await chatHandler.startMessageListener(onMessage);
//   }, [chatHandler]);

//   const getConversations = useCallback(() => {
//     return chatHandler?.getConversations() || [];
//   }, [chatHandler]);

//   const loadMessages = useCallback(async (conversationId: string) => {
//     if (!chatHandler || !chatHandler.isInitialized()) {
//       throw new Error('Chat handler not initialized');
//     }
//     return await chatHandler.loadMessages(conversationId);
//   }, [chatHandler]);

//   const reset = useCallback(async () => {
//     if (chatHandler) {
//       await chatHandler.cleanup();
//     }
//     setChatHandler(null);
//     setIsInitialized(false);
//     setError(null);
//     setIsInitializing(false);
//   }, [chatHandler]);

//   return {
//     initialize,
//     createConversation,
//     sendMessage,
//     processAIMessage,
//     createTransaction,
//     getAgentAddress,
//     startListening,
//     getConversations,
//     loadMessages,
//     reset,
//     isInitialized,
//     isInitializing,
//     error,
//     chatHandler
//   };
// }
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Bell, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle,
  Info,
  Bot,
  User,
  Loader2,
  Send,
  Wallet,
  Settings,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useXMTPNode, type XMTPConfig, type XMTPMessage, type XMTPConversation } from '@/lib/xmtp-cleint-service';

// Types
type MessageCategory = 'all' | 'notifications' | 'security' | 'transactions' | 'ai' | 'p2p';
type MessageStatus = 'read' | 'unread';

interface MessageListProps {
  className?: string;
}

interface SystemMessage {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  category: 'notifications' | 'security' | 'transactions';
  status: MessageStatus;
  actionable: boolean;
  txHash?: string;
  amount?: string;
  token?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isAIMessage?: boolean;
  isTxPreview?: boolean;
  txData?: any;
  txHash?: string;
  isTransaction?: boolean;
  senderInboxId?: string;
}

interface ConfigForm {
  walletKey: string;
  encryptionKey: string;
  groqApiKey: string;
  xmtpEnv: 'dev' | 'production';
  networkId: string;
}

// Generate random encryption key
const generateEncryptionKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Demo system messages
const initialSystemMessages: SystemMessage[] = [
  {
    id: 's1',
    title: 'Transaction Confirmed',
    preview: 'Your payment of 250 USDC has been confirmed on Base.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    category: 'transactions',
    status: 'unread',
    actionable: false,
    txHash: '0x1234...abcd',
    amount: '250',
    token: 'USDC'
  },
  {
    id: 's2',
    title: 'Security Alert',
    preview: 'New device detected accessing your wallet.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'security',
    status: 'unread',
    actionable: true,
  },
  {
    id: 's3',
    title: 'Yield Earned',
    preview: 'You earned 2.5 USDC in DeFi rewards today.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'notifications',
    status: 'read',
    actionable: false,
  },
];

export function MessageList({ className }: MessageListProps) {
  // XMTP Node SDK Integration
  const {
    isInitialized,
    isInitializing,
    error: xmtpError,
    agentAddress,
    agentInboxId,
    conversations,
    initialize,
    createConversation,
    sendMessage,
    getMessages,
    processAIMessage,
    startListening,
    stopListening,
    refreshConversations,
    reset
  } = useXMTPNode();

  // State management
  const [filter, setFilter] = useState<MessageCategory>('all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState<XMTPConversation | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [isSendingTx, setIsSendingTx] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [showConfig, setShowConfig] = useState(!isInitialized);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>(initialSystemMessages);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Configuration state
  const [config, setConfig] = useState<ConfigForm>({
    walletKey: '',
    encryptionKey: generateEncryptionKey(),
    groqApiKey: `${process.env.GROQ_API_KEY}`,
    xmtpEnv: 'dev',
    networkId: 'base-sepolia'
  });

  // Computed values
  const allMessages = [...systemMessages];
  const filteredMessages = allMessages.filter(
    message => filter === 'all' || message.category === filter
  );

  // Utility functions
  const getCategoryIcon = (category: SystemMessage['category']) => {
    switch (category) {
      case 'notifications':
        return <Bell className="h-4 w-4" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4" />;
      case 'transactions':
        return <Info className="h-4 w-4" />;
    }
  };

  // XMTP Functions
  const initializeXMTP = async () => {
    try {
      setIsLoading(true);
      const xmtpConfig: XMTPConfig = {
        walletKey: config.walletKey,
        encryptionKey: config.encryptionKey,
        env: config.xmtpEnv,
        groqApiKey: config.groqApiKey
      };

      await initialize(xmtpConfig);
      setShowConfig(false);

      // Start listening for messages
      startListening(handleIncomingMessage);
      
      console.log('✓ XMTP Node SDK initialized successfully');
    } catch (error: unknown) {
      console.error('Failed to initialize XMTP:', error);
      alert(`Failed to initialize XMTP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processCommand = useCallback(async (command: string, senderInboxId: string, conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await processAIMessage(command, senderInboxId);
      
      // Send AI response back through XMTP
      await sendMessage(conversationId, response);
      
      // Add to local messages
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: response,
        sender: agentInboxId,
        timestamp: new Date(),
        isAIMessage: true
      };
      setMessages(prev => [...prev, aiMessage]);

      // Check for transaction commands
      if (command.toLowerCase().startsWith('/tx ')) {
        const amount = parseFloat(command.split(' ')[1]);
        if (!isNaN(amount) && amount > 0) {
          const txMessage: ChatMessage = {
            id: Date.now().toString(),
            content: `Transaction Preview: ${amount} USDC`,
            sender: agentInboxId,
            timestamp: new Date(),
            isAIMessage: true,
            isTxPreview: true,
            txData: { amount, recipient: senderInboxId }
          };
          setMessages(prev => [...prev, txMessage]);
        }
      }
    } catch (error) {
      console.error('Error processing command:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agentInboxId, processAIMessage, sendMessage]);

  const handleIncomingMessage = useCallback((message: XMTPMessage) => {
    console.log('Incoming message:', message);
    
    const newChatMessage: ChatMessage = {
      id: message.id,
      content: message.content,
      sender: message.senderInboxId,
      timestamp: new Date(message.sentAt),
      isAIMessage: false,
      senderInboxId: message.senderInboxId
    };

    setMessages(prev => [...prev, newChatMessage]);

    // Process AI commands automatically
    if (message.content.startsWith('/')) {
      processCommand(message.content, message.senderInboxId, message.conversationId);
    }
  }, [processCommand]);


  const startConversation = async (peerAddress: string) => {
    if (!isInitialized) return;
    
    try {
      setIsLoading(true);
      const conversation = await createConversation(peerAddress);
      setActiveConversation(conversation);
      setShowChat(true);
      
      // Load messages for this conversation
      const conversationMessages = await getMessages(conversation.id);
      const chatMessages: ChatMessage[] = conversationMessages.map((msg: { id: any; content: any; senderInboxId: any; sentAt: string | number | Date; }) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.senderInboxId,
        timestamp: new Date(msg.sentAt),
        isAIMessage: msg.senderInboxId === agentInboxId,
        senderInboxId: msg.senderInboxId
      }));
      setMessages(chatMessages);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const startAIConversation = async () => {
    setActiveConversation(null);
    setShowChat(true);
    setMessages([]);
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsLoading(true);
      
      if (activeConversation) {
        // P2P conversation - send via XMTP
        const sentMessage = await sendMessage(activeConversation.id, newMessage);
        
        const userMessage: ChatMessage = {
          id: sentMessage.id,
          content: newMessage,
          sender: agentInboxId,
          timestamp: new Date(sentMessage.sentAt),
          isAIMessage: false,
          senderInboxId: agentInboxId
        };
        setMessages(prev => [...prev, userMessage]);
        
      } else {
        // AI conversation - process locally
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          content: newMessage,
          sender: agentInboxId,
          timestamp: new Date(),
          isAIMessage: false
        };
        setMessages(prev => [...prev, userMessage]);

        const response = await processAIMessage(newMessage, agentAddress);
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          content: response,
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'Failed to send message',
        sender: 'System',
        timestamp: new Date(),
        isAIMessage: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTransaction = async (txData: any) => {
    try {
      setIsSendingTx(true);
      
      // Simulate transaction execution
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Add transaction success message
      const txMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `✅ Transaction sent successfully!\nTx Hash: ${txHash}`,
        sender: 'System',
        timestamp: new Date(),
        isAIMessage: true,
        isTransaction: true,
        txHash
      };
      setMessages(prev => [...prev, txMessage]);

      // Add to system messages
      const systemMessage: SystemMessage = {
        id: `tx_${Date.now()}`,
        title: 'Transaction Sent',
        preview: `Successfully sent ${txData.amount} USDC`,
        timestamp: new Date().toISOString(),
        category: 'transactions',
        status: 'unread',
        actionable: false,
        txHash,
        amount: txData.amount?.toString(),
        token: 'USDC'
      };
      setSystemMessages(prev => [systemMessage, ...prev]);
      
    } catch (error: unknown) {
      console.error('Transaction failed:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `❌ Transaction failed`,
        sender: 'System',
        timestamp: new Date(),
        isAIMessage: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingTx(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshConversations();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.isTxPreview && message.txData) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Transaction Preview
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>Amount:</div>
            <div className="font-mono">{message.txData.amount} USDC</div>
            <div>To:</div>
            <div className="font-mono text-xs truncate">{message.txData.recipient}</div>
            <div>Network:</div>
            <div>Base Sepolia</div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMessages(prev => prev.filter(m => m.id !== message.id))}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={() => executeTransaction(message.txData)}
              disabled={isSendingTx}
            >
              {isSendingTx ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : 'Confirm Transaction'}
            </Button>
          </div>
        </div>
      );
    }

    if (message.isTransaction && message.txHash) {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm">
            {message.content}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://basescan.org/tx/${message.txHash}`, '_blank')}
              >
                View on Explorer
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return message.content;
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initializeXMTP();
  };

  // Effect to update showConfig based on initialization state
  useEffect(() => {
    setShowConfig(!isInitialized);
  }, [isInitialized]);

  // Configuration form
  if (showConfig) {
    return (
      <Card className={cn("border-0", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            XMTP Node SDK Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Wallet Private Key</label>
              <Input
                type="password"
                placeholder="0x..."
                value={config.walletKey}
                onChange={(e) => setConfig(prev => ({ ...prev, walletKey: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your private key (starts with 0x)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Groq API Key</label>
              <Input
                type="password"
                placeholder="gsk_..."
                value={config.groqApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, groqApiKey: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your API key from <a href="https://console.groq.com" target="_blank" className="text-blue-500">console.groq.com</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Encryption Key</label>
              <Input
                type="text"
                value={config.encryptionKey}
                onChange={(e) => setConfig(prev => ({ ...prev, encryptionKey: e.target.value }))}
                required
                readOnly
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-1"
                onClick={() => setConfig(prev => ({ ...prev, encryptionKey: generateEncryptionKey() }))}
              >
                Generate New Key
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Network</label>
              <select 
                className="w-full p-2 border rounded"
                value={config.networkId}
                onChange={(e) => setConfig(prev => ({ ...prev, networkId: e.target.value }))}
              >
                <option value="base-sepolia">Base Sepolia (Testnet)</option>
                <option value="base-mainnet">Base Mainnet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">XMTP Environment</label>
              <select 
                className="w-full p-2 border rounded"
                value={config.xmtpEnv}
                onChange={(e) => setConfig(prev => ({ ...prev, xmtpEnv: e.target.value as 'dev' | 'production' }))}
              >
                <option value="dev">Development</option>
                <option value="production">Production</option>
              </select>
            </div>

            {xmtpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {xmtpError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isInitializing}>
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Initializing XMTP Node SDK...
                </>
              ) : (
                'Initialize XMTP Node SDK'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Main interface
  return (
    <Card className={cn("border-0", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
            <Badge variant="secondary" className="text-xs">Node SDK</Badge>
          </div>
          <div className="flex items-center gap-2">
            {isInitialized && agentAddress && (
              <div className="text-xs text-muted-foreground">
                {agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as MessageCategory)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Updates</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="p2p">
              Chats
              {conversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {conversations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={filter} className="mt-4 space-y-4">
            {/* AI Tab Content */}
            {filter === 'ai' && (
              <div className="mb-4">
                <Button 
                  onClick={startAIConversation}
                  disabled={!isInitialized}
                  className="w-full"
                >
                  {isInitialized ? (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Chat with AI Agent
                    </>
                  ) : (
                    'Configure XMTP to Chat'
                  )}
                </Button>
                {isInitialized && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Try commands: /balance, /tx 0.1, /help, /status
                  </p>
                )}
              </div>
            )}

            {/* P2P Tab Content */}
            {filter === 'p2p' && (
              <div className="mb-4 space-y-4">
                {isInitialized ? (
                  <>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter wallet address to chat (0x...)"
                        value={inputAddress}
                        onChange={(e) => setInputAddress(e.target.value)}
                      />
                      <Button 
                        onClick={() => startConversation(inputAddress)}
                        className="w-full"
                        disabled={!inputAddress || !inputAddress.startsWith('0x') || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <User className="h-4 w-4 mr-2" />
                        )}
                        Start Conversation
                      </Button>
                    </div>
                    
                    {conversations.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Existing Conversations</h3>
                        <div className="space-y-2">
                          {conversations.map((conv) => (
                            <div 
                              key={conv.id}
                              className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                              onClick={() => {
                                setActiveConversation(conv);
                                setShowChat(true);
                                // Load messages when selecting conversation
                                getMessages(conv.id).then(msgs => {
                                  const chatMessages: ChatMessage[] = msgs.map(msg => ({
                                    id: msg.id,
                                    content: msg.content,
                                    sender: msg.senderInboxId,
                                    timestamp: new Date(msg.sentAt),
                                    isAIMessage: msg.senderInboxId === agentInboxId,
                                    senderInboxId: msg.senderInboxId
                                  }));
                                  setMessages(chatMessages);
                                });
                              }}
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {conv.peerInboxId?.slice(0, 8)}...{conv.peerInboxId?.slice(-4)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(conv.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <MessageSquare className="h-4 w-4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Button onClick={() => setShowConfig(true)} className="w-full">
                    Configure XMTP to Start Chatting
                  </Button>
                )}
              </div>
            )}

            {/* Chat Interface */}
            {showChat ? (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    {activeConversation 
                      ? `Chat with ${activeConversation.peerInboxId?.slice(0, 8)}...${activeConversation.peerInboxId?.slice(-4)}`
                      : "AI Assistant"
                    }
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowChat(false)}
                  >
                    Close
                  </Button>
                </div>
                
                <div className="h-64 overflow-y-auto mb-4 space-y-2">
                  {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-center">
                      {activeConversation 
                        ? "No messages yet. Start the conversation!"
                        : "Ask the AI anything about DeFi, send transactions, or use commands like /balance"
                      }
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === agentInboxId || (!activeConversation && !msg.isAIMessage)
                          ? "justify-end" 
                          : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-xs p-3 rounded-lg",
                          msg.sender === agentInboxId || (!activeConversation && !msg.isAIMessage)
                            ? "bg-primary text-primary-foreground"
                            : msg.isAIMessage
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        <div className="text-xs font-medium mb-1">
                          {msg.sender === agentInboxId || (!activeConversation && !msg.isAIMessage)
                            ? "You"
                            : msg.isAIMessage
                              ? "AI Assistant"
                              : `${msg.sender?.slice(0, 6)}...${msg.sender?.slice(-4)}`}
                        </div>
                        <div>{renderMessageContent(msg)}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-secondary text-secondary-foreground p-3 rounded-lg max-w-xs">
                        <div className="text-xs font-medium mb-1">AI Assistant</div>
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder={
                      activeConversation 
                        ? "Type a message..." 
                        : "Ask the AI or try /balance, /tx 0.1..."
                    }
                    disabled={isLoading || isSendingTx}
                  />
                  <Button 
                    onClick={sendChatMessage} 
                    disabled={isLoading || !newMessage.trim() || isSendingTx}
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Message List View */
              <>
                {filteredMessages.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No messages found
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "relative rounded-lg p-4 transition-colors hover:bg-muted/50",
                        message.status === 'unread' && "bg-primary/5"
                      )}
                    >
                      {message.status === 'unread' && (
                        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary"></div>
                      )}
                      
                      <div className="flex gap-3">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          message.category === 'transactions' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                          message.category === 'security' && "bg-red-100 text-red-600 dark:bg-red-900/30",
                          message.category === 'notifications' && "bg-green-100 text-green-600 dark:bg-green-900/30"
                        )}>
                          {getCategoryIcon(message.category)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{message.title}</h3>
                            {message.actionable && (
                              <Badge variant="outline" className="text-[10px]">ACTION REQUIRED</Badge>
                            )}
                            {message.txHash && (
                              <Badge variant="secondary" className="text-[10px]">
                                TX: {message.txHash.slice(0, 6)}...
                              </Badge>
                            )}
                          </div>
                          
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {message.preview}
                          </p>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            
                            {message.actionable && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                                  Decline
                                </Button>
                                <Button size="sm" className="h-8 px-3 text-xs">
                                  Approve
                                </Button>
                              </div>
                            )}

                            {message.txHash && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-3 text-xs"
                                onClick={() => window.open(`https://basescan.org/tx/${message.txHash}`, '_blank')}
                              >
                                View TX
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount } from 'wagmi';
import { 
  MessageSquare, 
  User,
  Loader2,
  Send,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickCommands } from './QuickCommands';

interface ChatInterfaceProps {
  mode: 'ai' | 'p2p';
  isInitialized: boolean;
  agentAddress?: string;
  agentInboxId?: string;
  conversations?: any[];
  onCreateConversation?: (address: string) => Promise<any>;
  onSendMessage?: (conversationId: string, content: string) => Promise<any>;
  onGetMessages?: (conversationId: string) => Promise<any[]>;
  onStartListening?: (handler: (message: any) => void) => void;
}

export function ChatInterface({ 
  mode, 
  isInitialized, 
  agentAddress,
  agentInboxId,
  conversations = [],
  onCreateConversation,
  onSendMessage,
  onGetMessages,
  onStartListening
}: ChatInterfaceProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-show AI chat when in AI mode
  useEffect(() => {
    if (mode === 'ai') {
      setShowChat(true);
    }
  }, [mode]);

  const handleQuickCommand = async (command: string) => {
    setNewMessage(command);
    
    // For AI mode, auto-execute commands
    if (mode === 'ai') {
      await handleSendMessage(command);
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || newMessage;
    if (!content.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (mode === 'ai') {
        await handleAIMessage(content);
      } else if (activeConversation && onSendMessage) {
        await onSendMessage(activeConversation.id, content);
        // Refresh messages after sending
        if (onGetMessages) {
          const updatedMessages = await onGetMessages(activeConversation.id);
          setMessages(updatedMessages);
        }
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIMessage = async (content: string) => {
    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      content,
      sender: connectedAddress || 'You',
      timestamp: new Date(),
      isAIMessage: false
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Process different command types
      if (content.startsWith('/balance')) {
        const response = await fetch('/api/xmtp/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: connectedAddress })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }
        
        const data = await response.json();
        
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: `💰 Your USDC balance: ${data.balance || '0'} USDC`,
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true
        };
        setMessages(prev => [...prev, aiMessage]);
        
      } else if (content.startsWith('/tx ')) {
        const amountMatch = content.match(/\/tx\s+(\d+(?:\.\d+)?)/);
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1]);
          if (!isNaN(amount) && amount > 0) {
            const txMessage = {
              id: (Date.now() + 1).toString(),
              content: `🔄 Transaction Preview: ${amount} USDC\n\nClick to confirm or modify the transaction.`,
              sender: 'AI Assistant',
              timestamp: new Date(),
              isAIMessage: true,
              isTxPreview: true,
              txData: { amount, recipient: agentAddress }
            };
            setMessages(prev => [...prev, txMessage]);
          } else {
            throw new Error('Invalid amount specified');
          }
        } else {
          throw new Error('Please specify an amount (e.g., /tx 0.1)');
        }
        
      } else if (content.startsWith('/help')) {
        const helpMessage = {
          id: (Date.now() + 1).toString(),
          content: `🤖 **Available Commands:**\n\n💰 \`/balance\` - Check your USDC balance\n💸 \`/tx <amount>\` - Send USDC (e.g., /tx 0.1)\n📊 \`/status\` - Check system status\n❓ \`/help\` - Show this help\n\nYou can also ask me anything about DeFi, blockchain, or trading!`,
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true
        };
        setMessages(prev => [...prev, helpMessage]);
        
      } else if (content.startsWith('/status')) {
        const statusMessage = {
          id: (Date.now() + 1).toString(),
          content: `✅ **System Status:**\n\n🌐 Network: Base ${agentAddress ? 'Connected' : 'Disconnected'}\n💬 XMTP: ${isInitialized ? 'Active' : 'Inactive'}\n🔗 Wallet: ${isConnected ? 'Connected' : 'Disconnected'}\n🤖 AI: Active`,
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true
        };
        setMessages(prev => [...prev, statusMessage]);
        
      } else {
        // Regular AI chat processing
        const response = await fetch('/api/xmtp/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: content, 
            senderAddress: connectedAddress || agentAddress 
          })
        });
        
        if (!response.ok) {
          throw new Error('AI service unavailable');
        }
        
        const data = await response.json();
        
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'I apologize, but I couldn\'t process your request at the moment.',
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error processing AI message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: `❌ Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        sender: 'AI Assistant',
        timestamp: new Date(),
        isAIMessage: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleCreateConversation = async () => {
    if (!inputAddress || !inputAddress.startsWith('0x') || !onCreateConversation) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const conversation = await onCreateConversation(inputAddress);
      setActiveConversation(conversation);
      setShowChat(true);
      setInputAddress('');
      
      // Load existing messages if available
      if (onGetMessages) {
        const existingMessages = await onGetMessages(conversation.id);
        setMessages(existingMessages);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  // Show connection requirements
  if (!isConnected) {
    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="font-medium mb-2">Wallet Connection Required</h3>
          <p className="text-muted-foreground text-sm">
            Connect your wallet to start {mode === 'ai' ? 'chatting with AI' : 'P2P messaging'}
          </p>
        </div>
      </div>
    );
  }

  // Show XMTP initialization status for P2P
  if (mode === 'p2p' && !isInitialized) {
    return (
      <div className="text-center py-8 space-y-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="font-medium mb-2">XMTP Initialization Required</h3>
          <p className="text-muted-foreground text-sm">
            XMTP needs to be initialized to enable P2P messaging
          </p>
        </div>
      </div>
    );
  }

  // P2P conversation list view
  if (mode === 'p2p' && !showChat) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter wallet address to chat (0x...)"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
          />
          <Button 
            onClick={handleCreateConversation}
            className="w-full"
            disabled={!inputAddress || !inputAddress.startsWith('0x') || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Conversation...
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Start Conversation
              </>
            )}
          </Button>
        </div>
        
        {conversations.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Recent Conversations</h3>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div 
                  key={conv.id}
                  className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                  onClick={async () => {
                    setActiveConversation(conv);
                    setShowChat(true);
                    // Load messages
                    if (onGetMessages) {
                      try {
                        const msgs = await onGetMessages(conv.id);
                        setMessages(msgs);
                      } catch (error) {
                        console.error('Error loading messages:', error);
                      }
                    }
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
      </div>
    );
  }

  // Chat interface (both AI and P2P when conversation is active)
  if ((mode === 'ai') || (mode === 'p2p' && showChat)) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {/* Chat Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'ai' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            <h3 className="font-medium">
              {mode === 'ai' 
                ? "AI Assistant"
                : `Chat with ${activeConversation?.peerInboxId?.slice(0, 8)}...${activeConversation?.peerInboxId?.slice(-4)}`
              }
            </h3>
          </div>
          {mode === 'p2p' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowChat(false);
                setMessages([]);
                setActiveConversation(null);
              }}
            >
              Back
            </Button>
          )}
        </div>
        
        {/* Quick Commands (AI only) */}
        {mode === 'ai' && (
          <QuickCommands 
            onCommandSelect={handleQuickCommand}
            disabled={isLoading}
          />
        )}
        
        {/* Messages Area */}
        <div className="h-64 overflow-y-auto space-y-2 border rounded-lg p-4 bg-background">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              <div>
                {mode === 'ai' 
                  ? "👋 Ask me anything or use quick commands above!"
                  : "💬 Start your conversation"
                }
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender === connectedAddress || (!activeConversation && !msg.isAIMessage)
                  ? "justify-end" 
                  : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-xs p-3 rounded-lg",
                  msg.sender === connectedAddress || (!activeConversation && !msg.isAIMessage)
                    ? "bg-primary text-primary-foreground"
                    : msg.isAIMessage
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                <div className="text-xs font-medium mb-1">
                  {msg.sender === connectedAddress || (!activeConversation && !msg.isAIMessage)
                    ? "You"
                    : msg.isAIMessage
                      ? "🤖 AI Assistant"
                      : `${msg.sender?.slice(0, 6)}...${msg.sender?.slice(-4)}`}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-xs mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={mode === 'ai' ? "Ask AI or type a command..." : "Type a message..."}
            disabled={isLoading}
          />
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={isLoading || !newMessage.trim()}
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
    );
  }

  return null;
}
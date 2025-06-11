'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  User,
  Loader2,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickCommands } from './QuickCommands';


interface ChatInterfaceProps {
  mode: 'ai' | 'p2p';
  isInitialized: boolean;
  agentAddress: string;
  agentInboxId: string;
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
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [inputAddress, setInputAddress] = useState('');

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
    try {
      if (mode === 'ai') {
        // Handle AI processing with balance/transfer integration
        await handleAIMessage(content);
      } else if (activeConversation && onSendMessage) {
        // Handle P2P message
        await onSendMessage(activeConversation.id, content);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content,
      sender: agentInboxId,
      timestamp: new Date(),
      isAIMessage: false
    };
    setMessages(prev => [...prev, userMessage]);

    // Process commands
    if (content.startsWith('/balance')) {
      try {
        const response = await fetch('/api/xmtp/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: agentAddress })
        });
        const data = await response.json();
        
        const aiMessage = {
          id: Date.now().toString(),
          content: `Your USDC balance is: ${data.balance} USDC`,
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    } else if (content.startsWith('/tx ')) {
      // Handle transaction preview
      const amount = parseFloat(content.split(' ')[1]);
      if (!isNaN(amount) && amount > 0) {
        const txMessage = {
          id: Date.now().toString(),
          content: `Transaction Preview: ${amount} USDC`,
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true,
          isTxPreview: true,
          txData: { amount, recipient: agentAddress }
        };
        setMessages(prev => [...prev, txMessage]);
      }
    } else {
      // Regular AI processing
      try {
        const response = await fetch('/api/xmtp/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: content, 
            senderAddress: agentAddress 
          })
        });
        const data = await response.json();
        
        const aiMessage = {
          id: Date.now().toString(),
          content: data.response,
          sender: 'AI Assistant',
          timestamp: new Date(),
          isAIMessage: true
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error processing AI message:', error);
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {mode === 'ai' ? 'Initialize XMTP to chat with AI' : 'Initialize XMTP to start P2P messaging'}
        </p>
      </div>
    );
  }

  if (mode === 'p2p' && !showChat) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter wallet address to chat (0x...)"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
          />
          <Button 
            onClick={() => {
              if (onCreateConversation) {
                onCreateConversation(inputAddress).then(conv => {
                  setActiveConversation(conv);
                  setShowChat(true);
                });
              }
            }}
            className="w-full"
            disabled={!inputAddress || !inputAddress.startsWith('0x') || isLoading}
          >
            <User className="h-4 w-4 mr-2" />
            Start Conversation
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
                  onClick={() => {
                    setActiveConversation(conv);
                    setShowChat(true);
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

  if (mode === 'ai' || showChat) {
    return (
      <div className="space-y-4">
        {showChat && (
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {mode === 'ai' 
                ? "AI Assistant"
                : `Chat with ${activeConversation?.peerInboxId?.slice(0, 8)}...${activeConversation?.peerInboxId?.slice(-4)}`
              }
            </h3>
            {mode === 'p2p' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowChat(false)}
              >
                Back
              </Button>
            )}
          </div>
        )}
        
        <QuickCommands 
          onCommandSelect={handleQuickCommand}
          disabled={isLoading}
        />
        
        <div className="h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              {mode === 'ai' 
                ? "Ask the AI anything or use quick commands above"
                : "Start your conversation"
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
                <div>{msg.content}</div>
                <div className="text-xs mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
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
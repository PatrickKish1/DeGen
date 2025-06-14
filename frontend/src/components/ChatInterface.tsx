'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

import { useState, useRef, useEffect } from 'react';
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
  Plus,
  Trash2,
  MoreVertical,
  Zap,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickCommands } from './QuickCommands';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/useChat';
import type { ChatInterfaceProps, XMTPConversation, XMTPMessage } from '@/types/chat';

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
  const [newMessage, setNewMessage] = useState('');
  const [showThreads, setShowThreads] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [p2pMessages, setP2pMessages] = useState<XMTPMessage[]>([]);
  const [isLoadingP2P, setIsLoadingP2P] = useState(false);
  const [newPeerAddress, setNewPeerAddress] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use our chat hook for AI mode
  const {
    messages,
    threads,
    activeThreadId,
    isLoading,
    error,
    sendMessage,
    createNewThread,
    switchThread,
    deleteThread,
    clearCurrentThread
  } = useChat({
    userAddress: connectedAddress,
    autoSave: true
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, p2pMessages]);

  // Auto-create thread for AI mode if none exists
  useEffect(() => {
    if (mode === 'ai' && isConnected && !activeThreadId && threads.length === 0) {
      createNewThread('New Chat');
    }
  }, [mode, isConnected, activeThreadId, threads.length, createNewThread]);

  // Load P2P messages when conversation is selected
  useEffect(() => {
    if (mode === 'p2p' && selectedConversation && onGetMessages) {
      setIsLoadingP2P(true);
      onGetMessages(selectedConversation)
        .then((msgs) => {
          setP2pMessages(msgs || []);
        })
        .catch((error) => {
          console.error('Error loading P2P messages:', error);
          setP2pMessages([]);
        })
        .finally(() => {
          setIsLoadingP2P(false);
        });
    }
  }, [mode, selectedConversation, onGetMessages]);

  const handleQuickCommand = async (command: string) => {
    setNewMessage(command);
    await handleSendMessage(command);
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || newMessage;
    if (!content.trim()) return;
    
    if (mode === 'ai') {
      // Use the chat hook for AI mode
      await sendMessage(content);
    } else if (mode === 'p2p' && onSendMessage && selectedConversation) {
      // Use the XMTP handler for P2P mode
      try {
        setIsLoadingP2P(true);
        await onSendMessage(selectedConversation, content);
        // Reload messages after sending
        if (onGetMessages) {
          const updatedMessages = await onGetMessages(selectedConversation);
          setP2pMessages(updatedMessages || []);
        }
      } catch (error) {
        console.error('Error sending P2P message:', error);
      } finally {
        setIsLoadingP2P(false);
      }
    }
    
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateConversation = async () => {
    if (!newPeerAddress.trim() || !onCreateConversation) return;
    
    try {
      setIsLoadingP2P(true);
      const conversation = await onCreateConversation(newPeerAddress.trim());
      setSelectedConversation(conversation.id);
      setNewPeerAddress('');
      setShowNewConversation(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoadingP2P(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowThreads(false);
    if (onStartListening) {
      onStartListening(conversationId);
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
            Connect your wallet to start chatting with the AI assistant or use P2P messaging
          </p>
        </div>
      </div>
    );
  }

  // Show initialization requirement for P2P mode
  if (mode === 'p2p' && !isInitialized) {
    return (
      <div className="text-center py-8 space-y-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="font-medium mb-2">XMTP Not Initialized</h3>
          <p className="text-muted-foreground text-sm">
            Please initialize XMTP to enable P2P messaging
          </p>
        </div>
      </div>
    );
  }

  // P2P Mode - Show conversations list or new conversation form
  if (mode === 'p2p') {
    if (showNewConversation) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">New Conversation</h3>
            <Button 
              onClick={() => setShowNewConversation(false)} 
              variant="outline" 
              size="sm"
            >
              Back
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Address
              </label>
              <Input
                value={newPeerAddress}
                onChange={(e) => setNewPeerAddress(e.target.value)}
                placeholder="0x..."
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the wallet address you want to message
              </p>
            </div>
            
            <Button 
              onClick={handleCreateConversation}
              disabled={!newPeerAddress.trim() || isLoadingP2P}
              className="w-full"
            >
              {isLoadingP2P ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Start Conversation'
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (!selectedConversation) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">P2P Conversations</h3>
            <Button 
              onClick={() => setShowNewConversation(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>No conversations yet</p>
              <Button 
                onClick={() => setShowNewConversation(true)}
                className="mt-2" 
                size="sm"
              >
                Start Your First Conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {conversation.peerAddress.slice(0, 8)}...{conversation.peerAddress.slice(-6)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {conversation.messages?.length || 0} messages
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    P2P
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Show selected P2P conversation
    const currentConversation = conversations.find(c => c.id === selectedConversation);
    
    return (
      <div className="space-y-4 flex flex-col h-full">
        {/* P2P Chat Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setSelectedConversation(null)} 
              variant="outline" 
              size="sm"
            >
              ← Back
            </Button>
            <div>
              <h3 className="font-medium">
                {currentConversation?.peerAddress.slice(0, 8)}...{currentConversation?.peerAddress.slice(-6)}
              </h3>
              <p className="text-xs text-muted-foreground">P2P Chat</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {isInitialized ? '🟢 Connected' : '🔴 Offline'}
          </Badge>
        </div>

        {/* P2P Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-4 bg-background min-h-64 max-h-96">
          {isLoadingP2P ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading messages...</span>
            </div>
          ) : p2pMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              <div>
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p>👋 Start the conversation!</p>
                <p className="text-xs mt-1">Send your first message via XMTP.</p>
              </div>
            </div>
          ) : (
            <>
              {p2pMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.senderInboxId === agentInboxId ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs p-3 rounded-lg",
                      msg.senderInboxId === agentInboxId
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <div className="text-xs font-medium mb-1 flex items-center gap-1">
                      {msg.senderInboxId === agentInboxId ? (
                        <>
                          <User className="h-3 w-3" />
                          You
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3" />
                          Peer
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(msg.sentAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* P2P Input Area */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoadingP2P}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={isLoadingP2P || !newMessage.trim()}
            size="sm"
          >
            {isLoadingP2P ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Thread list view for AI mode
  if (showThreads && mode === 'ai') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Chat History</h3>
          <div className="flex gap-2">
            <Button onClick={() => createNewThread()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            <Button onClick={() => setShowThreads(false)} variant="outline" size="sm">
              Back to Chat
            </Button>
          </div>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>No chat history yet</p>
            <Button onClick={() => createNewThread()} className="mt-2" size="sm">
              Start Your First Chat
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50",
                  thread.id === activeThreadId && "bg-muted"
                )}
                onClick={() => {
                  switchThread(thread.id);
                  setShowThreads(false);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {thread.title || `Chat ${threads.indexOf(thread) + 1}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {thread.messageCount} messages • {thread.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {thread.id === activeThreadId && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          switchThread(thread.id);
                          setShowThreads(false);
                        }}
                      >
                        Open Chat
                      </DropdownMenuItem>
                      {thread.id === activeThreadId && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCurrentThread();
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Messages
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Thread
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Main AI chat interface
  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* AI Chat Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              DeFi AI Assistant
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Powered by Groq
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Connected to Base Sepolia • {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {threads.length} chats
          </Badge>
          <Button 
            onClick={() => setShowThreads(true)} 
            variant="outline" 
            size="sm"
          >
            History
          </Button>
          <Button 
            onClick={() => createNewThread()} 
            variant="outline" 
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 border rounded-lg p-4 bg-background min-h-64 max-h-96">
        {!activeThreadId ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-center">
            <div>
              <Bot className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Welcome to DeFi AI Assistant</h3>
              <p className="text-sm mb-4">
                I can help you with DeFi operations, check balances, create transactions, and more!
              </p>
              <Button onClick={() => createNewThread()}>
                Start New Chat
              </Button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-center">
            <div>
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>👋 Start the conversation!</p>
              <p className="text-xs mt-1">
                Try asking: "What's my balance?" or "/help" for commands
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-xs lg:max-w-md p-3 rounded-lg",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  <div className="text-xs font-medium mb-1 flex items-center gap-1">
                    {msg.role === 'user' ? (
                      <>
                        <User className="h-3 w-3" />
                        You
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3" />
                        AI Assistant
                      </>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                  <div className="text-xs font-medium mb-1 flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    AI Assistant
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* Quick Commands */}
      <QuickCommands onCommandSelect={handleQuickCommand} />

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about DeFi, check balances, or type /help for commands..."
          disabled={isLoading}
          className="flex-1"
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

      {/* Chat Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Quick tips:</strong> Use /balance to check wallet, /help for all commands</p>
        <p>🔧 <strong>Tools available:</strong> Balance checking, transfers, gas estimates, DeFi protocols</p>
        <p>🌐 <strong>Network:</strong> Base Sepolia testnet with real blockchain data</p>
      </div>
    </div>
  );
}
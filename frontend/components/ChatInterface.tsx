'use client';

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
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickCommands } from './QuickCommands';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChat } from '@/hooks/useChat';

interface ChatInterfaceProps {
  mode: 'ai' | 'p2p';
  isInitialized: boolean;
  agentAddress?: string;
  agentInboxId?: string;
}

export function ChatInterface({ 
  mode, 
  isInitialized, 
  agentAddress,
  agentInboxId
}: ChatInterfaceProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const [newMessage, setNewMessage] = useState('');
  const [showThreads, setShowThreads] = useState(false);
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
  }, [messages]);

  // Auto-create thread for AI mode if none exists
  useEffect(() => {
    if (mode === 'ai' && isConnected && !activeThreadId && threads.length === 0) {
      createNewThread('New Chat');
    }
  }, [mode, isConnected, activeThreadId, threads.length, createNewThread]);

  const handleQuickCommand = async (command: string) => {
    setNewMessage(command);
    await handleSendMessage(command);
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || newMessage;
    if (!content.trim()) return;
    
    await sendMessage(content);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            Connect your wallet to start chatting with the AI assistant
          </p>
        </div>
      </div>
    );
  }

  // For AI mode only
  if (mode !== 'ai') {
    return (
      <div className="text-center py-8 space-y-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="font-medium mb-2">AI Chat Mode</h3>
          <p className="text-muted-foreground text-sm">
            This interface is designed for AI chat only
          </p>
        </div>
      </div>
    );
  }

  // Thread list view
  if (showThreads) {
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
                  thread.id === activeThreadId && "border-primary bg-primary/5"
                )}
                onClick={() => {
                  switchThread(thread.id);
                  setShowThreads(false);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {thread.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {thread.messageCount} messages • {thread.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="space-y-4 flex flex-col h-full">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Chat Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-medium">AI Assistant</h3>
          {activeThreadId && (
            <span className="text-xs text-muted-foreground">
              ({threads.find(t => t.id === activeThreadId)?.title})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowThreads(true)} variant="outline" size="sm">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => createNewThread()}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </DropdownMenuItem>
              {activeThreadId && (
                <DropdownMenuItem 
                  onClick={clearCurrentThread}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Quick Commands */}
      <QuickCommands 
        onCommandSelect={handleQuickCommand}
        disabled={isLoading}
      />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-4 bg-background min-h-64 max-h-96">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-center">
            <div>
              <Bot className="h-8 w-8 mx-auto mb-2" />
              <p>👋 Ask me anything or use quick commands above!</p>
              <p className="text-xs mt-1">I can help with DeFi, blockchain, and trading questions.</p>
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
                    "max-w-xs p-3 rounded-lg",
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
                  <div className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI or type a command..."
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
    </div>
  );
}
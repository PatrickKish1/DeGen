'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Settings,
  RefreshCw,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useXMTPNode } from '@/lib/xmtp-client-service';
import { XMTPConfigForm } from './XMTPConfigForm';
import { SystemMessages } from './SystemMessages';
import { ChatInterface } from './ChatInterface';


interface MessageListProps {
  className?: string;
}1

export function MessageList({ className }: MessageListProps) {
  // User mode state
  const [userMode, setUserMode] = useState<'lite' | 'pro'>('lite');
  const [showConfig, setShowConfig] = useState(false);
  
  // XMTP integration
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

  const initializeLiteMode = useCallback(async () => {
    try {
      // Get config from environment
      const response = await fetch('/api/xmtp/config');
      if (!response.ok) {
        throw new Error('Failed to get environment configuration');
      }
      
      const envConfig = await response.json();
      await initialize(envConfig);
    } catch (error) {
      console.error('Failed to initialize Lite mode:', error);
    }
  }, [initialize]);
  
  // Auto-initialize in Lite mode
  useEffect(() => {
    if (userMode === 'lite' && !isInitialized && !isInitializing) {
      initializeLiteMode();
    }
  }, [initializeLiteMode, isInitialized, isInitializing, userMode]);


  const toggleUserMode = () => {
    const newMode = userMode === 'lite' ? 'pro' : 'lite';
    setUserMode(newMode);
    
    if (newMode === 'pro') {
      setShowConfig(true);
    } else {
      // Reset and initialize in lite mode
      reset();
      setShowConfig(false);
    }
  };

  // Configuration form for Pro mode
  if (showConfig && userMode === 'pro') {
    return (
      <Card className={cn("border-0", className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Pro Mode Configuration
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pro</span>
              <Switch 
                checked={userMode === 'pro'} 
                onCheckedChange={toggleUserMode}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <XMTPConfigForm 
            onSuccess={() => setShowConfig(false)}
            onCancel={() => {
              setUserMode('lite');
              setShowConfig(false);
            }}
          />
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
            <Badge variant={userMode === 'pro' ? "default" : "secondary"} className="text-xs">
              {userMode === 'pro' ? 'Pro' : 'Lite'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isInitialized && agentAddress && (
              <div className="text-xs text-muted-foreground">
                {agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {userMode === 'lite' ? 'Lite' : 'Pro'}
              </span>
              <Switch 
                checked={userMode === 'pro'} 
                onCheckedChange={toggleUserMode}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshConversations}
              disabled={!isInitialized}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {userMode === 'pro' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfig(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ai">AI Chat</TabsTrigger>
            <TabsTrigger value="p2p">
              P2P Chat
              {conversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {conversations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <SystemMessages />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-4">
            <ChatInterface 
              mode="ai"
              isInitialized={isInitialized}
              agentAddress={agentAddress}
              agentInboxId={agentInboxId}
              onSendMessage={processAIMessage}
            />
          </TabsContent>
          
          <TabsContent value="p2p" className="mt-4">
            <ChatInterface 
              mode="p2p"
              isInitialized={isInitialized}
              agentAddress={agentAddress}
              agentInboxId={agentInboxId}
              conversations={conversations}
              onCreateConversation={createConversation}
              onSendMessage={sendMessage}
              onGetMessages={getMessages}
              onStartListening={startListening}
            />
          </TabsContent>
          
          <TabsContent value="system" className="mt-4">
            <SystemMessages />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
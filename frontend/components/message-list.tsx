'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Settings,
  RefreshCw,
  Crown,
  Wallet,
  AlertCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useXMTPNode } from '@/lib/xmtp-client-service';
import { XMTPConfigForm } from './XMTPConfigForm';
import { SystemMessages } from './SystemMessages';
import { ChatInterface } from './ChatInterface';

interface MessageListProps {
  className?: string;
}

export function MessageList({ className }: MessageListProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  
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

  // Auto-initialize lite mode when wallet is connected
  const initializeLiteMode = useCallback(async () => {
    if (!isConnected || !connectedAddress) {
      console.log('Wallet not connected, skipping XMTP initialization');
      return;
    }

    try {
      // Get config from environment for lite mode
      const response = await fetch('/api/xmtp/config');
      if (!response.ok) {
        throw new Error('Failed to get environment configuration');
      }
      
      const envConfig = await response.json();
      
      // For lite mode, we'll use a derived key from the connected wallet
      // In a real app, you'd want to use the wallet's private key or have the user sign a message
      const mockConfig = {
        walletKey: envConfig.config.walletKey, // This should be derived from connected wallet
        encryptionKey: envConfig.config.encryptionKey,
        env: envConfig.config.env,
        groqApiKey: envConfig.config.groqApiKey
      };
      
      await initialize(mockConfig);
    } catch (error) {
      console.error('Failed to initialize Lite mode:', error);
    }
  }, [initialize, isConnected, connectedAddress]);
  
  // Auto-initialize in Lite mode when wallet connects
  useEffect(() => {
    if (userMode === 'lite' && isConnected && !isInitialized && !isInitializing) {
      initializeLiteMode();
    }
  }, [initializeLiteMode, isInitialized, isInitializing, userMode, isConnected]);

  // Reset XMTP when wallet disconnects
  useEffect(() => {
    if (!isConnected && isInitialized) {
      reset();
    }
  }, [isConnected, isInitialized, reset]);

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

  // Show wallet connection requirement
  if (!isConnected) {
    return (
      <Card className={cn("border-0", className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to access messaging features including AI chat and P2P messaging.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
            {isInitializing && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1 animate-pulse" />
                Initializing
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Wallet info */}
            <div className="text-xs text-muted-foreground">
              {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
            </div>
            
            {/* XMTP Agent info */}
            {isInitialized && agentAddress && (
              <div className="text-xs text-green-600">
                XMTP: {agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}
              </div>
            )}
            
            {/* Mode toggle */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {userMode === 'lite' ? 'Lite' : 'Pro'}
              </span>
              <Switch 
                checked={userMode === 'pro'} 
                onCheckedChange={toggleUserMode}
              />
            </div>
            
            {/* Refresh button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshConversations}
              disabled={!isInitialized}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            {/* Settings for pro mode */}
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
        {/* Error display */}
        {xmtpError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              XMTP Error: {xmtpError}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="ai">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai">
              AI Chat
              <Badge variant="secondary" className="ml-1 text-xs">
                {isInitialized ? '✓' : '○'}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="p2p">
              P2P Chat
              {conversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {conversations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="mt-4">
            <ChatInterface 
              mode="ai"
              isInitialized={true} // AI chat works without XMTP for basic functionality
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
          
          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              <SystemMessages />
              {/* Add summary of other tabs here */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Chat Summary</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>AI Chat: {isInitialized ? 'Ready' : 'Available'}</div>
                  <div>P2P Chat: {conversations.length} conversations</div>
                  <div>Wallet: {isConnected ? 'Connected' : 'Disconnected'}</div>
                  <div>XMTP: {isInitialized ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
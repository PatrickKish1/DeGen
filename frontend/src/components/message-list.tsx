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
  Zap,
  Bot,
  Users,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useXMTPNode } from '@/lib/xmtp-client-service';
import { XMTPConfigForm } from './XMTPConfigForm';
import { SystemMessages } from './SystemMessages';
import { ChatInterface } from './ChatInterface';
import type { MessageListProps, XMTPConversation } from '@/types/chat';

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
    refreshConversations,
    reset
  } = useXMTPNode();

  // Enhanced conversations with proper type mapping - FIX TYPE ERRORS
  const [enhancedConversations, setEnhancedConversations] = useState<XMTPConversation[]>([]);

  // Convert XMTP conversations to our enhanced format - FIX CREATEDDATE TYPE ERROR
  useEffect(() => {
    const enhanced: XMTPConversation[] = conversations.map(conv => ({
      id: conv.id,
      topic: conv.topic,
      peerInboxId: conv.peerInboxId,
      peerAddress: conv.peerInboxId || 'Unknown', // Required by our type
      createdAt: new Date(conv.createdAt || Date.now()), // Convert string to Date
      updatedAt: new Date(conv.createdAt || Date.now()), // Required by our type
      lastMessage: conv.lastMessage,
      isGroupChat: conv.isGroupChat,
      messages: [] // Required by our type, will be populated when needed
    }));
    setEnhancedConversations(enhanced);
  }, [conversations]);

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
      
      // For lite mode, we'll use environment config
      const mockConfig = {
        walletKey: envConfig.config.walletKey,
        encryptionKey: envConfig.config.encryptionKey,
        env: envConfig.config.env,
        groqApiKey: envConfig.config.groqApiKey
      };
      
      await initialize(mockConfig);
    } catch (error) {
      console.error('Failed to initialize Lite mode:', error);
    }
  }, [initialize, isConnected, connectedAddress]);
  
  // Auto-initialize in Lite mode when wallet connects (only for P2P functionality)
  useEffect(() => {
    if (userMode === 'lite' && isConnected && !isInitialized && !isInitializing) {
      // Don't auto-initialize for lite mode - let users choose when they want P2P
      console.log('Lite mode - XMTP available but not auto-initialized');
    }
  }, [userMode, isConnected, isInitialized, isInitializing]);

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
      // Reset and switch to lite mode
      reset();
      setShowConfig(false);
    }
  };

  const handleInitializeLiteMode = async () => {
    try {
      await initializeLiteMode();
    } catch (error) {
      console.error('Error initializing lite mode:', error);
    }
  };

  // FIX: Enhanced conversation creation handler with proper type conversion
  const handleCreateConversation = async (peerAddress: string): Promise<XMTPConversation> => {
    try {
      const xmtpConversation = await createConversation(peerAddress);
      
      // Convert XMTP conversation to our enhanced type
      const enhancedConversation: XMTPConversation = {
        id: xmtpConversation.id,
        topic: xmtpConversation.topic,
        peerInboxId: xmtpConversation.peerInboxId,
        peerAddress: peerAddress, // Use the provided peerAddress
        createdAt: new Date(xmtpConversation.createdAt || Date.now()),
        updatedAt: new Date(),
        lastMessage: xmtpConversation.lastMessage,
        isGroupChat: xmtpConversation.isGroupChat,
        messages: []
      };

      // Update our enhanced conversations list
      setEnhancedConversations(prev => [enhancedConversation, ...prev]);
      
      return enhancedConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  // FIX: Enhanced message handler for P2P with proper signature
  const handleP2PSendMessage = async (conversationId: string, content?: string): Promise<string> => {
    if (!content) {
      throw new Error('Message content is required');
    }
    
    try {
      const message = await sendMessage(conversationId, content);
      return typeof message === 'string' ? message : message.content || 'Message sent';
    } catch (error) {
      console.error('Error sending P2P message:', error);
      throw error;
    }
  };

  // Enhanced AI message handler
  const handleAISendMessage = async (message: string, senderAddress?: string): Promise<string> => {
    try {
      return await processAIMessage(message, senderAddress || connectedAddress || '');
    } catch (error) {
      console.error('Error sending AI message:', error);
      throw error;
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
              <Bot className="h-4 w-4 mr-1" />
              AI Chat
              <Badge variant="secondary" className="ml-1 text-xs">
                ✓
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="p2p">
              <Users className="h-4 w-4 mr-1" />
              P2P Chat
              {enhancedConversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {enhancedConversations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system">
              <Activity className="h-4 w-4 mr-1" />
              System
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="mt-4">
            <ChatInterface 
              mode="ai"
              isInitialized={true} // AI chat works without XMTP
              agentAddress={agentAddress}
              agentInboxId={agentInboxId}
              onSendMessage={handleAISendMessage}
            />
          </TabsContent>
          
          <TabsContent value="p2p" className="mt-4">
            {!isInitialized && userMode === 'lite' ? (
              <div className="text-center py-8 space-y-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium mb-2">P2P Messaging</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Initialize XMTP to enable wallet-to-wallet messaging
                  </p>
                  <Button onClick={handleInitializeLiteMode} disabled={isInitializing}>
                    {isInitializing ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      'Initialize P2P Messaging'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <ChatInterface 
                mode="p2p"
                isInitialized={isInitialized}
                agentAddress={agentAddress}
                agentInboxId={agentInboxId}
                conversations={enhancedConversations}
                onCreateConversation={handleCreateConversation}
                onSendMessage={handleP2PSendMessage}
                onGetMessages={getMessages}
                onStartListening={(conversationId: string) => {
                  startListening((message) => {
                    if (message.conversationId === conversationId) {
                      // Handle incoming message for this conversation
                      console.log('Received message:', message);
                    }
                  });
                }}
              />
            )}
          </TabsContent>
          
          <TabsContent value="system" className="mt-4">
            <SystemMessages />
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              <SystemMessages />
              
              {/* Enhanced summary */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Overview
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Chat:</span>
                      <Badge variant="secondary" className="text-xs">Ready</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P2P Chat:</span>
                      <Badge variant={isInitialized ? "secondary" : "outline"} className="text-xs">
                        {enhancedConversations.length} conversations
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wallet:</span>
                      <Badge variant="secondary" className="text-xs">Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">XMTP:</span>
                      <Badge variant={isInitialized ? "secondary" : "outline"} className="text-xs">
                        {isInitialized ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Quick stats */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">Quick Stats</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{userMode}</div>
                      <div className="text-muted-foreground">Mode</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{enhancedConversations.length}</div>
                      <div className="text-muted-foreground">P2P Chats</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Base Sepolia</div>
                      <div className="text-muted-foreground">Network</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
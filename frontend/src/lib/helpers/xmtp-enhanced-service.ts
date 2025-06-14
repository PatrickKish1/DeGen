import { useState, useCallback, useEffect, useRef } from 'react';
import { xmtpService, type XMTPConfig, type XMTPMessage, type XMTPConversation } from '@/lib/xmtp-client-service';

export function useEnhancedXMTP() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState<string>('');
  const [agentInboxId, setAgentInboxId] = useState<string>('');
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'degraded' | 'offline'>('offline');
  const messageHandlerRef = useRef<((message: XMTPMessage) => void) | null>(null);

  // Auto-check connection health
  useEffect(() => {
    const checkHealth = () => {
      if (isInitialized && xmtpService.isInitialized()) {
        setConnectionHealth('healthy');
      } else if (isInitializing) {
        setConnectionHealth('degraded');
      } else {
        setConnectionHealth('offline');
      }
    };

    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    checkHealth(); // Initial check

    return () => clearInterval(interval);
  }, [isInitialized, isInitializing]);

  const initialize = useCallback(async (config: XMTPConfig) => {
    try {
      setError(null);
      setIsInitializing(true);
      setConnectionHealth('degraded');
      
      const { address, inboxId } = await xmtpService.initialize(config);
      setAgentAddress(address);
      setAgentInboxId(inboxId);
      setIsInitialized(true);
      setConnectionHealth('healthy');
      
      // Load conversations
      const convs = await xmtpService.getConversations();
      setConversations(convs);
      
      console.log('✅ Enhanced XMTP initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP';
      setError(errorMessage);
      setIsInitialized(false);
      setConnectionHealth('offline');
      console.error('❌ XMTP initialization error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const createConversation = useCallback(async (peerAddress: string) => {
    if (!xmtpService.isInitialized()) {
      throw new Error('XMTP service not initialized');
    }
    
    try {
      const conversation = await xmtpService.createConversation(peerAddress);
      setConversations(prev => [conversation, ...prev]);
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!xmtpService.isInitialized()) {
      throw new Error('XMTP service not initialized');
    }
    
    try {
      return await xmtpService.sendMessage(conversationId, content);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

  const getMessages = useCallback(async (conversationId: string) => {
    if (!xmtpService.isInitialized()) {
      throw new Error('XMTP service not initialized');
    }
    
    try {
      return await xmtpService.getMessages(conversationId);
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }, []);

  const processAIMessage = useCallback(async (message: string, senderAddress: string) => {
    try {
      return await xmtpService.processAIMessage(message, senderAddress);
    } catch (error) {
      console.error('Error processing AI message:', error);
      throw error;
    }
  }, []);

  const getBalance = useCallback(async (address: string) => {
    try {
      const response = await fetch('/api/xmtp/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get balance');
      }
      
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }, []);

  const createTransaction = useCallback(async (
    fromAddress: string, 
    toAddress: string, 
    amount: number, 
    conversationId?: string
  ) => {
    try {
      const response = await fetch('/api/xmtp/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAddress, toAddress, amount, conversationId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }
      
      const data = await response.json();
      return data.transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }, []);

  const startListening = useCallback((onMessage: (message: XMTPMessage) => void) => {
    if (!xmtpService.isInitialized()) {
      throw new Error('XMTP service not initialized');
    }
    
    messageHandlerRef.current = onMessage;
    xmtpService.startListening(onMessage);
  }, []);

  const stopListening = useCallback(() => {
    if (messageHandlerRef.current) {
      xmtpService.stopListening(messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!xmtpService.isInitialized()) return;
    
    try {
      const convs = await xmtpService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  }, []);

  const reset = useCallback(() => {
    xmtpService.cleanup();
    setIsInitialized(false);
    setAgentAddress('');
    setAgentInboxId('');
    setConversations([]);
    setError(null);
    setIsInitializing(false);
    setConnectionHealth('offline');
    messageHandlerRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageHandlerRef.current) {
        xmtpService.stopListening(messageHandlerRef.current);
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isInitializing,
    error,
    agentAddress,
    agentInboxId,
    conversations,
    connectionHealth,
    
    // Methods
    initialize,
    createConversation,
    sendMessage,
    getMessages,
    processAIMessage,
    getBalance,
    createTransaction,
    startListening,
    stopListening,
    refreshConversations,
    reset,
    
    // Service instance
    service: xmtpService
  };
}
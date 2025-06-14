/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface XMTPConfig {
  walletKey: string;
  encryptionKey: string;
  env: 'dev' | 'production';
  xmtpEnv?: 'dev' | 'production';
  groqApiKey?: string;
}

export interface XMTPMessage {
  id: string;
  content: string;
  senderInboxId: string;
  conversationId: string;
  sentAt: string;
  timestamp: string;
}

export interface XMTPConversation {
  id: string;
  topic: string;
  peerInboxId: string;
  createdAt: string;
  lastMessage?: any;
  isGroupChat: boolean;
}

class XMTPClientService {
  private config: XMTPConfig | null = null;
  private eventSource: EventSource | null = null;
  private messageHandlers: ((message: XMTPMessage) => void)[] = [];

  async initialize(config: XMTPConfig): Promise<{ address: string; inboxId: string }> {
    this.config = config;
    
    const response = await fetch('/api/xmtp/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletKey: config.walletKey,
        encryptionKey: config.encryptionKey,
        env: config.env,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initialize XMTP');
    }

    const data = await response.json();
    return { address: data.address, inboxId: data.inboxId };
  }

  async getConversations(): Promise<XMTPConversation[]> {
    if (!this.config) throw new Error('Client not initialized');

    const params = new URLSearchParams({
      walletKey: this.config.walletKey,
      encryptionKey: this.config.encryptionKey,
      env: this.config.env,
    });

    const response = await fetch(`/api/xmtp/conversations?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get conversations');
    }

    const data = await response.json();
    return data.conversations;
  }

  async createConversation(peerAddress: string): Promise<XMTPConversation> {
    if (!this.config) throw new Error('Client not initialized');

    const response = await fetch('/api/xmtp/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletKey: this.config.walletKey,
        encryptionKey: this.config.encryptionKey,
        env: this.config.env,
        peerAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create conversation');
    }

    const data = await response.json();
    return data.conversation;
  }

  async getMessages(conversationId: string): Promise<XMTPMessage[]> {
    if (!this.config) throw new Error('Client not initialized');

    const params = new URLSearchParams({
      walletKey: this.config.walletKey,
      encryptionKey: this.config.encryptionKey,
      env: this.config.env,
      conversationId,
    });

    const response = await fetch(`/api/xmtp/messages?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get messages');
    }

    const data = await response.json();
    return data.messages;
  }

  async sendMessage(conversationId: string, content: string): Promise<XMTPMessage> {
    if (!this.config) throw new Error('Client not initialized');

    const response = await fetch('/api/xmtp/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletKey: this.config.walletKey,
        encryptionKey: this.config.encryptionKey,
        env: this.config.env,
        conversationId,
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const data = await response.json();
    return data.message;
  }

  async processAIMessage(message: string, senderAddress: string): Promise<string> {
    const response = await fetch('/api/xmtp/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        senderAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process AI message');
    }

    const data = await response.json();
    return data.response;
  }

  startListening(onMessage: (message: XMTPMessage) => void): void {
    if (!this.config) throw new Error('Client not initialized');

    // Add to handlers
    this.messageHandlers.push(onMessage);

    // Create EventSource if not exists
    if (!this.eventSource) {
      const params = new URLSearchParams({
        walletKey: this.config.walletKey,
        encryptionKey: this.config.encryptionKey,
        env: this.config.env,
      });

      this.eventSource = new EventSource(`/api/xmtp/stream?${params}`);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            // Notify all handlers
            this.messageHandlers.forEach(handler => handler(data));
          } else if (data.type === 'error') {
            console.error('XMTP Stream error:', data);
          } else if (data.type === 'connected') {
            console.log('XMTP Stream connected:', data.timestamp);
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
      };
    }
  }

  stopListening(onMessage?: (message: XMTPMessage) => void): void {
    if (onMessage) {
      // Remove specific handler
      this.messageHandlers = this.messageHandlers.filter(h => h !== onMessage);
    } else {
      // Remove all handlers
      this.messageHandlers = [];
    }

    // Close EventSource if no handlers left
    if (this.messageHandlers.length === 0 && this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  cleanup(): void {
    this.messageHandlers = [];
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.config = null;
  }

  isInitialized(): boolean {
    return this.config !== null;
  }
}

// Create singleton instance
export const xmtpService = new XMTPClientService();

// React Hook for XMTP
export function useXMTPNode() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState<string>('');
  const [agentInboxId, setAgentInboxId] = useState<string>('');
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const messageHandlerRef = useRef<((message: XMTPMessage) => void) | null>(null);

  const initialize = useCallback(async (config: XMTPConfig) => {
    try {
      setError(null);
      setIsInitializing(true);
      
      const { address, inboxId } = await xmtpService.initialize(config);
      setAgentAddress(address);
      setAgentInboxId(inboxId);
      setIsInitialized(true);
      
      // Load conversations
      const convs = await xmtpService.getConversations();
      setConversations(convs);
      
      console.log('✅ XMTP Node SDK initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP';
      setError(errorMessage);
      setIsInitialized(false);
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
    
    const conversation = await xmtpService.createConversation(peerAddress);
    setConversations(prev => [conversation, ...prev]);
    return conversation;
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!xmtpService.isInitialized()) {
      throw new Error('XMTP service not initialized');
    }
    
    return await xmtpService.sendMessage(conversationId, content);
  }, []);

  const getMessages = useCallback(async (conversationId: string) => {
    if (!xmtpService.isInitialized()) {
      throw new Error('XMTP service not initialized');
    }
    
    return await xmtpService.getMessages(conversationId);
  }, []);

  const processAIMessage = useCallback(async (message: string, senderAddress: string) => {
    return await xmtpService.processAIMessage(message, senderAddress);
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
    
    // Methods
    initialize,
    createConversation,
    sendMessage,
    getMessages,
    processAIMessage,
    startListening,
    stopListening,
    refreshConversations,
    reset,
    
    // Service instance for advanced usage
    service: xmtpService
  };
}
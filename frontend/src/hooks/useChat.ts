/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatThread, ChatRequest, ChatResponse } from '@/types/chat';


interface UseChatOptions {
  userAddress?: string;
  autoSave?: boolean;
}

interface UseChatReturn {
  // State
  messages: ChatMessage[];
  threads: ChatThread[];
  activeThreadId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  createNewThread: (title?: string) => void;
  switchThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  clearCurrentThread: () => void;
  clearAllThreads: () => void;
  
  // Utils
  getThreadMessages: (threadId: string) => ChatMessage[];
  updateThreadTitle: (threadId: string, title: string) => void;
}

const STORAGE_KEYS = {
  THREADS: 'chat_threads',
  MESSAGES: 'chat_messages',
  ACTIVE_THREAD: 'active_thread_id'
};

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { userAddress, autoSave = true } = options;
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && autoSave) {
      try {
        // Load threads
        const savedThreads = localStorage.getItem(STORAGE_KEYS.THREADS);
        if (savedThreads) {
          const parsedThreads = JSON.parse(savedThreads).map((thread: any) => ({
            ...thread,
            createdAt: new Date(thread.createdAt),
            updatedAt: new Date(thread.updatedAt)
          }));
          setThreads(parsedThreads);
        }

        // Load messages
        const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        }

        // Load active thread
        const savedActiveThread = localStorage.getItem(STORAGE_KEYS.ACTIVE_THREAD);
        if (savedActiveThread) {
          setActiveThreadId(savedActiveThread);
        }
      } catch (error) {
        console.error('Error loading chat data from localStorage:', error);
      }
    }
  }, [autoSave]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && autoSave) {
      try {
        localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        if (activeThreadId) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_THREAD, activeThreadId);
        }
      } catch (error) {
        console.error('Error saving chat data to localStorage:', error);
      }
    }
  }, [threads, messages, activeThreadId, autoSave]);

  // Create new thread
  const createNewThread = useCallback((title?: string) => {
    const newThread: ChatThread = {
      id: uuidv4(),
      title: title || `Chat ${threads.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0
    };

    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  }, [threads.length]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create thread if none exists
      let currentThreadId = activeThreadId;
      if (!currentThreadId) {
        const newThread: ChatThread = {
          id: uuidv4(),
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0
        };
        setThreads(prev => [newThread, ...prev]);
        setActiveThreadId(newThread.id);
        currentThreadId = newThread.id;
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        content,
        role: 'user',
        timestamp: new Date(),
        threadId: currentThreadId
      };

      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);

      // Update thread message count and timestamp
      setThreads(prev => prev.map(thread => 
        thread.id === currentThreadId 
          ? { 
              ...thread, 
              messageCount: thread.messageCount + 1,
              updatedAt: new Date(),
              title: thread.messageCount === 0 
                ? (content.slice(0, 30) + (content.length > 30 ? '...' : ''))
                : thread.title
            }
          : thread
      ));

      // Send to API
      const requestBody: ChatRequest = {
        message: content,
        threadId: currentThreadId,
        senderAddress: userAddress
      };

      const response = await fetch('/api/xmtp/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        threadId: currentThreadId
      };

      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);

      // Update thread message count again
      setThreads(prev => prev.map(thread => 
        thread.id === currentThreadId 
          ? { 
              ...thread, 
              messageCount: thread.messageCount + 1,
              updatedAt: new Date()
            }
          : thread
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Create error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        role: 'assistant',
        timestamp: new Date(),
        threadId: activeThreadId || 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [activeThreadId, userAddress]);

  // Switch thread
  const switchThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setError(null);
  }, []);

  // Delete thread
  const deleteThread = useCallback((threadId: string) => {
    setThreads(prev => prev.filter(thread => thread.id !== threadId));
    setMessages(prev => prev.filter(msg => msg.threadId !== threadId));
    
    if (activeThreadId === threadId) {
      const remainingThreads = threads.filter(thread => thread.id !== threadId);
      setActiveThreadId(remainingThreads.length > 0 ? remainingThreads[0].id : null);
    }
  }, [threads, activeThreadId]);

  // Clear current thread
  const clearCurrentThread = useCallback(async () => {
    if (!activeThreadId) return;

    try {
      // Call API to clear server-side history
      await fetch('/api/xmtp/ai', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'clearHistory',
          threadId: activeThreadId
        })
      });

      // Clear local messages for this thread
      setMessages(prev => prev.filter(msg => msg.threadId !== activeThreadId));
      
      // Reset thread message count
      setThreads(prev => prev.map(thread => 
        thread.id === activeThreadId 
          ? { ...thread, messageCount: 0, updatedAt: new Date() }
          : thread
      ));
    } catch (error) {
      console.error('Error clearing thread:', error);
      setError('Failed to clear conversation');
    }
  }, [activeThreadId]);

  // Clear all threads
  const clearAllThreads = useCallback(() => {
    setThreads([]);
    setMessages([]);
    setActiveThreadId(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.THREADS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_THREAD);
    }
  }, []);

  // Get messages for specific thread
  const getThreadMessages = useCallback((threadId: string): ChatMessage[] => {
    return messages.filter(msg => msg.threadId === threadId);
  }, [messages]);

  // Update thread title
  const updateThreadTitle = useCallback((threadId: string, title: string) => {
    setThreads(prev => prev.map(thread => 
      thread.id === threadId 
        ? { ...thread, title, updatedAt: new Date() }
        : thread
    ));
  }, []);

  return {
    // State
    messages: activeThreadId ? getThreadMessages(activeThreadId) : [],
    threads,
    activeThreadId,
    isLoading,
    error,
    
    // Actions
    sendMessage,
    createNewThread,
    switchThread,
    deleteThread,
    clearCurrentThread,
    clearAllThreads,
    
    // Utils
    getThreadMessages,
    updateThreadTitle
  };
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from 'ai/react';
import { createChat, createConversation, saveMessage, updateChatTitle } from '../../lib/chat-actions';
import { generateChatTitle } from '../../lib/chat-utils';

interface UseChatPersistenceProps {
  messages: Message[];
  provider: string;
  model?: string;
  existingChatId?: string;
  existingConversationId?: string;
}

export function useChatPersistence({ messages, provider, model, existingChatId, existingConversationId }: UseChatPersistenceProps) {
  const [chatId, setChatId] = useState<string | null>(existingChatId || null);
  const [conversationId, setConversationId] = useState<string | null>(existingConversationId || null);
  const [isInitialized, setIsInitialized] = useState(!!(existingChatId && existingConversationId));
  const lastMessageCountRef = useRef(existingConversationId ? messages.length : 0);
  const hasSavedTitleRef = useRef(!!(existingChatId && existingConversationId));
  const isInitializingRef = useRef(false); // Prevent multiple concurrent initializations

  // Set IDs immediately if we have existing ones
  useEffect(() => {
    if (existingChatId && existingConversationId && (!chatId || !conversationId)) {
      setChatId(existingChatId);
      setConversationId(existingConversationId);
      setIsInitialized(true);
    }
  }, [existingChatId, existingConversationId, chatId, conversationId]);

  // Initialize chat and conversation when first message is sent
  const initializeConversationIfNeeded = async () => {
    if (conversationId && chatId) return { chatId, conversationId };
    
    // Prevent multiple concurrent initializations
    if (isInitializingRef.current) {
      // Wait for current initialization to complete
      while (isInitializingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return { chatId, conversationId };
    }
    
    isInitializingRef.current = true;
    
    try {
      let currentChatId = chatId;
      
      // Create chat if needed
      if (!currentChatId) {
        currentChatId = await createChat();
        setChatId(currentChatId);
        console.log('Chat initialized:', currentChatId);
        
        // Notify UI that a new chat was created
        window.dispatchEvent(new CustomEvent('chatCreated', { detail: { chatId: currentChatId } }));
      }
      
      // Create conversation if needed
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await createConversation(currentChatId, provider, model);
        setConversationId(currentConversationId);
        console.log('Conversation initialized:', currentConversationId);
      }
      
      setIsInitialized(true);
      return { chatId: currentChatId, conversationId: currentConversationId };
    } catch (error) {
      console.error('Failed to initialize chat/conversation:', error);
      // Set fallback temporary IDs
      const tempChatId = `temp-chat-${Date.now()}`;
      const tempConversationId = `temp-conv-${Date.now()}`;
      setChatId(tempChatId);
      setConversationId(tempConversationId);
      setIsInitialized(true);
      return { chatId: tempChatId, conversationId: tempConversationId };
    } finally {
      isInitializingRef.current = false;
    }
  };

  // Save messages when they change (simplified approach)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    async function saveNewMessages() {
      if (messages.length === 0) return;
      
      // Initialize chat and conversation if needed (when first message arrives)
      const { chatId: currentChatId, conversationId: currentConversationId } = await initializeConversationIfNeeded();
      if (!currentConversationId || !currentChatId) return;
      
      const currentMessageCount = messages.length;
      const lastSavedCount = lastMessageCountRef.current;
      
      // Only proceed if we have new messages
      if (currentMessageCount <= lastSavedCount) return;
      
      // Strategy: Instead of trying to save every update, we'll save the current state
      // and let the database handle deduplication by updating existing messages
      
      // Save all messages (database will handle duplicates via upsert logic)
      for (let i = lastSavedCount; i < messages.length; i++) {
        const message = messages[i];
        
        try {
          await saveMessage(currentConversationId, message.role as 'user' | 'assistant', message.content);
          console.log('Message saved:', message.role, message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''));
        } catch (error) {
          console.error('Failed to save message:', error);
        }
      }

      // Update the title based on the first user message (only if no title exists)
      if (!hasSavedTitleRef.current && messages.length >= 1 && messages[0].role === 'user') {
        try {
          // Skip temporary chats
          if (!currentChatId.startsWith('temp-')) {
            // Check if chat already has a title before auto-generating one
            const { getChat } = await import('../../lib/chat-actions');
            const existingChat = await getChat(currentChatId);
            
            // Only generate title if chat has no title or has default title
            if (!existingChat?.title || existingChat.title === 'Untitled Chat') {
              const title = generateChatTitle(messages[0].content);
              await updateChatTitle(currentChatId, title);
              console.log('Auto-generated chat title:', title);
            } else {
              console.log('Chat already has a custom title, skipping auto-generation:', existingChat.title);
            }
            
            hasSavedTitleRef.current = true;
            
            // Notify UI that chat was updated
            window.dispatchEvent(new CustomEvent('chatUpdated', { detail: { chatId: currentChatId } }));
          }
        } catch (error) {
          console.error('Failed to update title:', error);
        }
      }

      lastMessageCountRef.current = currentMessageCount;
    }

    // Debounce to avoid saving every keystroke during streaming
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(saveNewMessages, 1000); // Wait 1 second after streaming stops

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [messages]);

  // Reset state when provider/model changes (but not for existing chats)
  useEffect(() => {
    if (!existingChatId && !existingConversationId) {
      setIsInitialized(false);
      setChatId(null);
      setConversationId(null);
      lastMessageCountRef.current = 0;
      hasSavedTitleRef.current = false;
    }
  }, [provider, model, existingChatId, existingConversationId]);

  return {
    chatId,
    conversationId,
    isInitialized,
  };
}
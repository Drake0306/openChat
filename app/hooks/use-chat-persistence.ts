'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from 'ai/react';
import { createConversation, saveMessage, updateConversationTitle } from '../../lib/chat-actions';
import { generateChatTitle } from '../../lib/chat-utils';

interface UseChatPersistenceProps {
  messages: Message[];
  provider: string;
  model?: string;
  existingConversationId?: string;
}

export function useChatPersistence({ messages, provider, model, existingConversationId }: UseChatPersistenceProps) {
  const [conversationId, setConversationId] = useState<string | null>(existingConversationId || null);
  const [isInitialized, setIsInitialized] = useState(!!existingConversationId);
  const lastMessageCountRef = useRef(existingConversationId ? messages.length : 0);
  const hasSavedTitleRef = useRef(!!existingConversationId);

  // Initialize conversation on component mount
  useEffect(() => {
    async function initConversation() {
      if (isInitialized || existingConversationId) return;
      
      try {
        const newConversationId = await createConversation(provider, model);
        setConversationId(newConversationId);
        setIsInitialized(true);
        console.log('Chat conversation initialized:', newConversationId);
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        // Set a fallback temporary ID
        setConversationId(`temp-${Date.now()}`);
        setIsInitialized(true);
      }
    }

    initConversation();
  }, [provider, model, isInitialized, existingConversationId]);

  // Save messages when they change
  useEffect(() => {
    async function saveNewMessages() {
      if (!conversationId || !isInitialized) return;
      
      const currentMessageCount = messages.length;
      const newMessagesCount = currentMessageCount - lastMessageCountRef.current;
      
      if (newMessagesCount > 0) {
        // Save only the new messages
        const newMessages = messages.slice(-newMessagesCount);
        
        for (const message of newMessages) {
          try {
            await saveMessage(conversationId, message.role as 'user' | 'assistant', message.content);
            console.log('Message saved:', message.role, message.content.substring(0, 50) + '...');
          } catch (error) {
            console.error('Failed to save message:', error);
          }
        }

        // Update the title based on the first user message
        if (!hasSavedTitleRef.current && messages.length >= 1 && messages[0].role === 'user') {
          try {
            const title = generateChatTitle(messages[0].content);
            await updateConversationTitle(conversationId, title);
            hasSavedTitleRef.current = true;
            console.log('Chat title updated:', title);
          } catch (error) {
            console.error('Failed to update title:', error);
          }
        }

        lastMessageCountRef.current = currentMessageCount;
      }
    }

    saveNewMessages();
  }, [messages, conversationId, isInitialized]);

  // Reset state when provider/model changes (but not for existing conversations)
  useEffect(() => {
    if (!existingConversationId) {
      setIsInitialized(false);
      setConversationId(null);
      lastMessageCountRef.current = 0;
      hasSavedTitleRef.current = false;
    }
  }, [provider, model, existingConversationId]);

  return {
    conversationId,
    isInitialized,
  };
}
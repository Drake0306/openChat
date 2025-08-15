'use client';

import { useState } from 'react';
import ChatClient from '../../components/chat/chat-client';
import ChatLayout from '../../components/layout/chat-layout';
import type { Chat } from '../../../lib/chat-actions';

interface ChatPageClientProps {
  availableProviders: { 
    id: string; 
    name: string; 
    supportsModelSelection?: boolean; 
  }[];
  user?: {
    name?: string | null;
    email?: string | null;
    plan?: string;
  };
  existingChat?: Chat | null;
  chatId?: string;
  conversationId?: string;
  isNewChat: boolean;
}

export default function ChatPageClient({
  availableProviders,
  user,
  existingChat,
  chatId,
  conversationId,
  isNewChat
}: ChatPageClientProps) {
  const [currentModel, setCurrentModel] = useState<string>('');
  const [currentProvider, setCurrentProvider] = useState<string>('');

  const handleModelChange = (model: string, provider: string) => {
    setCurrentModel(model);
    setCurrentProvider(availableProviders.find(p => p.id === provider)?.name || provider);
  };

  return (
    <ChatLayout 
      currentChatId={isNewChat ? undefined : chatId}
      currentModel={currentModel}
      currentProvider={currentProvider}
    >
      <ChatClient 
        availableProviders={availableProviders}
        user={user}
        existingChat={existingChat}
        chatId={chatId}
        conversationId={conversationId}
        onModelChange={handleModelChange}
      />
    </ChatLayout>
  );
}
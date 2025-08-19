'use client';

import { useState, lazy, Suspense } from 'react';
import ChatLayout from '../../components/layout/chat-layout';
import { ChatLoadingSkeleton } from '../../components/ui/loading-skeletons';
import type { Chat } from '../../../lib/chat-actions';

const ChatClient = lazy(() => import('../../components/chat/chat-client'));

interface ChatPageClientProps {
  availableProviders: { 
    id: string; 
    name: string; 
    supportsModelSelection?: boolean;
    hasEnabledModels?: boolean;
    enabledModels?: any[];
    directSelect?: boolean;
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
      <Suspense fallback={<ChatLoadingSkeleton />}>
        <ChatClient 
          key={isNewChat ? 'new-chat' : `${chatId}-${conversationId}`}
          availableProviders={availableProviders}
          user={user}
          existingChat={isNewChat ? null : existingChat}
          chatId={isNewChat ? undefined : chatId}
          conversationId={isNewChat ? undefined : conversationId}
          onModelChange={handleModelChange}
        />
      </Suspense>
    </ChatLayout>
  );
}
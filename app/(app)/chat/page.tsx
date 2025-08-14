import { auth } from '../../../lib/auth';
import { getAvailableProviders } from '../../../lib/llm-providers';
import { getChat } from '../../../lib/chat-actions';
import ChatClient from '../../components/chat/chat-client';
import ChatLayout from '../../components/layout/chat-layout';

interface ChatPageProps {
  searchParams: { id?: string; conversation?: string; new?: string };
}

async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await auth();
  const availableProviders = getAvailableProviders(session?.user?.plan || 'NONE');
  
  // Load existing chat if ID provided (but not if this is a new chat)
  let existingChat = null;
  if (searchParams.id && !searchParams.new) {
    try {
      existingChat = await getChat(searchParams.id);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  }

  const isNewChat = !!searchParams.new;
  
  return (
    <ChatLayout currentChatId={isNewChat ? undefined : searchParams.id}>
      <ChatClient 
        availableProviders={availableProviders}
        user={session?.user}
        existingChat={existingChat}
        chatId={isNewChat ? undefined : searchParams.id}
        conversationId={isNewChat ? undefined : searchParams.conversation}
      />
    </ChatLayout>
  );
}

export default ChatPage;

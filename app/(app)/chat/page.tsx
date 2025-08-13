import { auth } from '../../../lib/auth';
import { getAvailableProviders } from '../../../lib/llm-providers';
import { getConversation } from '../../../lib/chat-actions';
import ChatClient from '../../components/chat/chat-client';
import ChatLayout from '../../components/layout/chat-layout';

interface ChatPageProps {
  searchParams: { id?: string };
}

async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await auth();
  const availableProviders = getAvailableProviders(session?.user?.plan || 'NONE');
  
  // Load existing conversation if ID provided
  let existingConversation = null;
  if (searchParams.id) {
    try {
      existingConversation = await getConversation(searchParams.id);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }

  return (
    <ChatLayout currentConversationId={searchParams.id}>
      <ChatClient 
        availableProviders={availableProviders}
        user={session?.user}
        existingConversation={existingConversation}
        conversationId={searchParams.id}
      />
    </ChatLayout>
  );
}

export default ChatPage;

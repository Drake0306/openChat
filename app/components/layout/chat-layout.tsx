'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ChatSidebar from '../navigation/chat-sidebar';

interface ChatLayoutProps {
  children: React.ReactNode;
  currentConversationId?: string | null;
}

export default function ChatLayout({ children, currentConversationId }: ChatLayoutProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ChatSidebar user={session.user} currentConversationId={currentConversationId} />
      <main className="flex-1 lg:ml-0">
        <div className="lg:pl-0 pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
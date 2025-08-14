'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import UnifiedSidebar from '../navigation/unified-sidebar';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  currentChatId?: string | null;
}

export default function UnifiedLayout({ children, currentChatId }: UnifiedLayoutProps) {
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
    <div className="h-screen overflow-hidden">
      <SidebarProvider>
        <UnifiedSidebar user={session.user} currentChatId={currentChatId} />
        <SidebarInset className="flex flex-col h-full">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>
          <main className="flex-1 overflow-hidden min-h-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
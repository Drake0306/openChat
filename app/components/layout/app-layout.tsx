'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from '../navigation/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
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
      <Sidebar user={session.user} />
      <main className="flex-1 lg:ml-0">
        <div className="lg:pl-0 pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
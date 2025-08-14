'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('User authenticated, redirecting to chat...');
      router.push('/chat');
      router.refresh();
    }
  }, [status, session, router]);

  return { session, status, isAuthenticated: status === 'authenticated' };
}
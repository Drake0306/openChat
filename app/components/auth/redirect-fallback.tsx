'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RedirectFallbackProps {
  to: string;
  delay?: number;
}

export function RedirectFallback({ to, delay = 2000 }: RedirectFallbackProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Fallback redirect triggered to:', to);
      router.push(to);
      router.refresh();
    }, delay);

    return () => clearTimeout(timer);
  }, [to, delay, router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Redirecting to chat...</p>
        <p className="text-xs text-muted-foreground/60">If you're not redirected automatically, please refresh the page.</p>
      </div>
    </div>
  );
}
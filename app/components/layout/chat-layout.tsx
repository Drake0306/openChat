import UnifiedLayout from './unified-layout';

interface ChatLayoutProps {
  children: React.ReactNode;
  currentChatId?: string | null;
}

export default function ChatLayout({ children, currentChatId }: ChatLayoutProps) {
  return (
    <UnifiedLayout currentChatId={currentChatId}>
      {children}
    </UnifiedLayout>
  );
}
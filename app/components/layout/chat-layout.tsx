import UnifiedLayout from './unified-layout';

interface ChatLayoutProps {
  children: React.ReactNode;
  currentChatId?: string | null;
  currentModel?: string;
  currentProvider?: string;
}

export default function ChatLayout({ children, currentChatId, currentModel, currentProvider }: ChatLayoutProps) {
  return (
    <UnifiedLayout currentChatId={currentChatId} currentModel={currentModel} currentProvider={currentProvider}>
      {children}
    </UnifiedLayout>
  );
}
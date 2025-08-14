import UnifiedLayout from './unified-layout';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <UnifiedLayout>
      {children}
    </UnifiedLayout>
  );
}
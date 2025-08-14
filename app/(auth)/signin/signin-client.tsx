'use client';

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useFormStatus } from 'react-dom';
import { useAuthRedirect } from '../../hooks/use-auth-redirect';

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108755-2616b612b550?w=150&h=150&fit=crop&crop=face",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "OpenChat transformed my workflow with seamless access to multiple AI providers in one place."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "The local LLM support with Ollama integration is game-changing for privacy-focused development."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "Premium multi-provider access with clean UI. Exactly what I needed for my AI-powered projects."
  },
];

interface SignInClientProps {
  signInAction: (formData: FormData) => Promise<void>;
  googleSignInAction: () => Promise<void>;
  error?: string;
}

function SignInForm({ signInAction, googleSignInAction, error }: SignInClientProps) {
  const { pending } = useFormStatus();
  
  const handleResetPassword = () => {
    alert("Password reset functionality would be implemented here");
  };

  const handleCreateAccount = () => {
    alert("Account creation would redirect to signup page");
  };

  return (
    <SignInPage
      title={
        <>
          <span className="font-light text-foreground tracking-tighter">Welcome to </span>
          <span className="font-semibold text-blue-600">OpenChat</span>
        </>
      }
      description="Access your premium multi-provider LLM chat platform"
      heroImageSrc="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=2160&q=80"
      testimonials={testimonials}
      signInAction={signInAction}
      googleSignInAction={googleSignInAction}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      error={error}
      pending={pending}
    />
  );
}

export function SignInClient({ signInAction, googleSignInAction, error }: SignInClientProps) {
  const { isAuthenticated, status } = useAuthRedirect();

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state if authenticated
  if (isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Redirecting to chat...</p>
        </div>
      </div>
    );
  }

  return <SignInForm signInAction={signInAction} googleSignInAction={googleSignInAction} error={error} />;
}
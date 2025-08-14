import { signIn } from '../../../lib/auth';
import { SignInClient } from './signin-client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

interface SignInPageProps {
  searchParams: { error?: string };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const error = searchParams.error;
  
  const handleSignIn = async (formData: FormData) => {
    'use server';
    
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/chat',
    });
  };

  const handleGoogleSignIn = async () => {
    'use server';
    
    try {
      // Google OAuth will handle its own redirects
      await signIn('google', { redirectTo: '/chat' });
    } catch (error) {
      console.error('Google sign in error:', error);
      redirect('/signin?error=Google sign in failed');
    }
  };

  let errorMessage = '';
  if (error === 'CredentialsSignin') {
    errorMessage = 'Invalid email or password. Please try again.';
  } else if (error === 'Invalid credentials') {
    errorMessage = 'Invalid email or password. Please try again.';
  } else if (error === 'Google sign in failed') {
    errorMessage = 'Google sign in failed. Please try again.';
  } else if (error) {
    errorMessage = 'An error occurred. Please try again.';
  }

  return (
    <div className="relative">
      {/* Link to demo component for testing */}
      <div className="absolute top-4 left-4 z-50">
        <Link 
          href="/demo/sign-in"
          className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          View Demo Only
        </Link>
      </div>
      
      <SignInClient
        signInAction={handleSignIn}
        googleSignInAction={handleGoogleSignIn}
        error={errorMessage}
      />
    </div>
  );
}

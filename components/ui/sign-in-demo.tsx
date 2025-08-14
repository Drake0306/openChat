'use client';

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import Link from "next/link";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108755-2616b612b550?w=150&h=150&fit=crop&crop=face",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity."
  },
];

const SignInPageDemo = () => {
  const handleSignIn = async (formData: FormData) => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data = Object.fromEntries(formData.entries());
    console.log("Sign In submitted:", data);
    alert(`Sign In Submitted! Data: ${JSON.stringify(data, null, 2)}`);
  };

  const handleGoogleSignIn = async () => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Continue with Google clicked");
    alert("Continue with Google clicked - this would redirect to Google OAuth");
  };
  
  const handleResetPassword = () => {
    alert("Reset Password clicked - this would show password reset flow");
  }

  const handleCreateAccount = () => {
    alert("Create Account clicked - this would show registration form");
  }

  return (
    <div className="bg-background text-foreground relative">
      {/* Navigation back to original */}
      <div className="absolute top-4 left-4 z-50">
        <Link 
          href="/signin" 
          className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          ← Back to Original Sign In
        </Link>
      </div>
      
      <SignInPage
        title={
          <>
            <span className="font-light text-foreground tracking-tighter">Welcome to </span>
            <span className="font-semibold text-blue-600">OpenChat</span>
          </>
        }
        description="Access your premium multi-provider LLM chat platform"
        heroImageSrc="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=2160&q=80"
        testimonials={sampleTestimonials}
        signInAction={handleSignIn}
        googleSignInAction={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
};

export default SignInPageDemo;
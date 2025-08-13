import { signIn } from '../../../lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Bot, Zap, Shield } from 'lucide-react';

function SignInPage() {
  return (
    <div className="min-h-svh flex">
      {/* Left Column - Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold">OpenChat</h1>
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              {/* Demo Account Form */}
              <form
                action={async (formData) => {
                  'use server'
                  await signIn('credentials', {
                    email: formData.get('email'),
                    password: formData.get('password'),
                    redirectTo: '/chat'
                  })
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue="demo@example.com"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    defaultValue="password"
                    required
                    className="h-10"
                  />
                </div>
                <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700">
                  Sign In with Demo Account
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              {/* Google OAuth Form */}
              <form
                action={async () => {
                  'use server'
                  await signIn('google', { redirectTo: '/chat' })
                }}
              >
                <Button type="submit" variant="outline" className="w-full h-10">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign In with Google
                </Button>
              </form>
              
              {/* Demo Account Info */}
              <div className="rounded-lg border bg-blue-50 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-blue-900">Demo Account</h3>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-mono text-xs">demo@example.com / password</p>
                  <p>✨ PRO plan with access to all LLM providers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Right Column - Feature Showcase */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-blue-600 lg:to-purple-700 lg:px-20">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">
            Premium Multi-Provider LLM Chat
          </h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Multiple AI Providers</h3>
                <p className="text-blue-100 text-sm">
                  Access OpenAI, Anthropic, LM Studio, and Ollama from one interface
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Local LLM Support</h3>
                <p className="text-blue-100 text-sm">
                  Run models locally with LM Studio and Ollama integration
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Subscription Plans</h3>
                <p className="text-blue-100 text-sm">
                  BASIC and PRO plans with tiered access to premium providers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;

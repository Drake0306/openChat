import { updateUserPlan } from '../../../lib/actions';
import { auth } from '../../../lib/auth';
import AppLayout from '../../components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Cpu, Crown } from 'lucide-react';

async function SubscribePage() {
  const session = await auth();
  const userPlan = session?.user?.plan || 'NONE';
  const isDemo = session?.user?.email === 'demo@example.com';
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
            {userPlan !== 'NONE' ? (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Badge variant={userPlan === 'PRO' ? 'default' : 'secondary'} className="px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Current: {userPlan} Plan
                </Badge>
                {isDemo && (
                  <Badge variant="outline" className="px-3 py-1">
                    Demo Account
                  </Badge>
                )}
              </div>
            ) : null}
            <p className="text-lg text-gray-600">
              Unlock powerful AI capabilities with our flexible subscription plans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Cpu className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Basic Plan</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">Free</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Access to Local LLM</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited local conversations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Basic support</span>
                  </li>
                </ul>
                <form action={async () => { 'use server'; await updateUserPlan('BASIC'); }} className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant={userPlan === 'BASIC' ? 'default' : 'outline'} 
                    size="lg"
                    disabled={isDemo}
                  >
                    {userPlan === 'BASIC' ? 'Current Plan' : 'Select Basic Plan'}
                  </Button>
                  {isDemo && (
                    <p className="text-xs text-gray-500 mt-2">Demo account plan cannot be changed</p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-purple-200 shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Pro Plan</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$19</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Access to OpenAI GPT models</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Access to Anthropic Claude</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>Advanced features</span>
                  </li>
                </ul>
                <form action={async () => { 'use server'; await updateUserPlan('PRO'); }} className="pt-4">
                  <Button 
                    type="submit" 
                    className={`w-full ${userPlan === 'PRO' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                    size="lg"
                    disabled={isDemo}
                    variant={userPlan === 'PRO' ? 'default' : undefined}
                  >
                    {userPlan === 'PRO' ? 'Current Plan ✨' : 'Select Pro Plan'}
                  </Button>
                  {isDemo && (
                    <p className="text-xs text-gray-500 mt-2">Demo account has PRO access</p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              All plans include access to our chat interface and conversation history.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You can change or cancel your plan at any time.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default SubscribePage;

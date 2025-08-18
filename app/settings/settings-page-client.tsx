'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Crown, 
  Zap, 
  MessageSquare, 
  Palette,
  Key,
  Paperclip,
  Mail,
  Settings as SettingsIcon,
  Trash2,
  Sun
} from 'lucide-react';

interface SettingsPageClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    plan?: string;
  };
}

export default function SettingsPageClient({ user }: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState('account');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'customization', label: 'Customization', icon: Palette },
    { id: 'history', label: 'History & Sync', icon: MessageSquare },
    { id: 'models', label: 'Models', icon: Zap },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
    { id: 'contact', label: 'Contact Us', icon: Mail },
  ];

  // Sync activeTabIndex when activeTab changes
  useEffect(() => {
    const index = tabs.findIndex(tab => tab.id === activeTab);
    if (index !== -1) {
      setActiveTabIndex(index);
    }
  }, [activeTab, tabs]);

  // Update slider position when activeTabIndex changes
  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTabIndex];
    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      const padding = 12; // 4px padding on each side
      const adjustedWidth = offsetWidth - (padding * 2) + 8; // Add 8px to make it 80px instead of 72px
      setSliderStyle({
        left: offsetLeft + padding, // Adjust left to center the wider pill
        width: adjustedWidth
      });
    }
  }, [activeTabIndex]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab user={user} />;
      case 'customization':
        return <CustomizationTab />;
      case 'history':
        return <HistoryTab />;
      case 'models':
        return <ModelsTab />;
      case 'api-keys':
        return <ApiKeysTab />;
      case 'attachments':
        return <AttachmentsTab />;
      case 'contact':
        return <ContactTab />;
      default:
        return <AccountTab user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Sun className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut({ callbackUrl: '/signin' })}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-160px)]">
          {/* Left Sidebar with User Profile and Navigation */}
          <div className="w-full lg:w-80 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {/* User Profile Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h2>
              <p className="text-sm text-gray-600 mb-2">{user.email}</p>
              <Badge
                variant={user.plan === 'PRO' ? 'default' : 'secondary'}
                className={`text-xs ${
                  user.plan === 'PRO' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : user.plan === 'BASIC'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {user.plan === 'PRO' && <Crown className="h-3 w-3 mr-1" />}
                {user.plan || 'Free Plan'}
              </Badge>
            </div>

            {/* Message Usage */}
            <Card className="mb-6 bg-gray-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Message Usage</CardTitle>
                <p className="text-xs text-gray-600">Resets today at 5:29 AM</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Standard</span>
                  <span className="text-sm text-red-600">0/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-sm text-gray-600">20 messages remaining</p>
                <p className="text-xs text-gray-500 mt-2 italic">
                  * Each tool call (e.g., search grounding) used in a reply consumes an additional standard credit. Models may not always utilize enabled tools.
                </p>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="bg-gray-50/50">
              <CardHeader>
                <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Search</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">K</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">New Chat</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Shift</kbd>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">O</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Toggle Sidebar</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">B</kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Pill-shaped Tab Navigation with Smooth Animation */}
            <div className="p-2 bg-gray-100 rounded-t-lg">
              <nav className="relative bg-gray-200 rounded-full p-1 overflow-x-auto lg:overflow-hidden">
                {/* Animated Background Slider */}
                <div 
                  className="absolute bg-white rounded-full shadow-sm transition-all duration-300 ease-out z-10"
                  style={{
                    left: sliderStyle.left,
                    width: sliderStyle.width,
                    top: '4px',
                    bottom: '4px'
                  }}
                />
                
                <div className="flex gap-1 relative z-20">
                  {tabs.map((tab, index) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        ref={(el) => { tabRefs.current[index] = el; }}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setActiveTabIndex(index);
                        }}
                        className={`relative flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-300 whitespace-nowrap rounded-full ${
                          activeTab === tab.id
                            ? 'text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        style={{ minWidth: 'fit-content', width: '100px', justifyContent: 'center' }}
                      >
                        <span className="hidden md:inline">{tab.label}</span>
                        <span className="md:hidden text-sm truncate max-w-14">{tab.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user }: { user: { name?: string | null; email?: string | null; plan?: string } }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upgrade to Pro Card */}
        <Card className="xl:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900">Upgrade to Pro</CardTitle>
              <div className="text-right">
                <span className="text-3xl font-bold text-blue-600">$8</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Access to All Models</h4>
                  <p className="text-sm text-gray-600">Get access to our full suite of models including Claude, G3-mini-high, and more!</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Crown className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Generous Limits</h4>
                  <p className="text-sm text-gray-600">
                    Receive <span className="font-semibold">1500 standard</span> credits per month, plus <span className="font-semibold">100 premium credits</span>* per month.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Priority Support</h4>
                  <p className="text-sm text-gray-600">Get faster responses and dedicated assistance from the T3 team whenever you need help!</p>
                </div>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Upgrade Now
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              * Premium credits are used for GPT Image Gen, o3, Claude Sonnet, Gemini 2.5 Pro, GPT 5 (Reasoning), and Grok 3/4. 
              Additional Premium credits can be purchased separately for $8 per 100.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">Permanently delete your account and all associated data.</p>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomizationTab() {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Customization Settings</h3>
      <p className="text-gray-600">Theme and appearance settings will be available here.</p>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">History & Sync</h3>
      <p className="text-gray-600">Chat history and synchronization settings will be available here.</p>
    </div>
  );
}

function ModelsTab() {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Model Settings</h3>
      <p className="text-gray-600">AI model preferences and configurations will be available here.</p>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">API Keys</h3>
      <p className="text-gray-600">Manage your API keys and integrations here.</p>
    </div>
  );
}

function AttachmentsTab() {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Attachments</h3>
      <p className="text-gray-600">File attachment settings and preferences will be available here.</p>
    </div>
  );
}

function ContactTab() {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
      <p className="text-gray-600">Get in touch with our support team.</p>
    </div>
  );
}
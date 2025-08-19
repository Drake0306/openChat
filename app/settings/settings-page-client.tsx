'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Sun,
  Camera,
  Upload,
  X
} from 'lucide-react';

// Import child components
import { AccountTab } from '@/app/components/settings/account-tab';
import { CustomizationTab } from '@/app/components/settings/customization-tab';
import { HistoryTab } from '@/app/components/settings/history-tab';
import { ModelsTab } from '@/app/components/settings/models-tab';
import { ApiKeysTab } from '@/app/components/settings/api-keys-tab';
import { AttachmentsTab } from '@/app/components/settings/attachments-tab';
import { ContactTab } from '@/app/components/settings/contact-tab';

interface SettingsPageClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan?: string;
    hasGoogleAccount?: boolean;
  };
}

export default function SettingsPageClient({ user }: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState('account');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [currentUser, setCurrentUser] = useState(user);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadMessage, setAvatarUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowUploadModal(true);
    setIsUploadingAvatar(true);
    setUploadProgress(0);
    setAvatarUploadMessage('');

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(result.user);
        setAvatarUploadMessage('Profile picture updated successfully');
        
        // Close modal after 1 second
        setTimeout(() => {
          setShowUploadModal(false);
          setAvatarUploadMessage('');
          setUploadProgress(0);
        }, 1000);
      } else {
        const error = await response.json();
        setAvatarUploadMessage(error.error || 'Failed to upload profile picture');
        
        // Close modal after 3 seconds on error
        setTimeout(() => {
          setShowUploadModal(false);
          setAvatarUploadMessage('');
          setUploadProgress(0);
        }, 3000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setAvatarUploadMessage('An error occurred while uploading');
      
      // Close modal after 3 seconds on error
      setTimeout(() => {
        setShowUploadModal(false);
        setAvatarUploadMessage('');
        setUploadProgress(0);
      }, 3000);
    } finally {
      setIsUploadingAvatar(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setAvatarUploadMessage('');

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(result.user);
        setAvatarUploadMessage('Profile picture removed successfully');
        
        // Clear the message after 2 seconds
        setTimeout(() => setAvatarUploadMessage(''), 2000);
      } else {
        const error = await response.json();
        setAvatarUploadMessage(error.error || 'Failed to remove profile picture');
        
        // Clear error message after 3 seconds
        setTimeout(() => setAvatarUploadMessage(''), 3000);
      }
    } catch (error) {
      setAvatarUploadMessage('An error occurred while removing profile picture');
      
      // Clear error message after 3 seconds
      setTimeout(() => setAvatarUploadMessage(''), 3000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab user={currentUser} onUserUpdate={setCurrentUser} />;
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
        return <AccountTab user={currentUser} onUserUpdate={setCurrentUser} />;
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
              {/* Profile Picture with Upload */}
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center shadow-lg">
                  {currentUser.image ? (
                    <img 
                      src={currentUser.image} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                
                {/* Upload/Edit Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </div>

                {/* Loading Spinner */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Profile Picture Actions */}
              {currentUser.image && (
                <div className="mb-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {isUploadingAvatar ? 'Removing...' : 'Remove Photo'}
                  </Button>
                </div>
              )}

              {/* Avatar Action Message */}
              {avatarUploadMessage && !showUploadModal && (
                <div className={`text-xs mb-3 px-3 py-1 rounded-full ${
                  avatarUploadMessage.includes('success') 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {avatarUploadMessage}
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-900">{currentUser.name || 'User'}</h2>
              <p className="text-sm text-gray-600 mb-2">{currentUser.email}</p>
              <Badge
                variant={currentUser.plan === 'PRO' ? 'default' : 'secondary'}
                className={`text-xs ${
                  currentUser.plan === 'PRO' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : currentUser.plan === 'BASIC'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {currentUser.plan === 'PRO' && <Crown className="h-3 w-3 mr-1" />}
                {currentUser.plan || 'Free Plan'}
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
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Pill-shaped Tab Navigation with Smooth Animation */}
            <div className="p-2 bg-gray-100 rounded-t-lg flex-shrink-0">
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
            <div className="p-6 flex-1 flex flex-col min-h-0">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {uploadProgress === 100 ? 'Upload Complete!' : 'Uploading Profile Picture'}
                </h3>
                {avatarUploadMessage && (
                  <p className={`text-sm mt-2 ${
                    avatarUploadMessage.includes('success') 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {avatarUploadMessage}
                  </p>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    uploadProgress === 100 ? 'bg-green-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              
              {/* Progress Text */}
              <p className="text-sm text-gray-600">
                {uploadProgress === 100 ? 'Success!' : `${Math.round(uploadProgress)}% complete`}
              </p>
              
              {/* Success Icon */}
              {uploadProgress === 100 && avatarUploadMessage.includes('success') && (
                <div className="mt-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
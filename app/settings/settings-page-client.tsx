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
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Glass overlay background with warm peach tint */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(251, 222, 209, 0.3), rgba(251, 222, 209, 0.15))',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
        }}
      />
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 border-b" style={{
        background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.4), rgba(251, 222, 209, 0.25))',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(251, 222, 209, 0.5)',
        boxShadow: '0 8px 32px rgba(251, 222, 209, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-orange-700 hover:text-orange-900 transition-all duration-200"
                  style={{
                    background: 'rgba(251, 222, 209, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(251, 222, 209, 0.6)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(251, 222, 209, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(251, 222, 209, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-orange-700 hover:text-orange-900 transition-all duration-200"
                style={{
                  background: 'rgba(251, 222, 209, 0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(251, 222, 209, 0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(251, 222, 209, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(251, 222, 209, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-orange-700 hover:text-orange-900 transition-all duration-200"
                style={{
                  background: 'rgba(251, 222, 209, 0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(251, 222, 209, 0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(251, 222, 209, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(251, 222, 209, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => signOut({ callbackUrl: '/signin' })}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 overflow-auto">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-160px)]">
          {/* Left Sidebar with User Profile and Navigation */}
          <div className="w-full lg:w-80 space-y-6">
            {/* User Profile Card */}
            <div className="rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl" style={{
              background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.5), rgba(251, 222, 209, 0.3))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 222, 209, 0.7)',
              boxShadow: '0 8px 32px rgba(251, 222, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
              borderRadius: '16px',
            }}>
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
                    style={{
                      background: 'rgba(251, 222, 209, 0.3)',
                      borderColor: 'rgba(220, 38, 127, 0.4)',
                    }}
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

              <h2 className="text-xl font-bold text-orange-900">{currentUser.name || 'User'}</h2>
              <p className="text-sm text-orange-700 mb-2">{currentUser.email}</p>
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
            <Card className="mb-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl" style={{
              background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.5), rgba(251, 222, 209, 0.3))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 222, 209, 0.7)',
              boxShadow: '0 8px 32px rgba(251, 222, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
              borderRadius: '16px',
            }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-900">Message Usage</CardTitle>
                <p className="text-xs text-orange-700">Resets today at 5:29 AM</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-orange-900">Standard</span>
                  <span className="text-sm text-red-600">0/20</span>
                </div>
                <div className="w-full bg-orange-200/40 rounded-full h-2 mb-4">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-sm text-orange-800">20 messages remaining</p>
                <p className="text-xs text-orange-600 mt-2 italic">
                  * Each tool call (e.g., search grounding) used in a reply consumes an additional standard credit. Models may not always utilize enabled tools.
                </p>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl" style={{
              background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.5), rgba(251, 222, 209, 0.3))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 222, 209, 0.7)',
              boxShadow: '0 8px 32px rgba(251, 222, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
              borderRadius: '16px',
            }}>
              <CardHeader>
                <CardTitle className="text-sm text-orange-900">Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-800">Search</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-orange-200/50 rounded text-xs text-orange-900">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-orange-200/50 rounded text-xs text-orange-900">K</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-800">New Chat</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-orange-200/50 rounded text-xs text-orange-900">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-orange-200/50 rounded text-xs text-orange-900">Shift</kbd>
                    <kbd className="px-2 py-1 bg-orange-200/50 rounded text-xs text-orange-900">O</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-800">Toggle Sidebar</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-orange-200/50 rounded text-xs text-orange-900">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-orange-200/50 rounded text-xs text-orange-900">B</kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl" style={{
            background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.6), rgba(251, 222, 209, 0.4))',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(251, 222, 209, 0.8)',
            boxShadow: '0 12px 40px rgba(251, 222, 209, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 -2px 0 rgba(0, 0, 0, 0.05)',
            borderRadius: '20px',
          }}>
            {/* Pill-shaped Tab Navigation with Smooth Animation */}
            <div className="p-3 flex-shrink-0" style={{
              background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.4), rgba(251, 222, 209, 0.25))',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
            }}>
              <nav className="relative rounded-full p-1 overflow-x-auto lg:overflow-hidden" style={{
                background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.5), rgba(251, 222, 209, 0.3))',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(251, 222, 209, 0.7)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
              }}>
                {/* Animated Background Slider */}
                <div 
                  className="absolute rounded-full transition-all duration-300 ease-out z-10"
                  style={{
                    left: sliderStyle.left,
                    width: sliderStyle.width,
                    top: '4px',
                    bottom: '4px',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '0 4px 16px rgba(251, 222, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 1), 0 2px 8px rgba(0, 0, 0, 0.1)',
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
                            ? 'text-orange-900 font-semibold'
                            : 'text-orange-700 hover:text-orange-900'
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-[60]">
          <div className="p-8 max-w-md w-full mx-4 transition-all duration-300 hover:scale-105" style={{
            background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.7), rgba(251, 222, 209, 0.5))',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(251, 222, 209, 0.9)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(251, 222, 209, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 -2px 0 rgba(0, 0, 0, 0.05)',
          }}>
            <div className="text-center">
              <div className="mb-4">
                <Upload className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-orange-900">
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
              <div className="w-full bg-orange-200/50 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    uploadProgress === 100 ? 'bg-green-500' : 'bg-orange-600'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              
              {/* Progress Text */}
              <p className="text-sm text-orange-800">
                {uploadProgress === 100 ? 'Success!' : `${Math.round(uploadProgress)}% complete`}
              </p>
              
              {/* Success Icon */}
              {uploadProgress === 100 && avatarUploadMessage.includes('success') && (
                <div className="mt-4">
                  <div className="w-12 h-12 bg-green-400/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto">
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
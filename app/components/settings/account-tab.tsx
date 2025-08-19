'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Crown, 
  Key, 
  Save, 
  AlertTriangle, 
  Trash2,
  Zap
} from 'lucide-react';

interface AccountTabProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan?: string;
    hasGoogleAccount?: boolean;
  };
  onUserUpdate: (user: any) => void;
}

export function AccountTab({ user, onUserUpdate }: AccountTabProps) {
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update form when user changes
  useEffect(() => {
    setProfileForm(prev => ({
      ...prev,
      name: user.name || ''
    }));
  }, [user.name]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleProfileUpdate = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setUpdateMessage('Passwords do not match');
      return;
    }

    if (profileForm.newPassword && profileForm.newPassword.length < 6) {
      setUpdateMessage('Password must be at least 6 characters long');
      return;
    }

    setIsUpdating(true);
    setUpdateMessage('');

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onUserUpdate(result.user);
        setUpdateMessage('Profile updated successfully');
        setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        toast.success('Profile updated successfully');
      } else {
        const error = await response.json();
        const errorMessage = error.error || 'Failed to update profile';
        setUpdateMessage(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'An error occurred while updating profile';
      setUpdateMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        await signOut({ callbackUrl: '/signin' });
      } else {
        const error = await response.json();
        const errorMessage = error.error || 'Failed to delete account';
        setUpdateMessage(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'An error occurred while deleting account';
      setUpdateMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="xl:col-span-2" style={{
          background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.3), rgba(251, 222, 209, 0.2))',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(251, 222, 209, 0.4)',
          boxShadow: '0 8px 32px rgba(251, 222, 209, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-orange-900">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information Section */}
            <div className="rounded-lg p-6 space-y-4" style={{
              background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.4), rgba(251, 222, 209, 0.2))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(251, 222, 209, 0.3)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-900">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-orange-700">Display Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your display name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-orange-700">Email Address</Label>
                  <Input
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="mt-1"
                    style={{
                      background: 'rgba(251, 222, 209, 0.2)',
                      border: '1px solid rgba(251, 222, 209, 0.3)',
                    }}
                  />
                  <p className="text-xs text-orange-600 mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Password Section for Non-Google Users */}
            {!user.hasGoogleAccount && (
              <div className="rounded-lg p-6 space-y-4" style={{
                background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.3), rgba(251, 222, 209, 0.15))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(251, 222, 209, 0.4)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-900">Security</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-orange-700">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword" className="text-sm font-medium text-orange-700">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="mt-1"
                      />
                      <p className="text-xs text-orange-600 mt-1">Minimum 6 characters</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-orange-700">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Google Account Info for Google Users */}
            {user.hasGoogleAccount && (
              <div className="rounded-lg p-6" style={{
                background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    backdropFilter: 'blur(5px)',
                  }}>
                    <Key className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Google Account</h3>
                    <p className="text-sm text-blue-700">
                      You're signed in with Google. Your password is managed through your Google account.
                    </p>
                  </div>
                </div>
                <div className="rounded-md p-3" style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  backdropFilter: 'blur(5px)',
                }}>
                  <p className="text-xs text-blue-800">
                    To change your password, visit your Google Account settings at accounts.google.com
                  </p>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {updateMessage && (
              <div className={`p-4 rounded-lg text-sm font-medium ${
                updateMessage.includes('success') 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {updateMessage.includes('success') ? (
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  {updateMessage}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4" style={{ 
              borderTop: '1px solid rgba(251, 222, 209, 0.3)'
            }}>
              <Button 
                onClick={handleProfileUpdate} 
                disabled={isUpdating}
                className="w-full h-12 text-base font-medium"
                style={{
                  background: 'linear-gradient(145deg, rgba(251, 222, 209, 0.6), rgba(251, 222, 209, 0.4))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(251, 222, 209, 0.5)',
                  color: '#9a3412',
                }}
              >
                <Save className="h-5 w-5 mr-2" />
                {isUpdating ? 'Updating Profile...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade to Pro Card */}
        <div className="space-y-6">
          <Card style={{
            background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.15))',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-blue-900">Upgrade to Pro</CardTitle>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">$8</span>
                  <span className="text-blue-700 text-sm">/month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">All Models</p>
                    <p className="text-xs text-blue-700">Claude, GPT, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Generous Limits</p>
                    <p className="text-xs text-blue-700">1500 standard + 100 premium credits</p>
                  </div>
                </div>
              </div>
              <Button 
                className="w-full text-white" 
                size="sm"
                style={{
                  background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.6))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                }}
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card style={{
            background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.1))',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you absolutely sure? This will permanently delete your account.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
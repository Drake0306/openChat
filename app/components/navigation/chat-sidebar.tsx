'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  CreditCard, 
  LogOut, 
  Menu,
  X,
  User,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';
import { getUserConversations, deleteConversation, type ChatConversation } from '../../../lib/chat-actions';

interface ChatSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    plan?: string;
  };
  currentConversationId?: string | null;
}

export default function ChatSidebar({ user, currentConversationId }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/signin' });
  };

  const handleNewChat = () => {
    // Navigate to chat page - this will create a new conversation
    router.push('/chat');
    // Force a refresh to start new conversation
    window.location.href = '/chat';
    setIsOpen(false);
  };

  const handleDeleteChat = async (conversationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (deletingId) return; // Prevent multiple clicks
    
    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If we're deleting the current conversation, redirect to new chat
      if (currentConversationId === conversationId) {
        router.push('/chat');
        window.location.href = '/chat';
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const userConversations = await getUserConversations();
      setConversations(userConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r transform transition-transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">OpenChat</h1>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b">
            <Button 
              onClick={handleNewChat}
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-hidden">
            <div className="p-4 pb-2">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Recent Chats
              </h2>
            </div>
            <ScrollArea className="flex-1 px-2">
              {loadingConversations ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No conversations yet. Start a new chat!
                </div>
              ) : (
                <div className="space-y-1 pb-4">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`
                        group relative rounded-lg p-3 cursor-pointer transition-colors
                        ${currentConversationId === conversation.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      <Link 
                        href={`/chat?id=${conversation.id}`}
                        onClick={() => setIsOpen(false)}
                        className="block"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`
                              text-sm font-medium truncate
                              ${currentConversationId === conversation.id 
                                ? 'text-blue-900' 
                                : 'text-gray-900'
                              }
                            `}>
                              {conversation.title || 'Untitled Chat'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {conversation.provider}
                              </span>
                              {conversation.model && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-500 truncate max-w-20">
                                    {conversation.model}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {formatDate(new Date(conversation.updatedAt))}
                              </span>
                            </div>
                          </div>
                          
                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteChat(conversation.id, e)}
                            disabled={deletingId === conversation.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Navigation Links */}
          <div className="border-t p-4">
            <div className="space-y-1">
              <Link
                href="/subscribe"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${pathname === '/subscribe'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <CreditCard className="mr-3 h-4 w-4" />
                Subscription
              </Link>
            </div>
          </div>

          {/* User Info & Sign Out */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${user.plan === 'PRO' 
                      ? 'bg-purple-100 text-purple-800' 
                      : user.plan === 'BASIC'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}>
                    {user.plan || 'FREE'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
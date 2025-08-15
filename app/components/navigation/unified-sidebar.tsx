'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  MessageSquare, 
  CreditCard, 
  LogOut, 
  User,
  Plus,
  Trash2,
  Clock,
  Crown,
  MoreHorizontal,
  Edit2
} from 'lucide-react';
import { getUserChats, deleteChat, updateChatTitle, type Chat } from '../../../lib/chat-actions';

interface UnifiedSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    plan?: string;
  };
  currentChatId?: string | null;
}

export default function UnifiedSidebar({ user, currentChatId }: UnifiedSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [navigatingToChatId, setNavigatingToChatId] = useState<string | null>(null);
  const [creatingNewChat, setCreatingNewChat] = useState(false);
  const [updatingChats, setUpdatingChats] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');
  const [savingRename, setSavingRename] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/signin' });
  };

  const handleNewChat = () => {
    setCreatingNewChat(true);
    setOpenMobile(false);
    
    // Add timestamp to force fresh route and clear any cached state
    const timestamp = Date.now();
    router.push(`/chat?new=${timestamp}`);
    
    // Clear loading state after navigation
    setTimeout(() => setCreatingNewChat(false), 1500);
  };

  const handleChatClick = (chatId: string, conversationId?: string) => {
    setNavigatingToChatId(chatId);
    setOpenMobile(false);
    
    // Always include the conversation ID if available to prevent creating new chats
    const url = conversationId 
      ? `/chat?id=${chatId}&conversation=${conversationId}`
      : `/chat?id=${chatId}`;
    router.push(url);
    
    // Clear loading state after navigation
    setTimeout(() => setNavigatingToChatId(null), 1000);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (deletingId) return;
    
    setDeletingId(chatId);
    try {
      await deleteChat(chatId);
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartRename = (chatId: string, currentTitle: string) => {
    console.log('Starting rename for chat:', chatId, 'with title:', currentTitle);
    console.log('Is temp chat?', chatId.startsWith('temp-'));
    console.log('Current renamingId before:', renamingId);
    setRenamingId(chatId);
    setNewTitle(currentTitle || 'Untitled Chat');
    console.log('Set renamingId to:', chatId);
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setNewTitle('');
    setSavingRename(false);
  };

  const handleSaveRename = async (chatId: string) => {
    if (!newTitle.trim() || !renamingId || renamingId !== chatId || savingRename) return;
    
    setSavingRename(true);
    try {
      console.log('UI: Starting rename save:', chatId, newTitle.trim());
      await updateChatTitle(chatId, newTitle.trim());
      console.log('UI: Database update completed');
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      ));
      
      setRenamingId(null);
      setNewTitle('');
      console.log('UI: Rename successful, local state updated');
    } catch (error) {
      console.error('UI: Failed to rename chat:', error);
      // Keep the input open on error so user can try again
      alert('Failed to rename chat. Please try again.');
    } finally {
      setSavingRename(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(chatId);
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const loadChats = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoadingChats(true);
      } else {
        setUpdatingChats(true);
      }
      const userChats = await getUserChats();
      setChats(userChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      if (isInitialLoad) {
        setLoadingChats(false);
      } else {
        // Add a minimum delay to show skeleton animation
        setTimeout(() => setUpdatingChats(false), 800);
      }
    }
  };

  useEffect(() => {
    loadChats(true);
  }, []);

  // Removed auto-refresh - using event-driven updates only

  // Listen for chat updates (via custom events)
  useEffect(() => {
    const handleChatCreated = () => {
      // Only refresh for new chat creation
      loadChats();
    };
    
    const handleChatTitleUpdated = (event: Event) => {
      // Update title locally without full refresh
      const customEvent = event as CustomEvent;
      const { chatId, title } = customEvent.detail;
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));
    };

    window.addEventListener('chatCreated', handleChatCreated);
    window.addEventListener('chatTitleUpdated', handleChatTitleUpdated as EventListener);
    
    return () => {
      window.removeEventListener('chatCreated', handleChatCreated);
      window.removeEventListener('chatTitleUpdated', handleChatTitleUpdated as EventListener);
    };
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
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <h1 className="text-lg font-bold text-sidebar-foreground">OpenChat</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full">
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleNewChat}
                  disabled={creatingNewChat}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                >
                  {creatingNewChat ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      New Chat
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/chat' || pathname.startsWith('/chat')}
                >
                  <Link href="/chat" onClick={() => setOpenMobile(false)}>
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/subscribe'}
                >
                  <Link href="/subscribe" onClick={() => setOpenMobile(false)}>
                    <CreditCard className="h-4 w-4" />
                    Subscription
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Chat History */}
        <SidebarGroup className="flex-1 min-h-0 overflow-hidden">
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent className="flex-1 max-w-full min-h-0">
            <ScrollArea className="h-full [&>[data-radix-scroll-area-scrollbar]]:hidden">
              {loadingChats ? (
                <div className="p-4 text-center text-sidebar-foreground/70 text-sm">
                  Loading chats...
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-sidebar-foreground/70 text-sm">
                  No chats yet. Start a new chat!
                </div>
              ) : (
                <div className="relative">
                  <SidebarMenu className="px-2 max-w-full">
                    {chats.map((chat) => {
                    const firstConversation = chat.conversations[0];
                    const isRenaming = renamingId === chat.id;
                    return (
                      <SidebarMenuItem key={chat.id}>
                        <div className="flex items-start w-full group/item relative max-w-full">
                          <SidebarMenuButton
                            asChild
                            isActive={currentChatId === chat.id}
                            className="flex-1"
                          >
                            <button
                              onClick={() => isRenaming ? undefined : handleChatClick(chat.id, firstConversation?.id)}
                              disabled={navigatingToChatId === chat.id}
                              className="flex flex-col items-start w-full text-left px-1.5 py-1.5 hover:bg-sidebar-accent rounded-md transition-colors max-w-full overflow-hidden"
                            >
                              <div className="flex items-center justify-between w-full">
                                {isRenaming ? (
                                  <div className="flex items-center w-full">
                                    <Input
                                      value={newTitle}
                                      onChange={(e) => setNewTitle(e.target.value)}
                                      onKeyDown={(e) => handleKeyDown(e, chat.id)}
                                      onBlur={(e) => {
                                        // Prevent blur from parent button click
                                        if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
                                          handleSaveRename(chat.id);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={savingRename}
                                      className="h-6 px-1 py-0 text-sm font-medium bg-transparent border-none focus:ring-1 focus:ring-blue-500 flex-1"
                                      autoFocus
                                    />
                                    {savingRename && (
                                      <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="truncate font-medium flex-1 mr-2 max-w-[180px]">
                                    {chat.title || 'Untitled Chat'}
                                  </span>
                                )}
                              </div>
                              {!isRenaming && firstConversation && (
                                <div className="flex items-center space-x-2 text-xs text-sidebar-foreground/60 mt-0.5">
                                  <span>{firstConversation.provider}</span>
                                  {firstConversation.model && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-20">
                                        {firstConversation.model}
                                      </span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span>{chat.conversations.length} conversation{chat.conversations.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {!isRenaming && (
                                <div className="flex items-center space-x-1 text-xs text-sidebar-foreground/60 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatDate(new Date(chat.updatedAt))}
                                  </span>
                                </div>
                              )}
                            </button>
                          </SidebarMenuButton>
                          
                          {/* Three dot menu */}
                          <div className="absolute top-2 right-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 hover:bg-gray-100/50"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuContent 
                                  align="start" 
                                  side="left"
                                  sideOffset={8}
                                  avoidCollisions={true}
                                  collisionPadding={20}
                                  className="w-36 bg-white border shadow-lg z-[9999]"
                                >
                              <DropdownMenuItem
                                onClick={() => handleStartRename(chat.id, chat.title || 'Untitled Chat')}
                                disabled={renamingId === chat.id}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteChat(chat.id)}
                                disabled={deletingId === chat.id}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingId === chat.id ? 'Deleting...' : 'Delete'}
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenuPortal>
                            </DropdownMenu>
                          </div>
                        </div>
                      </SidebarMenuItem>
                    );
                    })}
                  </SidebarMenu>
                  
                  {/* Blur overlay with centered spinner when updating chats */}
                  {updatingChats && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center rounded-md">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sidebar-foreground opacity-80"></div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* User Info */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50 mb-2">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {user.email}
            </p>
            <div className="flex items-center mt-1">
              <Badge
                variant={user.plan === 'PRO' ? 'default' : 'secondary'}
                className={`text-xs ${
                  user.plan === 'PRO' 
                    ? 'bg-purple-100 text-purple-800 border-purple-200' 
                    : user.plan === 'BASIC'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {user.plan === 'PRO' && <Crown className="h-3 w-3 mr-1" />}
                {user.plan || 'FREE'}
              </Badge>
            </div>
          </div>
        </div>
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
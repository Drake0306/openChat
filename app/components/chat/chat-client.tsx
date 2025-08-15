'use client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Loader2, RefreshCw, Monitor, Cpu, Zap, Square, Save, Check, ChevronDown, Sparkles, MessageCircle, Lightbulb, Code, HelpCircle, Edit2, ChevronUp, ChevronDown as ScrollDown, Settings, Database, MessageSquare, Brain, Palette } from 'lucide-react';
import MessageRenderer from './message-renderer';
import { useChatPersistence } from '../../hooks/use-chat-persistence';
import type { Chat, ChatConversation } from '../../../lib/chat-actions';
import { updateMessage, deleteMessagesAfter, updateConversationSettings } from '../../../lib/chat-actions';
import { Message } from 'ai/react';

interface ExtendedMessage extends Message {
  model?: string;
  provider?: string;
}

interface ChatClientProps {
  availableProviders: { 
    id: string; 
    name: string; 
    supportsModelSelection?: boolean; 
  }[];
  user?: {
    name?: string | null;
    email?: string | null;
    plan?: string;
  };
  existingChat?: Chat | null;
  chatId?: string;
  conversationId?: string;
  onModelChange?: (model: string, provider: string) => void;
}

interface Model {
  id: string;
  name: string;
  fullId: string;
  ownedBy: string;
}


export default function ChatClient({ 
  availableProviders, 
  user, 
  existingChat,
  chatId: externalChatId,
  conversationId: externalConversationId,
  onModelChange
}: ChatClientProps) {
  // Get current conversation from existing chat
  const currentConversation = existingChat?.conversations.find(c => c.id === externalConversationId) || existingChat?.conversations[0];
  
  // Initialize provider and model from existing conversation or defaults
  const [provider, setProvider] = useState(
    currentConversation?.provider || availableProviders[0]?.id || 'local-llm'
  );
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    currentConversation?.model || undefined
  );
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [showInputAnimation, setShowInputAnimation] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showTopSelector, setShowTopSelector] = useState(false);
  const [selectedModelProvider, setSelectedModelProvider] = useState<string | null>(null);
  const [showModelScreen, setShowModelScreen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSecondDropdownOpen, setIsSecondDropdownOpen] = useState(false);

  // Lazy loading state
  const [visibleMessages, setVisibleMessages] = useState(20); // Show last 20 messages initially
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  
  // Animation state for refresh text
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [showModelInfo, setShowModelInfo] = useState(true);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  // Provider models cache for dropdown
  const [providerModelsCache, setProviderModelsCache] = useState<Record<string, Model[]>>({});
  const [loadingProviderModels, setLoadingProviderModels] = useState<string | null>(null);
  const [refreshingModels, setRefreshingModels] = useState(false);

  const handleProviderClick = async (providerId: string) => {
    setSelectedModelProvider(providerId);
    setShowModelScreen(true);
    
    // Fetch models for this provider if not already cached
    if (!providerModelsCache[providerId]) {
      setLoadingProviderModels(providerId);
      try {
        const response = await fetch(`/api/models?provider=${providerId}`);
        if (response.ok) {
          const data = await response.json();
          setProviderModelsCache(prev => ({
            ...prev,
            [providerId]: data.models || []
          }));
        }
      } catch (error) {
        console.error('Failed to fetch models for provider:', providerId, error);
        setProviderModelsCache(prev => ({
          ...prev,
          [providerId]: []
        }));
      } finally {
        setLoadingProviderModels(null);
      }
    }
  };

  const handleBackToProviders = () => {
    setSelectedModelProvider(null);
    setShowModelScreen(false);
  };


  // Get icon for provider
  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'local-llm':
        return Cpu;
      case 'ollama':
        return Zap;
      case 'anthropic':
        return Brain;
      case 'openai':
        return Settings;
      default:
        return Monitor;
    }
  };

  // Get description for provider
  const getProviderDescription = (providerId: string) => {
    switch (providerId) {
      case 'local-llm':
        return 'Local models via LM Studio';
      case 'ollama':
        return 'Open source models';
      case 'anthropic':
        return 'Claude AI models';
      case 'openai':
        return 'GPT and ChatGPT models';
      default:
        return 'AI model provider';
    }
  };

  // Handle model selection in dropdown
  const handleModelSelect = (modelId: string, providerId: string) => {
    // Trigger fade animations only when actually selecting a different model
    if (selectedModel !== modelId || provider !== providerId) {
      setRefreshingModels(true);
      setLoadingModels(true);
      setShowPoweredBy(false);
      setShowModelInfo(false);
      
      setTimeout(() => {
        setProvider(providerId);
        setSelectedModel(modelId);
        onModelChange?.(modelId, providerId);
        
        setTimeout(() => {
          setRefreshingModels(false);
          setLoadingModels(false);
          setShowPoweredBy(true);
          setShowModelInfo(true);
        }, 300);
      }, 100);
    }
    
    // Add beautiful closing animation
    const dropdownContent = document.querySelector('[role="menu"]') as HTMLElement;
    if (dropdownContent) {
      dropdownContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      dropdownContent.style.transform = 'scale(0.95) translateY(-8px)';
      dropdownContent.style.opacity = '0';
      dropdownContent.style.filter = 'blur(2px)';
    }
    
    // Reset screens and close dropdowns after animation
    setTimeout(() => {
      setSelectedModelProvider(null);
      setShowModelScreen(false);
      setIsDropdownOpen(false);
      setIsSecondDropdownOpen(false);
    }, 400);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Add CSS animations to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .animate-fadeInUp {
        animation: fadeInUp 0.4s ease-out forwards;
      }
      
      .animate-fadeInDown {
        animation: fadeInDown 0.8s ease-out forwards;
      }
      
      .fade-transition {
        transition: all 0.3s ease-in-out;
      }
      
      .animate-slideIn {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Initialize chat with existing messages if available
  const initialMessages = currentConversation?.messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
    // Add model/provider info if available from conversation
    ...(msg.role === 'assistant' && {
      model: currentConversation.model,
      provider: currentConversation.provider
    })
  })) || [];

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages, append } = useChat({
    api: '/api/chat',
    body: { provider, model: selectedModel },
    initialMessages,
  });

  // Get messages to display with lazy loading
  const displayedMessages = messages.slice(-visibleMessages);
  const hasMoreMessages = messages.length > visibleMessages;

  // Load more messages when scrolling to top
  const loadMoreMessages = () => {
    if (isLoadingOlderMessages || !hasMoreMessages) return;
    
    setIsLoadingOlderMessages(true);
    
    // Store current scroll position
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    const currentScrollHeight = scrollElement?.scrollHeight || 0;
    
    // Simulate loading delay (you can remove this in production)
    setTimeout(() => {
      setVisibleMessages(prev => Math.min(prev + 20, messages.length));
      setIsLoadingOlderMessages(false);
      
      // Restore scroll position after loading
      setTimeout(() => {
        if (scrollElement) {
          const newScrollHeight = scrollElement.scrollHeight;
          const scrollDiff = newScrollHeight - currentScrollHeight;
          scrollElement.scrollTop = scrollElement.scrollTop + scrollDiff;
        }
      }, 10);
    }, 300);
  };

  // Refresh models function
  const refreshModels = async () => {
    setIsManualRefresh(true); // Mark as manual refresh
    setRefreshingModels(true);
    setLoadingModels(true);
    setShowPoweredBy(false); // Hide powered by text
    setShowModelInfo(false); // Hide model info text
    
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum 500ms loading time
    
    try {
      // Clear cache
      setAvailableModels([]);
      setProviderModelsCache({});
      
      // Refetch models for current provider
      if (provider) {
        await fetchAvailableModels(provider);
      }
    } catch (error) {
      console.error('Failed to refresh models:', error);
    } finally {
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setRefreshingModels(false);
        setLoadingModels(false);
        // Show powered by text with animation after a brief delay
        setTimeout(() => {
          setShowPoweredBy(true);
          setShowModelInfo(true); // Show both at the same time
          setIsManualRefresh(false); // Reset manual refresh flag
        }, 150);
      }, remainingTime);
    }
  };

  // Reset messages and settings when switching between chats/conversations
  useEffect(() => {
    setLoadingChat(true);
    
    const newMessages = currentConversation?.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    })) || [];
    
    setMessages(newMessages);
    
    // Update provider and model for the current conversation
    if (currentConversation) {
      setProvider(currentConversation.provider);
      if (currentConversation.model) {
        setSelectedModel(currentConversation.model);
      }
    }
    
    // Clear loading state after a brief delay to allow UI to update
    setTimeout(() => setLoadingChat(false), 200);
  }, [externalChatId, externalConversationId, currentConversation, setMessages]);

  // Chat persistence hook - use external IDs if provided
  const { chatId, conversationId, isInitialized } = useChatPersistence({
    messages,
    provider,
    model: selectedModel,
    existingChatId: externalChatId,
    existingConversationId: externalConversationId,
  });

  const scrollToBottom = () => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement && messagesEndRef.current) {
      // Use smooth scroll to the bottom element
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  const scrollToTop = () => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({ 
        top: 0, 
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollThreshold = 100; // Show buttons when 100px from top/bottom
      const loadMoreThreshold = 200; // Load more when 200px from top
      
      // Show scroll to top if user has scrolled down from the top
      setShowScrollToTop(scrollTop > scrollThreshold);
      
      // Show scroll to bottom if user is not near the bottom
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > scrollThreshold);
      
      // Load more messages when scrolling near the top
      if (scrollTop < loadMoreThreshold && hasMoreMessages && !isLoadingOlderMessages) {
        loadMoreMessages();
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Trigger input animation when messages are present
    if (messages.length > 0 && !showInputAnimation) {
      setTimeout(() => setShowInputAnimation(true), 300);
    }
    
    // Reset visible messages when switching conversations or when new messages arrive
    if (messages.length <= 20) {
      setVisibleMessages(messages.length);
    } else if (visibleMessages < 20) {
      setVisibleMessages(20);
    }
  }, [messages, showInputAnimation, visibleMessages]);

  // Set up scroll listener for showing/hiding scroll buttons
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [messages]);

  // Update conversation settings when provider or model changes (for existing conversations with messages)
  useEffect(() => {
    const updateConversationProviderModel = async () => {
      if (conversationId && messages.length > 0 && !isLoading) {
        try {
          await updateConversationSettings(conversationId, provider, selectedModel);
          console.log('Updated conversation settings:', { conversationId, provider, model: selectedModel });
        } catch (error) {
          console.error('Failed to update conversation settings:', error);
        }
      }
    };

    updateConversationProviderModel();
  }, [provider, selectedModel, conversationId, messages.length, isLoading]);

  // Notify parent component of model/provider changes
  useEffect(() => {
    if (selectedModel) {
      onModelChange?.(selectedModel, provider);
    }
  }, [provider, selectedModel, onModelChange]);

  // Fetch available models when provider changes
  useEffect(() => {
    const currentProvider = availableProviders.find(p => p.id === provider);
    if (currentProvider?.supportsModelSelection) {
      fetchAvailableModels(provider);
    } else {
      setAvailableModels([]);
      setSelectedModel(undefined);
    }
  }, [provider, availableProviders]);

  const fetchAvailableModels = async (providerType: string) => {
    if (!providerType) return;
    
    setLoadingModels(true);
    try {
      const response = await fetch(`/api/models?provider=${providerType}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
        // Auto-select first model if none selected
        if (data.models?.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].fullId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      // Trigger animation when first message is sent
      if (messages.length === 0) {
        setShowInputAnimation(true);
      }
      
      if (isLoading) {
        // If currently generating, stop the generation first, then send new message
        stop();
        setTimeout(() => {
          handleSubmit(e);
        }, 100);
      } else {
        handleSubmit(e);
      }
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async () => {
    if (editingMessageId && editingContent.trim()) {
      // Find the index of the message being edited
      const editedMessageIndex = messages.findIndex(msg => msg.id === editingMessageId);
      
      if (editedMessageIndex !== -1) {
        try {
          // Update the message in the database first
          await updateMessage(editingMessageId, editingContent.trim());
          
          // Delete all messages after this one in the database
          if (conversationId) {
            await deleteMessagesAfter(conversationId, editingMessageId);
          }
          
          // Create new messages array with only messages up to and including the edited one
          const messagesUpToEdit = messages.slice(0, editedMessageIndex);
          const editedMessage = { 
            ...messages[editedMessageIndex], 
            content: editingContent.trim() 
          };
          
          // Set the updated messages (removing all subsequent messages)
          const newMessages = [...messagesUpToEdit, editedMessage];
          setMessages(newMessages);
          
          // Reset editing state
          setEditingMessageId(null);
          setEditingContent('');
          
          // Generate new AI response based on the updated conversation
          // We need to wait a bit to ensure the UI state is updated
          setTimeout(() => {
            // Since we already have the updated user message in our array,
            // we can trigger the AI response directly using the existing conversation
            const conversationForAI = newMessages.map(msg => ({
              role: msg.role,
              content: msg.content,
            }));
            
            // Call the chat API with the updated conversation
            fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: conversationForAI,
                provider,
                model: selectedModel,
              }),
            })
            .then(response => {
              if (response.ok && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = '';
                const assistantId = `msg_${Date.now()}`;

                // Add initial assistant message
                (setMessages as any)((prev: Message[]) => [...prev, {
                  id: assistantId,
                  role: 'assistant',
                  content: '',
                  createdAt: new Date(),
                  model: selectedModel,
                  provider: provider,
                }]);

                // Stream the response
                const readStream = async () => {
                  try {
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;

                      const chunk = decoder.decode(value);
                      const lines = chunk.split('\n');

                      for (const line of lines) {
                        if (line.startsWith('data: ')) {
                          const data = line.slice(6);
                          if (data === '[DONE]') continue;
                          
                          try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices?.[0]?.delta?.content) {
                              assistantMessage += parsed.choices[0].delta.content;
                              (setMessages as any)((prev: Message[]) => prev.map((msg: Message) => 
                                msg.id === assistantId 
                                  ? { ...msg, content: assistantMessage }
                                  : msg
                              ));
                            }
                          } catch (e) {
                            // Skip invalid JSON
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Error reading stream:', error);
                  }
                };
                
                readStream();
              }
            })
            .catch(error => {
              console.error('Error generating new response:', error);
            });
          }, 100);
          
        } catch (error) {
          console.error('Error updating message:', error);
          // Reset editing state even if update failed
          setEditingMessageId(null);
          setEditingContent('');
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        // Trigger animation when first message is sent
        if (messages.length === 0) {
          setShowInputAnimation(true);
        }
        
        if (isLoading) {
          // If currently generating, stop the generation first, then send new message
          stop();
          setTimeout(() => {
            handleSubmit(e as any);
          }, 100);
        } else {
          handleSubmit(e as any);
        }
      }
    }
  };

  if (availableProviders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No LLM Providers Available</h3>
              <p className="text-gray-600 mb-4">
                You need to subscribe to a plan to access LLM providers.
              </p>
              <Button asChild>
                <a href="/subscribe">Choose a Plan</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col chat-full-height w-full bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative">
      {/* Loading overlay when switching chats */}
      {loadingChat && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Loading chat...</p>
          </div>
        </div>
      )}
      

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        <ScrollArea ref={scrollAreaRef} className="h-full smooth-scroll-container">
          <div className="max-w-4xl mx-auto p-6 relative">
            {/* Subtle background pattern for active chats */}
            {messages.length > 0 && (
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}></div>
              </div>
            )}
            {messages.length === 0 ? (
              <>
                {/* Central Input for New Chats */}
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                  {/* Hero Section */}
                  <div className="text-center animate-fade-in">
                    <div className="relative mx-auto w-20 h-20 mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-full h-full flex items-center justify-center">
                        <Sparkles className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Welcome to OpenChat
                    </h1>
                    <div className="h-8 flex items-center justify-center mb-2">
                      <p className="text-lg text-gray-600 transition-all duration-300">
                        {refreshingModels || loadingModels ? (
                          <span key="refreshing" className="flex items-center justify-center space-x-2 animate-fadeInUp">
                            <span>Refreshing models</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </span>
                        ) : showPoweredBy ? (
                          <span key={isManualRefresh ? `powered-${Date.now()}` : 'powered-static'} className={isManualRefresh ? "animate-fadeInDown" : ""}>Powered by {availableProviders.find(p => p.id === provider)?.name}</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="h-6 flex items-center justify-center">
                      {selectedModel && showModelInfo && (
                        <p key={isManualRefresh ? `model-${Date.now()}` : 'model-static'} className={`text-sm text-gray-500 transition-all duration-300 ${isManualRefresh ? "animate-fadeInDown" : ""}`}>
                          Using <span className="font-medium bg-gray-100 px-2 py-1 rounded">{availableModels.find(m => m.fullId === selectedModel)?.name || selectedModel}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Central Input Box - Lovable.dev Style */}
                  <div className="w-full max-w-2xl">
                    <form onSubmit={handleFormSubmit} className="relative">
                      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                        {/* Top Controls Bar inside new chat text box */}
                        <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-b border-gray-100">
                          {/* Main Selector */}
                          <div className="flex items-center space-x-3">
                            <DropdownMenu open={isDropdownOpen && !isLoading} onOpenChange={(open) => !isLoading && setIsDropdownOpen(open)}>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-blue-200 hover:border-blue-300 transition-all duration-200"
                                  disabled={isLoading}
                                >
                                  {(() => {
                                    const currentProvider = availableProviders.find(p => p.id === provider);
                                    const IconComponent = getProviderIcon(provider);
                                    return (
                                      <>
                                        {refreshingModels || loadingModels ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <IconComponent className="h-3 w-3" />
                                        )}
                                        <span className="text-sm font-medium">
                                          {currentProvider?.name || 'Models'}
                                        </span>
                                        <ChevronDown className="h-3 w-3" />
                                      </>
                                    );
                                  })()}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                className="w-[700px] max-w-4xl" 
                                align="start"
                                side="bottom"
                                sideOffset={8}
                              >
                                <DropdownMenuLabel className="text-base font-semibold">Select Model Provider</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {!showModelScreen && (
                                  <div className="animate-slideIn">
                                    {/* Model Providers */}
                                    <div className="grid grid-cols-4 gap-3 p-4">
                                      {availableProviders.map((provider, index) => {
                                        const IconComponent = getProviderIcon(provider.id);
                                        const cachedModels = providerModelsCache[provider.id];
                                        const modelCount = cachedModels ? cachedModels.length : '?';
                                        
                                        return (
                                          <div 
                                            key={provider.id}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleProviderClick(provider.id);
                                            }}
                                            className="group flex flex-col items-center space-y-3 p-5 cursor-pointer rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1"
                                            style={{
                                              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                            }}
                                          >
                                            <div className="relative">
                                              <div className="absolute inset-0 bg-blue-100 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                                              <IconComponent className="relative h-10 w-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-300 group-hover:scale-110" />
                                            </div>
                                            <div className="text-center">
                                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{provider.name}</div>
                                              <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-300">{getProviderDescription(provider.id)}</div>
                                              <div className="inline-flex items-center justify-center mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full group-hover:bg-blue-100 transition-colors duration-300">
                                                {modelCount} models
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {showModelScreen && selectedModelProvider && (
                                  <div className="animate-slideIn">
                                    <DropdownMenuSeparator />
                                    <div className="p-6">
                                      {(() => {
                                        const providerData = availableProviders.find(p => p.id === selectedModelProvider);
                                        if (!providerData) return null;
                                        
                                        const IconComponent = getProviderIcon(selectedModelProvider);
                                        const cachedModels = providerModelsCache[selectedModelProvider] || [];
                                        const isLoading = loadingProviderModels === selectedModelProvider;
                                        
                                        return (
                                          <div>
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-6">
                                              <div className="flex items-center space-x-3">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={handleBackToProviders}
                                                  className="p-1 hover:bg-gray-100"
                                                >
                                                  <ChevronDown className="h-4 w-4 rotate-90" />
                                                </Button>
                                                <div className="flex items-center space-x-2">
                                                  <IconComponent className="h-6 w-6 text-blue-600" />
                                                  <div>
                                                    <h3 className="font-semibold text-gray-900">{providerData.name}</h3>
                                                    <p className="text-xs text-gray-500">{getProviderDescription(selectedModelProvider)}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Models List */}
                                            <div className="space-y-4">
                                              <h4 className="text-sm font-medium text-gray-700 mb-4">Available Models</h4>
                                              
                                              {/* Fixed height container to prevent layout shifts */}
                                              <div className="h-60 overflow-y-auto">
                                                {isLoading ? (
                                                  <div className="flex items-center justify-center h-full">
                                                    <div className="flex items-center space-x-2">
                                                      <Loader2 className="h-4 w-4 animate-spin" />
                                                      <span className="text-sm text-gray-500">Loading models...</span>
                                                    </div>
                                                  </div>
                                                ) : cachedModels.length === 0 ? (
                                                  <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                      <div className="text-sm text-gray-500">No models available</div>
                                                      <div className="text-xs text-gray-400 mt-1">
                                                        Make sure {providerData.name} is running and has models loaded
                                                      </div>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="grid grid-cols-4 gap-4 p-2">
                                                  {cachedModels.map((model, index) => {
                                                    const isCurrentModel = selectedModel === model.fullId;
                                                    const IconComponent = getProviderIcon(selectedModelProvider);
                                                    return (
                                                      <div
                                                        key={model.fullId}
                                                        onClick={(e) => {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          
                                                          // Add selection animation to clicked model
                                                          const target = e.currentTarget as HTMLElement;
                                                          target.style.transition = 'all 0.2s ease-out';
                                                          target.style.transform = 'scale(0.95)';
                                                          
                                                          setTimeout(() => {
                                                            target.style.transform = 'scale(1.05)';
                                                            handleModelSelect(model.fullId, selectedModelProvider);
                                                          }, 100);
                                                        }}
                                                        className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out aspect-square transform hover:scale-105 hover:-translate-y-1 ${
                                                          isCurrentModel 
                                                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 shadow-lg shadow-blue-200/50 scale-105' 
                                                            : 'bg-white hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-200/50 border border-gray-200 hover:border-blue-200'
                                                        }`}
                                                        style={{
                                                          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                                                        }}
                                                      >
                                                        <div className="relative mb-3">
                                                          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                                            isCurrentModel ? 'bg-blue-200 scale-100' : 'bg-gray-100 scale-0 group-hover:scale-100'
                                                          }`}></div>
                                                          <IconComponent className={`relative h-10 w-10 transition-all duration-300 group-hover:scale-110 ${
                                                            isCurrentModel ? 'text-blue-700' : 'text-gray-600 group-hover:text-blue-600'
                                                          }`} />
                                                        </div>
                                                        <div className="text-center">
                                                          <div className={`text-xs font-semibold transition-colors duration-300 ${
                                                            isCurrentModel ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-900'
                                                          }`}>
                                                            {model.name.length > 10 ? model.name.substring(0, 10) + '...' : model.name}
                                                          </div>
                                                          <div className={`text-xs mt-1 transition-colors duration-300 ${
                                                            isCurrentModel ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                                                          }`}>
                                                            {model.ownedBy}
                                                          </div>
                                                        </div>
                                                        {isCurrentModel && (
                                                          <div className="absolute top-1 right-1">
                                                            <div className="bg-blue-500 rounded-full p-1 shadow-lg">
                                                              <Check className="h-3 w-3 text-white" />
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* Status Badge for new chat */}
                            <Badge variant="outline" className="bg-white/80 text-xs">
                              New Chat
                            </Badge>
                          </div>
                          
                          {/* Refresh Controls */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={refreshModels}
                              disabled={refreshingModels}
                              className="flex items-center bg-white hover:bg-gray-50 h-7 w-7 p-0"
                            >
                              <RefreshCw className={`h-3 w-3 ${refreshingModels ? 'animate-spin' : ''}`} />
                            </Button>
                            
                            
                          </div>
                        </div>

                        <Textarea
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="What would you like to create or ask about today?"
                          className="chat-textarea w-full min-h-[80px] max-h-48 resize-none border-0 bg-transparent px-6 py-5 text-lg focus:ring-0 focus:outline-none focus:border-transparent focus:shadow-none placeholder:text-gray-400"
                          disabled={false}
                        />
                        
                        {/* Input Actions */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-50">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>Press</span>
                            <kbd className="px-2 py-1 bg-gray-800 text-gray-100 rounded text-xs font-mono border border-gray-600">Enter</kbd>
                            <span>to send</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            
                            <Button 
                              type="submit" 
                              disabled={!input.trim() || (availableModels.length === 0 && provider !== 'local-llm' && provider !== 'ollama')}
                              size="lg"
                              className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                  Stop & Send
                                </>
                              ) : (
                                <>
                                  <Send className="h-5 w-5 mr-2" />
                                  Start Chat
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Central Loading Indicator */}
                      {isLoading && (
                        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500 animate-fade-in">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>AI is thinking...</span>
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                {/* Quick Start Questions - Below Central Input */}
                <div className="text-center py-8 animate-fade-in">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center justify-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Or try one of these prompts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    <button
                      onClick={() => {
                        const syntheticEvent = {
                          target: { value: "What can you help me with today?" }
                        } as React.ChangeEvent<HTMLTextAreaElement>;
                        handleInputChange(syntheticEvent);
                      }}
                      className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <HelpCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Get Help</h3>
                          <p className="text-sm text-gray-500 mt-1">What can you help me with today?</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const syntheticEvent = {
                          target: { value: "Write a simple Python function to calculate fibonacci numbers" }
                        } as React.ChangeEvent<HTMLTextAreaElement>;
                        handleInputChange(syntheticEvent);
                      }}
                      className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <Code className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">Code Help</h3>
                          <p className="text-sm text-gray-500 mt-1">Write a Python fibonacci function</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const syntheticEvent = {
                          target: { value: "Explain the concept of machine learning in simple terms" }
                        } as React.ChangeEvent<HTMLTextAreaElement>;
                        handleInputChange(syntheticEvent);
                      }}
                      className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-yellow-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-yellow-700 transition-colors">Learn</h3>
                          <p className="text-sm text-gray-500 mt-1">Explain machine learning concepts</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const syntheticEvent = {
                          target: { value: "Help me brainstorm ideas for a weekend project" }
                        } as React.ChangeEvent<HTMLTextAreaElement>;
                        handleInputChange(syntheticEvent);
                      }}
                      className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">Brainstorm</h3>
                          <p className="text-sm text-gray-500 mt-1">Ideas for a weekend project</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Status Cards */}
                <div className="space-y-3 max-w-md mx-auto">
                  {conversationId && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-center space-x-2">
                        <Save className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800 font-medium">Auto-Save Active</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Your conversation will be automatically saved
                      </p>
                    </div>
                  )}
                  {provider === 'local-llm' && availableModels.length === 0 && !loadingModels && (
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                      <div className="flex items-center justify-center space-x-2">
                        <Monitor className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-800 font-medium">LM Studio Setup Needed</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        Please start LM Studio and load a model to continue
                      </p>
                    </div>
                  )}
                  {provider === 'ollama' && availableModels.length === 0 && !loadingModels && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-center space-x-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-medium">Ollama Setup Needed</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Start Ollama and download models with <code className="bg-blue-100 px-1 rounded text-xs">ollama pull</code>
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4 pb-4">
                {/* Load More Indicator */}
                {hasMoreMessages && (
                  <div className="flex justify-center py-4">
                    {isLoadingOlderMessages ? (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading older messages...</span>
                      </div>
                    ) : (
                      <button
                        onClick={loadMoreMessages}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        Load {Math.min(20, messages.length - visibleMessages)} more messages
                      </button>
                    )}
                  </div>
                )}
                
                {displayedMessages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`animate-fade-in ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Message Content */}
                    <div className={`
                      max-w-4xl group
                      ${message.role === 'user' ? 'text-right' : 'text-left'}
                    `}>
                      {/* Message Bubble */}
                      <div className={`
                        relative inline-block max-w-[85%] rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md
                        ${message.role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-white border border-gray-100 hover:border-gray-200'
                        }
                      `}>
                        {/* Message Content */}
                        <div className={`
                          ${message.role === 'user' ? 'px-4 py-3' : 'px-5 py-4'}
                        `}>
                          {message.role === 'user' ? (
                            editingMessageId === message.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="text-white bg-blue-700/50 border-blue-400 placeholder:text-blue-200 focus:border-blue-300 min-h-[60px] resize-none"
                                  placeholder="Edit your message..."
                                />
                                <div className="flex items-center space-x-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    className="text-white hover:bg-blue-700/50 h-7 px-2 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    className="bg-white text-blue-600 hover:bg-gray-100 h-7 px-3 text-xs"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-white leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </div>
                            )
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <MessageRenderer content={message.content} />
                            </div>
                          )}
                        </div>
                        
                      </div>
                      
                      {/* Timestamp and Edit Icon */}
                      <div className={`
                        mt-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2
                        ${message.role === 'user' ? 'justify-end' : 'justify-start'}
                      `}>
                        <span>
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'Just now'}
                        </span>
                        {/* Show model info for assistant messages */}
                        {message.role === 'assistant' && ((message as ExtendedMessage).model || (message as ExtendedMessage).provider) && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                              {(message as ExtendedMessage).model ? 
                                availableModels.find(m => m.fullId === (message as ExtendedMessage).model)?.name || (message as ExtendedMessage).model?.split('/').pop() 
                                : availableProviders.find(p => p.id === (message as ExtendedMessage).provider)?.name
                              }
                            </span>
                          </>
                        )}
                        {message.role === 'user' && editingMessageId !== message.id && (
                          <button
                            onClick={() => handleEditMessage(message.id, message.content)}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded hover:bg-gray-100"
                            title="Edit message"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Writing indicator when AI is loading but hasn't started streaming yet */}
                {isLoading && !(messages.length > 0 && messages[messages.length - 1].role === 'assistant') && (
                  <div className="animate-fade-in text-left">
                    <div className="max-w-4xl group">
                      <div className="relative inline-block max-w-[85%] rounded-2xl bg-white border border-gray-100 shadow-sm">
                        <div className="px-5 py-4">
                          <div className="flex items-center space-x-3">
                            <Brain className="h-4 w-4 text-gray-400" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">Writing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Floating Scroll Buttons */}
        {messages.length > 0 && (
          <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-50 flex flex-col space-y-2">
            {/* Scroll to Top Button */}
            <button
              onClick={scrollToTop}
              className={`w-12 h-12 rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-600 shadow-lg hover:shadow-xl hover:bg-white active:scale-95 active:shadow-md group transition-all duration-300 ease-out ${
                showScrollToTop 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
              title="Scroll to top"
            >
              <ChevronUp className="h-5 w-5 mx-auto group-active:scale-90 transition-transform duration-100" />
            </button>
            
            {/* Scroll to Bottom Button */}
            <button
              onClick={scrollToBottom}
              className={`w-12 h-12 rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-600 shadow-lg hover:shadow-xl hover:bg-white active:scale-95 active:shadow-md group transition-all duration-300 ease-out ${
                showScrollToBottom 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
              }`}
              title="Scroll to bottom"
            >
              <ScrollDown className="h-5 w-5 mx-auto group-active:scale-90 transition-transform duration-100" />
            </button>
          </div>
        )}
      </div>


      {/* Input - Only show when there are messages */}
      {messages.length > 0 && (
        <div 
          ref={inputContainerRef}
          className={`bg-white/95 backdrop-blur-sm border-t border-gray-100 px-6 py-5 flex-shrink-0 transition-all duration-500 ease-out transform ${
            showInputAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleFormSubmit}>
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl focus-within:shadow-xl focus-within:border-blue-200">
                {/* Top Controls Bar inside text box */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 border-b border-gray-100">
                  {/* Main Selector */}
                  <div className="flex items-center space-x-3">
                    <DropdownMenu open={isSecondDropdownOpen && !isLoading} onOpenChange={(open) => !isLoading && setIsSecondDropdownOpen(open)}>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline"
                          disabled={isLoading} 
                          size="sm"
                          className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-blue-200 hover:border-blue-300 transition-all duration-200"
                        >
                          {(() => {
                            const currentProvider = availableProviders.find(p => p.id === provider);
                            const IconComponent = getProviderIcon(provider);
                            return (
                              <>
                                {refreshingModels || loadingModels ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <IconComponent className="h-3 w-3" />
                                )}
                                <span className="text-sm font-medium">
                                  {currentProvider?.name || 'Models'}
                                </span>
                                <ChevronUp className="h-3 w-3" />
                              </>
                            );
                          })()}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        className="w-[700px] max-w-4xl" 
                        align="start"
                        side="top"
                        sideOffset={8}
                      >
                        <DropdownMenuLabel className="text-base font-semibold">Select Model Provider</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {!showModelScreen && (
                          <div className="animate-slideIn">
                            {/* Model Providers */}
                            <div className="grid grid-cols-4 gap-3 p-4">
                              {availableProviders.map((provider, index) => {
                                const IconComponent = getProviderIcon(provider.id);
                                const cachedModels = providerModelsCache[provider.id];
                                const modelCount = cachedModels ? cachedModels.length : '?';
                                
                                return (
                                  <div 
                                    key={provider.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleProviderClick(provider.id);
                                    }}
                                    className="group flex flex-col items-center space-y-3 p-5 cursor-pointer rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1"
                                    style={{
                                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                    }}
                                  >
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-blue-100 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                                      <IconComponent className="relative h-10 w-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-300 group-hover:scale-110" />
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{provider.name}</div>
                                      <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-300">{getProviderDescription(provider.id)}</div>
                                      <div className="inline-flex items-center justify-center mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full group-hover:bg-blue-100 transition-colors duration-300">
                                        {modelCount} models
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {showModelScreen && selectedModelProvider && (
                          <div className="animate-slideIn">
                            <DropdownMenuSeparator />
                            <div className="p-6">
                              {(() => {
                                const providerData = availableProviders.find(p => p.id === selectedModelProvider);
                                if (!providerData) return null;
                                
                                const IconComponent = getProviderIcon(selectedModelProvider);
                                const cachedModels = providerModelsCache[selectedModelProvider] || [];
                                const isLoading = loadingProviderModels === selectedModelProvider;
                                
                                return (
                                  <div>
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                      <div className="flex items-center space-x-3">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={handleBackToProviders}
                                          className="p-1 hover:bg-gray-100"
                                        >
                                          <ChevronDown className="h-4 w-4 rotate-90" />
                                        </Button>
                                        <div className="flex items-center space-x-2">
                                          <IconComponent className="h-6 w-6 text-blue-600" />
                                          <div>
                                            <h3 className="font-semibold text-gray-900">{providerData.name}</h3>
                                            <p className="text-xs text-gray-500">{getProviderDescription(selectedModelProvider)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Models List */}
                                    <div className="space-y-4">
                                      <h4 className="text-sm font-medium text-gray-700 mb-4">Available Models</h4>
                                      
                                      {/* Fixed height container to prevent layout shifts */}
                                      <div className="h-60 overflow-y-auto">
                                        {isLoading ? (
                                          <div className="flex items-center justify-center h-full">
                                            <div className="flex items-center space-x-2">
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              <span className="text-sm text-gray-500">Loading models...</span>
                                            </div>
                                          </div>
                                        ) : cachedModels.length === 0 ? (
                                          <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                              <div className="text-sm text-gray-500">No models available</div>
                                              <div className="text-xs text-gray-400 mt-1">
                                                Make sure {providerData.name} is running and has models loaded
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-4 gap-4 p-2">
                                          {cachedModels.map((model, index) => {
                                            const isCurrentModel = selectedModel === model.fullId;
                                            const IconComponent = getProviderIcon(selectedModelProvider);
                                            return (
                                              <div
                                                key={model.fullId}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  
                                                  // Add selection animation to clicked model
                                                  const target = e.currentTarget as HTMLElement;
                                                  target.style.transition = 'all 0.2s ease-out';
                                                  target.style.transform = 'scale(0.95)';
                                                  
                                                  setTimeout(() => {
                                                    target.style.transform = 'scale(1.05)';
                                                    handleModelSelect(model.fullId, selectedModelProvider);
                                                  }, 100);
                                                }}
                                                className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out aspect-square transform hover:scale-105 hover:-translate-y-1 ${
                                                  isCurrentModel 
                                                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 shadow-lg shadow-blue-200/50 scale-105' 
                                                    : 'bg-white hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-200/50 border border-gray-200 hover:border-blue-200'
                                                }`}
                                                style={{
                                                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                                                }}
                                              >
                                                <div className="relative mb-3">
                                                  <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                                    isCurrentModel ? 'bg-blue-200 scale-100' : 'bg-gray-100 scale-0 group-hover:scale-100'
                                                  }`}></div>
                                                  <IconComponent className={`relative h-10 w-10 transition-all duration-300 group-hover:scale-110 ${
                                                    isCurrentModel ? 'text-blue-700' : 'text-gray-600 group-hover:text-blue-600'
                                                  }`} />
                                                </div>
                                                <div className="text-center">
                                                  <div className={`text-xs font-semibold transition-colors duration-300 ${
                                                    isCurrentModel ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-900'
                                                  }`}>
                                                    {model.name.length > 10 ? model.name.substring(0, 10) + '...' : model.name}
                                                  </div>
                                                  <div className={`text-xs mt-1 transition-colors duration-300 ${
                                                    isCurrentModel ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                                                  }`}>
                                                    {model.ownedBy}
                                                  </div>
                                                </div>
                                                {isCurrentModel && (
                                                  <div className="absolute top-1 right-1">
                                                    <div className="bg-blue-500 rounded-full p-1 shadow-lg">
                                                      <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Status Badge */}
                    <Badge variant="outline" className="bg-white/80 text-xs">
                      {messages.length} msg{messages.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {/* Refresh Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshModels}
                      disabled={refreshingModels}
                      className="flex items-center bg-white hover:bg-gray-50 h-7 w-7 p-0"
                    >
                      <RefreshCw className={`h-3 w-3 ${refreshingModels ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    {selectedModel && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium text-xs px-2 py-1">
                        {selectedModel}
                      </Badge>
                    )}
                    
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={isLoading 
                        ? "AI is generating response... Type new message to interrupt" 
                        : "Continue the conversation..."
                      }
                      className="chat-textarea w-full min-h-[60px] max-h-32 resize-none border-0 bg-transparent px-5 py-4 text-base placeholder:text-gray-400 focus:ring-0 focus:outline-none focus:border-transparent focus:shadow-none"
                      disabled={false}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 px-4 py-4">
                    <Button 
                      type="submit" 
                      disabled={!input.trim()}
                      size="sm"
                      className={`h-10 px-4 transition-all duration-200 ${
                        isLoading 
                          ? "bg-orange-500 hover:bg-orange-600 animate-pulse" 
                          : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          <span className="hidden sm:inline">Stop & Send</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Bottom Bar */}
                {(isLoading || input.trim()) && (
                  <div className="px-5 py-2 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {isLoading ? (
                        <>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span>AI is typing...</span>
                        </>
                      ) : (
                        <>
                          <span>Press</span>
                          <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-100 rounded text-xs font-mono border border-gray-600">Enter</kbd>
                          <span>to send</span>
                        </>
                      )}
                    </div>
                    
                    {conversationId && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Auto-saving</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

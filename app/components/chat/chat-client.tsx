'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Loader2, RefreshCw, Monitor, Cpu, Zap, Square, Save, Check, MessageSquarePlus, ChevronDown, Sparkles, MessageCircle, Lightbulb, Code, HelpCircle } from 'lucide-react';
import MessageRenderer from './message-renderer';
import { useChatPersistence } from '../../hooks/use-chat-persistence';
import type { Chat, ChatConversation } from '../../../lib/chat-actions';
import { createNewConversationInChat } from '../../../lib/chat-actions';

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
  conversationId: externalConversationId 
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
  const [creatingNewConversation, setCreatingNewConversation] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [showInputAnimation, setShowInputAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize chat with existing messages if available
  const initialMessages = currentConversation?.messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  })) || [];

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } = useChat({
    api: '/api/chat',
    body: { provider, model: selectedModel },
    initialMessages,
  });

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Trigger input animation when messages are present
    if (messages.length > 0 && !showInputAnimation) {
      setTimeout(() => setShowInputAnimation(true), 300);
    }
  }, [messages, showInputAnimation]);

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

  const refreshModels = () => {
    if (provider) {
      fetchAvailableModels(provider);
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

  const handleNewConversation = async () => {
    if (!chatId || creatingNewConversation) return;
    
    setCreatingNewConversation(true);
    try {
      const newConversationId = await createNewConversationInChat(chatId, provider, selectedModel);
      // Navigate to the new conversation
      window.location.href = `/chat?id=${chatId}&conversation=${newConversationId}`;
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    } finally {
      setCreatingNewConversation(false);
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
      
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {existingChat?.title || 'Chat'}
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    Chatting with {availableProviders.find(p => p.id === provider)?.name}
                  </p>
                  {selectedModel && (
                    <>
                      <span className="text-gray-300">•</span>
                      <Badge variant="outline" className="text-xs">
                        {availableModels.find(m => m.fullId === selectedModel)?.name || selectedModel}
                      </Badge>
                    </>
                  )}
                  {conversationId && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        <span>Auto-saving</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Conversation Management */}
              {existingChat && existingChat.conversations.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Select 
                    value={externalConversationId || currentConversation?.id || ''} 
                    onValueChange={(value) => {
                      if (value) {
                        window.location.href = `/chat?id=${chatId}&conversation=${value}`;
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select conversation" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingChat.conversations.map((conv, index) => (
                        <SelectItem key={conv.id} value={conv.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">Conversation {index + 1}</span>
                            <span className="text-xs text-gray-500">
                              {conv.provider} • {conv.messages.length} messages
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewConversation}
                    disabled={creatingNewConversation}
                    className="flex items-center space-x-1"
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Conversation</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center space-x-2">
                      {p.id === 'local-llm' && <Cpu className="h-4 w-4" />}
                      {p.id === 'ollama' && <Zap className="h-4 w-4" />}
                      <span>{p.name}</span>
                      {p.supportsModelSelection && (
                        <Badge variant="secondary" className="text-xs">
                          Models
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {availableProviders.find(p => p.id === provider)?.supportsModelSelection && (
              <>
                <Select 
                  value={selectedModel} 
                  onValueChange={setSelectedModel}
                  disabled={loadingModels || availableModels.length === 0}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue 
                      placeholder={loadingModels ? "Loading..." : "Select model"} 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.fullId} value={model.fullId}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-gray-500">{model.ownedBy}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshModels}
                  disabled={loadingModels}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingModels ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        <ScrollArea className="h-full">
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
                    <p className="text-lg text-gray-600 mb-2">
                      Powered by {availableProviders.find(p => p.id === provider)?.name}
                    </p>
                    {selectedModel && (
                      <p className="text-sm text-gray-500">
                        Using <span className="font-medium bg-gray-100 px-2 py-1 rounded">{availableModels.find(m => m.fullId === selectedModel)?.name || selectedModel}</span>
                      </p>
                    )}
                  </div>

                  {/* Central Input Box - Lovable.dev Style */}
                  <div className="w-full max-w-2xl">
                    <form onSubmit={handleFormSubmit} className="relative">
                      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
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
                            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Enter</kbd>
                            <span>to send</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isLoading && (
                              <Button 
                                type="button"
                                onClick={handleStop}
                                variant="outline" 
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              >
                                <Square className="h-4 w-4" />
                                <span className="ml-1">Stop</span>
                              </Button>
                            )}
                            
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
                          <span>AI is thinking... Click Stop to interrupt</span>
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
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-4 animate-fade-in ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Avatar */}
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200
                      ${message.role === 'user' 
                        ? 'bg-blue-600 text-white shadow-blue-100' 
                        : 'bg-gray-100 text-gray-600 shadow-gray-100'
                      }
                    `}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`
                      flex-1 max-w-4xl group
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
                            <div className="text-white leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <MessageRenderer content={message.content} />
                            </div>
                          )}
                        </div>
                        
                        {/* Message Tail */}
                        <div className={`
                          absolute top-4 w-3 h-3 transform rotate-45
                          ${message.role === 'user'
                            ? 'bg-blue-600 -right-1'
                            : 'bg-white border-r border-b border-gray-100 -left-1'
                          }
                        `} />
                      </div>
                      
                      {/* Timestamp */}
                      <div className={`
                        mt-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        ${message.role === 'user' ? 'text-right mr-2' : 'text-left ml-2'}
                      `}>
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'Just now'}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-4 animate-fade-in">
                    {/* AI Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 text-gray-600 shadow-sm flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    
                    {/* Loading Bubble */}
                    <div className="flex-1 max-w-4xl">
                      <div className="relative inline-block max-w-[85%] rounded-2xl bg-white border border-gray-100 shadow-sm">
                        <div className="px-5 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium">
                                {availableProviders.find(p => p.id === provider)?.name} is thinking...
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleStop}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 ml-4"
                            >
                              <Square className="w-3 h-3" />
                              <span className="ml-1 text-xs">Stop</span>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Loading Bubble Tail */}
                        <div className="absolute top-4 w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-45 -left-1" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
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
                    {isLoading && (
                      <Button 
                        type="button"
                        onClick={handleStop}
                        variant="outline" 
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10 px-3"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Stop</span>
                      </Button>
                    )}
                    
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
                          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Enter</kbd>
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

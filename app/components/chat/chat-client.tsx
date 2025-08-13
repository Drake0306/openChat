'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Loader2, RefreshCw, Monitor, Cpu, Zap, Square, Save, Check } from 'lucide-react';
import MessageRenderer from './message-renderer';
import { useChatPersistence } from '../../hooks/use-chat-persistence';
import type { ChatConversation } from '../../../lib/chat-actions';

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
  existingConversation?: ChatConversation | null;
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
  existingConversation,
  conversationId: externalConversationId 
}: ChatClientProps) {
  // Initialize provider and model from existing conversation or defaults
  const [provider, setProvider] = useState(
    existingConversation?.provider || availableProviders[0]?.id || 'local-llm'
  );
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    existingConversation?.model || undefined
  );
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize chat with existing messages if available
  const initialMessages = existingConversation?.messages.map(msg => ({
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

  // Chat persistence hook - use external conversation ID if provided
  const { conversationId, isInitialized } = useChatPersistence({
    messages,
    provider,
    model: selectedModel,
    existingConversationId: externalConversationId,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
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
      handleFormSubmit(e);
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
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
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <div className="text-gray-500">
                  <p className="mb-1">
                    Ask me anything! I'm powered by {availableProviders.find(p => p.id === provider)?.name}.
                  </p>
                  {selectedModel && (
                    <p className="text-sm">
                      Using model: <span className="font-medium">{availableModels.find(m => m.fullId === selectedModel)?.name || selectedModel}</span>
                    </p>
                  )}
                  {conversationId && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-2">
                        <Save className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800 font-medium">Chat Auto-Save Active</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Your conversation will be automatically saved as you chat.
                      </p>
                    </div>
                  )}
                  {provider === 'local-llm' && availableModels.length === 0 && !loadingModels && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-800 font-medium">LM Studio Status</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        No models found. Please start LM Studio and load a model to continue.
                      </p>
                    </div>
                  )}
                  {provider === 'ollama' && availableModels.length === 0 && !loadingModels && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-medium">Ollama Status</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        No models found. Please start Ollama and download models using <code className="bg-blue-100 px-1 rounded">ollama pull</code> command.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className={`
                      flex-1 max-w-3xl rounded-lg overflow-hidden
                      ${message.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : 'bg-white border border-gray-200'
                      }
                    `}>
                      {message.role === 'user' ? (
                        <div className="p-3 text-sm whitespace-pre-wrap text-white">
                          {message.content}
                        </div>
                      ) : (
                        <div className="p-3">
                          <MessageRenderer content={message.content} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 max-w-3xl p-3 rounded-lg bg-white border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-500">
                            {availableProviders.find(p => p.id === provider)?.name} is thinking...
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStop}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 px-2"
                        >
                          <Square className="w-3 h-3" />
                        </Button>
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

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isLoading 
                  ? "AI is generating response... Type new message to interrupt or click Stop" 
                  : "Type your message... (Press Enter to send, Shift+Enter for new line)"
                }
                className="min-h-[60px] max-h-32 resize-none"
                disabled={false} // Always allow typing
              />
            </div>
            
            {/* Stop Button - Only show when generating */}
            {isLoading && (
              <Button 
                type="button"
                onClick={handleStop}
                variant="outline" 
                size="lg"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Square className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Stop</span>
              </Button>
            )}
            
            {/* Send Button */}
            <Button 
              type="submit" 
              disabled={!input.trim()}
              size="lg"
              className={isLoading ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 hidden sm:inline">Interrupt</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Send</span>
                </>
              )}
            </Button>
          </div>
          
          {/* Status indicator */}
          {isLoading && (
            <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>AI is thinking... Click Stop to interrupt or type a new message</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

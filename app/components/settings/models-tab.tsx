'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Cpu,
  Brain,
  Sparkles,
  Database,
  Search,
  X,
  Zap,
  Crown,
  Palette,
  MessageSquare,
  Settings as SettingsIcon
} from 'lucide-react';
import { GeminiIcon } from '@/app/components/icons/gemini-icon';
import { GptIcon } from '@/app/components/icons/gpt-icon';
import { ClaudeIcon } from '@/app/components/icons/claude-icon';
import { DeepSeekIcon } from '@/app/components/icons/deepseek-icon';
import { LlamaIcon } from '@/app/components/icons/llama-icon';
import { GrokIcon } from '@/app/components/icons/grok-icon';
import { QwenIcon } from '@/app/components/icons/qwen-icon';
import { KimiIcon } from '@/app/components/icons/kimi-icon';
import { GlmIcon } from '@/app/components/icons/glm-icon';

// Icon mapping for database icons
const iconMapping = {
  'cpu': Cpu,
  'zap': Zap,
  'sparkles': Sparkles,
  'brain': Brain,
  'crown': Crown,
  'palette': Palette,
  'message-square': MessageSquare,
  'database': Database,
  'gemini': GeminiIcon,
  'gpt': GptIcon,
  'claude': ClaudeIcon,
  'deepseek': DeepSeekIcon,
  'llama': LlamaIcon,
  'grok': GrokIcon,
  'qwen': QwenIcon,
  'kimi': KimiIcon,
  'glm': GlmIcon
};

export function ModelsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [enabledModals, setEnabledModals] = useState<Record<string, boolean>>({});
  const [availableModals, setAvailableModals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');

  // Load modal settings and data from database
  useEffect(() => {
    const loadModalSettings = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch('/api/user/modals', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          // Process modals to add React components for icons
          const processedModals = data.modals.map((modal: any) => ({
            ...modal,
            icon: iconMapping[modal.icon as keyof typeof iconMapping] || Brain
          }));
          
          setAvailableModals(processedModals);
          
          // Set enabled state for each modal
          const enabledState: Record<string, boolean> = {};
          processedModals.forEach((modal: any) => {
            enabledState[modal.id] = modal.enabled;
          });
          setEnabledModals(enabledState);
        } else {
          console.error('Failed to load modal settings:', response.status, response.statusText);
          toast.error('Failed to load model settings');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('Request was cancelled due to timeout');
          toast.error('Request timeout while loading models');
        } else {
          console.error('Failed to load modal settings:', error);
          toast.error('Failed to load model settings');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadModalSettings();
  }, []);

  const handleModalToggle = async (modalId: string) => {
    const newEnabledState = !enabledModals[modalId];
    const modalName = availableModals.find(modal => modal.id === modalId)?.name || modalId;
    
    // Optimistic update
    setEnabledModals(prev => ({
      ...prev,
      [modalId]: newEnabledState
    }));
    
    try {
      // Save to database with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for saves
      
      const response = await fetch('/api/user/modals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modalId,
          enabled: newEnabledState
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Revert optimistic update on error
        setEnabledModals(prev => ({
          ...prev,
          [modalId]: !newEnabledState
        }));
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to turn ${newEnabledState ? 'ON' : 'OFF'} ${modalName}`, {
          description: errorData.error || 'Please try again later',
          duration: 4000
        });
        console.error('Failed to save modal setting:', response.status, response.statusText);
        return;
      }

      // Success toast
      toast.success(`${modalName} turned ${newEnabledState ? 'ON' : 'OFF'}`, {
        description: `Model is now ${newEnabledState ? 'enabled and will appear in the chat interface' : 'disabled and hidden from the chat interface'}`,
        duration: 3000
      });

      // Emit event to update chat section visibility
      window.dispatchEvent(new CustomEvent('modalToggled', {
        detail: { modalId, enabled: newEnabledState }
      }));

      // Also emit event to refresh available providers in chat
      window.dispatchEvent(new CustomEvent('providersUpdated'));
    } catch (error) {
      // Revert optimistic update on error
      setEnabledModals(prev => ({
        ...prev,
        [modalId]: !newEnabledState
      }));
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error(`Request timeout for ${modalName}`, {
          description: 'The request took too long. Please try again.',
          duration: 4000
        });
        console.error('Save request was cancelled due to timeout');
      } else {
        toast.error(`Failed to turn ${newEnabledState ? 'ON' : 'OFF'} ${modalName}`, {
          description: 'An unexpected error occurred. Please try again.',
          duration: 4000
        });
        console.error('Error saving modal setting:', error);
      }
    }
  };

  const getColorClasses = (color: string, enabled: boolean) => {
    const colors = {
      purple: enabled 
        ? 'bg-purple-100 border-purple-300 text-purple-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      blue: enabled 
        ? 'bg-blue-100 border-blue-300 text-blue-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      green: enabled 
        ? 'bg-green-100 border-green-300 text-green-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      orange: enabled 
        ? 'bg-orange-100 border-orange-300 text-orange-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      indigo: enabled 
        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      red: enabled 
        ? 'bg-red-100 border-red-300 text-red-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      yellow: enabled 
        ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      pink: enabled 
        ? 'bg-pink-100 border-pink-300 text-pink-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
      teal: enabled 
        ? 'bg-teal-100 border-teal-300 text-teal-700'
        : 'bg-gray-50 border-gray-200 text-gray-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Add uncheck all functionality
  const handleUncheckAll = async () => {
    const enabledModalIds = Object.keys(enabledModals).filter(id => enabledModals[id]);
    
    if (enabledModalIds.length === 0) {
      toast.info('All models are already disabled');
      return;
    }

    // Optimistic update
    const newEnabledState: Record<string, boolean> = {};
    Object.keys(enabledModals).forEach(id => {
      newEnabledState[id] = false;
    });
    setEnabledModals(newEnabledState);

    try {
      // Disable all enabled models
      const promises = enabledModalIds.map(async (modalId) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/user/modals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modalId,
            enabled: false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
      });

      const results = await Promise.allSettled(promises);
      const failed = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.ok)
      );

      if (failed.length === 0) {
        toast.success(`All ${enabledModalIds.length} models disabled successfully`);
        // Emit events to update chat interface
        window.dispatchEvent(new CustomEvent('providersUpdated'));
        enabledModalIds.forEach(modalId => {
          window.dispatchEvent(new CustomEvent('modalToggled', {
            detail: { modalId, enabled: false }
          }));
        });
      } else {
        // Revert changes for failed requests
        setEnabledModals(enabledModals);
        toast.error(`Failed to disable ${failed.length} models. Please try again.`);
      }
    } catch (error) {
      // Revert all changes on error
      setEnabledModals(enabledModals);
      toast.error('Failed to disable models. Please try again.');
      console.error('Error disabling all models:', error);
    }
  };

  // Filter modals based on search query and enabled status
  const filteredModals = availableModals.filter(modal => {
    const matchesSearch = modal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      modal.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterEnabled === 'all' || 
      (filterEnabled === 'enabled' && enabledModals[modal.id]) ||
      (filterEnabled === 'disabled' && !enabledModals[modal.id]);
    
    return matchesSearch && matchesFilter;
  });

  const renderModelItem = (modal: any) => {
    const IconComponent = modal.icon;
    const isEnabled = enabledModals[modal.id];
    const isLocalModel = modal.isLocal;
    
    return (
      <div 
        key={modal.id} 
        className={`p-5 rounded-lg border transition-all duration-200 hover:shadow-md ${
          isEnabled 
            ? 'bg-white border-gray-200 hover:border-gray-300' 
            : 'bg-gray-50 border-gray-100'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className={`p-2 rounded-lg border flex-shrink-0 ${getColorClasses(modal.color, isEnabled)}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className={`font-semibold ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                  {modal.name}
                </h4>
                {isLocalModel && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 font-medium">
                    <Cpu className="h-3 w-3 mr-1" />
                    Local
                  </Badge>
                )}
              </div>
              <div className={`mt-2 ${isEnabled ? 'text-gray-700' : 'text-gray-500'}`}>
                <p className="text-sm leading-relaxed">
                  {modal.description || 'No description available'}
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant={isEnabled ? "default" : "secondary"}
            size="sm"
            onClick={() => handleModalToggle(modal.id)}
            className={`relative min-w-16 h-8 transition-all duration-300 flex-shrink-0 ml-6 ${
              isEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            <span className="font-medium text-xs">
              {isEnabled ? 'ON' : 'OFF'}
            </span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h3 className="text-lg font-semibold mb-2">Available Models</h3>
        <p className="text-gray-600 text-sm mb-4">Toggle models on or off to control their visibility in the chat section. Settings are automatically saved to your account.</p>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search models by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">Filter:</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setFilterEnabled('all')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  filterEnabled === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterEnabled('enabled')}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-gray-200 ${
                  filterEnabled === 'enabled'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Enabled
              </button>
              <button
                onClick={() => setFilterEnabled('disabled')}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-gray-200 ${
                  filterEnabled === 'disabled'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Disabled
              </button>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleUncheckAll}
            className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            disabled={isLoading || Object.values(enabledModals).every(enabled => !enabled)}
          >
            <X className="h-3 w-3 mr-1" />
            Uncheck All
          </Button>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {searchQuery || filterEnabled !== 'all' ? (
              <>Showing {filteredModals.length} of {availableModals.length} models</>
            ) : (
              <>{availableModals.length} models total</>
            )}
          </p>
          {(searchQuery || filterEnabled !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterEnabled('all');
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-0">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">Loading your settings...</h4>
            <p className="text-gray-500">Fetching your model preferences</p>
          </div>
        ) : filteredModals.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">No models found</h4>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                clear your search
              </button>
            </p>
          </div>
        ) : (
          filteredModals.map(renderModelItem)
        )}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex-shrink-0">
        <div className="flex items-start space-x-2">
          <SettingsIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Model Availability</h4>
            <p className="text-sm text-blue-700">
              Disabled models will not appear in the chat interface, and the system will not attempt to auto-select them. 
              Changes take effect immediately in new chat sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
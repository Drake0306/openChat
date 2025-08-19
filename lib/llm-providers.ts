import OpenAI from 'openai';
import { auth } from './auth';
import { db } from './db';

export const providers = {
    'local-llm': {
        name: 'LM Studio',
        enabledFor: ['BASIC', 'PRO'],
        supportsModelSelection: true,
    },
    'ollama': {
        name: 'Ollama',
        enabledFor: ['BASIC', 'PRO'],
        supportsModelSelection: true,
    },
    'openai': {
        name: 'OpenAI',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'anthropic': {
        name: 'Anthropic',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'google': {
        name: 'Google',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'deepseek': {
        name: 'DeepSeek',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'meta': {
        name: 'Meta',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'xai': {
        name: 'xAI',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'qwen': {
        name: 'Qwen',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'moonshot': {
        name: 'Moonshot',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
    'glm': {
        name: 'GLM',
        enabledFor: ['PRO'],
        supportsModelSelection: false,
    },
};

export async function getEnabledModelsFromSettings(userId?: string) {
    if (!userId) {
        const session = await auth();
        if (!session?.user?.id) return [];
        userId = session.user.id;
    }

    try {
        // Get all enabled models for the user from settings
        const enabledModals = await db.modalSetting.findMany({
            where: {
                userId: userId,
                enabled: true,
            },
            include: {
                modal: true
            }
        });

        // If no settings found, get default enabled modals
        if (enabledModals.length === 0) {
            const defaultModals = await db.modal.findMany({
                where: {
                    enabled: true
                }
            });
            return defaultModals;
        }

        return enabledModals.map(setting => setting.modal);
    } catch (error) {
        console.error('Error fetching enabled models from settings:', error);
        return [];
    }
}

export function getAvailableProviders(plan: string) {
    return Object.entries(providers)
        .filter(([_, provider]) => {
            return provider.enabledFor && provider.enabledFor.includes(plan);
        })
        .map(([id, provider]) => ({ 
            id, 
            name: provider.name,
            supportsModelSelection: provider.supportsModelSelection || false
        }));
}

export async function getAvailableProvidersWithEnabledModels(plan: string, userId?: string) {
    const allProviders = getAvailableProviders(plan);
    const enabledModels = await getEnabledModelsFromSettings(userId);
    
    // Group enabled models by category
    const modelsByCategory = enabledModels.reduce((acc: Record<string, any[]>, model) => {
        if (!acc[model.category]) {
            acc[model.category] = [];
        }
        acc[model.category].push(model);
        return acc;
    }, {});


    // Map providers to include their enabled models
    const providersWithModels = allProviders.map(provider => {
        let models: any[] = [];
        let hasEnabledModels = false;

        // Special handling for LM Studio and Ollama (keep original behavior)
        if (provider.id === 'local-llm' || provider.id === 'ollama') {
            // Both LM Studio and Ollama use "Local" category in database
            // They share the same local models but are different interfaces
            const categoryModels = modelsByCategory['Local'] || [];
            hasEnabledModels = categoryModels.length > 0;
            models = categoryModels;
        } else {
            // For other providers, check if they have enabled models by provider name
            // Special mapping: provider ID to database category
            let categoryName = provider.name;
            if (provider.id === 'google') categoryName = 'Google';
            if (provider.id === 'deepseek') categoryName = 'DeepSeek';
            if (provider.id === 'meta') categoryName = 'Meta';
            if (provider.id === 'xai') categoryName = 'xAI';
            if (provider.id === 'qwen') categoryName = 'Qwen';
            if (provider.id === 'moonshot') categoryName = 'Moonshot';
            if (provider.id === 'glm') categoryName = 'GLM';
            
            const categoryModels = modelsByCategory[categoryName] || [];
            hasEnabledModels = categoryModels.length > 0;
            models = categoryModels;
        }

        return {
            ...provider,
            hasEnabledModels,
            enabledModels: models,
            // For non-LM Studio/Ollama providers, they can be directly selected
            directSelect: provider.id !== 'local-llm' && provider.id !== 'ollama'
        };
    }).filter(provider => provider.hasEnabledModels); // Only return providers with enabled models

    return providersWithModels;
}

// LM Studio Model Interface
interface LMStudioModel {
    id: string;
    object: string;
    owned_by: string;
    permission?: any[];
}

// Ollama Model Interface
interface OllamaModel {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        parent_model: string;
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

// Get available models from LM Studio
export async function getLMStudioModels(): Promise<LMStudioModel[]> {
    const port = process.env.LM_STUDIO_PORT || '1234';
    const baseUrl = process.env.LOCAL_LLM_ENDPOINT?.replace('/chat/completions', '') || `http://localhost:${port}/v1`;
    
    try {
        const response = await fetch(`${baseUrl}/models`, {
            headers: {
                'Authorization': 'Bearer lm-studio',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching LM Studio models:', error);
        return [];
    }
}

// Get available models from Ollama
export async function getOllamaModels(): Promise<OllamaModel[]> {
    const port = process.env.OLLAMA_PORT || '11434';
    const baseUrl = process.env.OLLAMA_ENDPOINT || `http://localhost:${port}`;
    
    try {
        const response = await fetch(`${baseUrl}/api/tags`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Ollama models: ${response.statusText}`);
        }

        const data = await response.json();
        return data.models || [];
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return [];
    }
}

// OpenAI LLM Service
export async function callOpenAI(messages: any[]) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        stream: true,
    });

    return response;
}

// Anthropic LLM Service
export async function callAnthropic(messages: any[]) {
    // Note: This would require the Anthropic SDK
    // For now, we'll create a mock response that mimics streaming
    const lastMessage = messages[messages.length - 1];
    const response = `Anthropic response to: ${lastMessage.content}`;
    
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(response));
            controller.close();
        },
    });

    return { stream };
}

// LM Studio Local LLM Service
export async function callLocalLLM(messages: any[], selectedModel?: string) {
    const port = process.env.LM_STUDIO_PORT || '1234';
    const baseUrl = process.env.LOCAL_LLM_ENDPOINT?.replace('/chat/completions', '') || `http://localhost:${port}/v1`;
    
    try {
        // Create OpenAI client configured for LM Studio
        const lmStudio = new OpenAI({
            baseURL: baseUrl,
            apiKey: 'lm-studio', // LM Studio expects this specific API key
        });

        // Get available models if no model is selected
        let modelToUse = selectedModel;
        if (!modelToUse) {
            const models = await getLMStudioModels();
            if (models.length > 0) {
                modelToUse = models[0].id; // Use first available model
            } else {
                throw new Error('No models available in LM Studio');
            }
        }

        const response = await lmStudio.chat.completions.create({
            model: modelToUse,
            messages: messages,
            stream: true,
            temperature: 0.7,
            max_tokens: -1, // Let LM Studio decide
        });

        return response;
    } catch (error) {
        console.error('LM Studio error:', error);
        
        // Fallback to mock response if LM Studio is not available
        const lastMessage = messages[messages.length - 1];
        const mockResponse = `LM Studio is not running or accessible. Please start LM Studio and load a model.\n\nYour message: "${lastMessage.content}"`;
        
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                // Send mock response in chunks to simulate streaming
                const chunks = mockResponse.split(' ');
                let index = 0;
                
                const sendChunk = () => {
                    if (index < chunks.length) {
                        controller.enqueue(encoder.encode(chunks[index] + ' '));
                        index++;
                        setTimeout(sendChunk, 50); // Simulate typing delay
                    } else {
                        controller.close();
                    }
                };
                
                sendChunk();
            },
        });

        return { stream };
    }
}

// Ollama Local LLM Service
export async function callOllama(messages: any[], selectedModel?: string) {
    const port = process.env.OLLAMA_PORT || '11434';
    const baseUrl = process.env.OLLAMA_ENDPOINT || `http://localhost:${port}`;
    
    try {
        // Get available models if no model is selected
        let modelToUse = selectedModel;
        if (!modelToUse) {
            const models = await getOllamaModels();
            if (models.length > 0) {
                modelToUse = models[0].name; // Use first available model
            } else {
                throw new Error('No models available in Ollama');
            }
        }

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: messages.map((msg: any) => ({
                    role: msg.role,
                    content: msg.content
                })),
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        // Create a ReadableStream from the response
        const stream = new ReadableStream({
            start(controller) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                const pump = async (): Promise<void> => {
                    try {
                        const { done, value } = await reader!.read();
                        
                        if (done) {
                            controller.close();
                            return;
                        }

                        // Decode the chunk
                        const chunk = decoder.decode(value, { stream: true });
                        
                        // Split by newlines in case multiple JSON objects are in one chunk
                        const lines = chunk.split('\n').filter(line => line.trim());
                        
                        for (const line of lines) {
                            try {
                                const parsed = JSON.parse(line);
                                if (parsed.message?.content) {
                                    // Encode the content for the stream
                                    const encoder = new TextEncoder();
                                    controller.enqueue(encoder.encode(parsed.message.content));
                                }
                                
                                // Check if this is the final message
                                if (parsed.done) {
                                    controller.close();
                                    return;
                                }
                            } catch (parseError) {
                                // Skip invalid JSON lines
                                console.warn('Failed to parse Ollama stream chunk:', line);
                            }
                        }

                        // Continue reading
                        return pump();
                    } catch (error) {
                        console.error('Ollama stream error:', error);
                        controller.error(error);
                    }
                };

                pump();
            },
        });

        return { stream };
    } catch (error) {
        console.error('Ollama error:', error);
        
        // Fallback to mock response if Ollama is not available
        const lastMessage = messages[messages.length - 1];
        const mockResponse = `Ollama is not running or accessible. Please start Ollama and ensure you have models downloaded.\\n\\nYour message: "${lastMessage.content}"`;
        
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                // Send mock response in chunks to simulate streaming
                const chunks = mockResponse.split(' ');
                let index = 0;
                
                const sendChunk = () => {
                    if (index < chunks.length) {
                        controller.enqueue(encoder.encode(chunks[index] + ' '));
                        index++;
                        setTimeout(sendChunk, 50); // Simulate typing delay
                    } else {
                        controller.close();
                    }
                };
                
                sendChunk();
            },
        });

        return { stream };
    }
}

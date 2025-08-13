import { auth } from '../../../lib/auth';
import { getAvailableProviders, callOpenAI, callAnthropic, callLocalLLM, callOllama } from '../../../lib/llm-providers';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages, provider, model } = await req.json();

  const availableProviders = getAvailableProviders(session.user.plan || 'NONE');
  if (!availableProviders.some((p) => p.id === provider)) {
    return new Response('Provider not available for your plan', { status: 403 });
  }

  try {
    switch (provider) {
      case 'openai': {
        const response = await callOpenAI(messages);
        const stream = OpenAIStream(response as any);
        return new StreamingTextResponse(stream);
      }
      case 'anthropic': {
        const { stream } = await callAnthropic(messages);
        return new StreamingTextResponse(stream);
      }
      case 'local-llm': {
        const response = await callLocalLLM(messages, model);
        // Check if response has stream property (fallback) or is a direct OpenAI response
        if (response && 'stream' in response) {
          return new StreamingTextResponse(response.stream);
        } else {
          // LM Studio returns OpenAI-compatible response
          const stream = OpenAIStream(response as any);
          return new StreamingTextResponse(stream);
        }
      }
      case 'ollama': {
        const response = await callOllama(messages, model);
        return new StreamingTextResponse(response.stream);
      }
      default:
        return new Response('Invalid provider', { status: 400 });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

import { auth } from '../../../lib/auth';
import { getLMStudioModels, getOllamaModels } from '../../../lib/llm-providers';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider');

  try {
    if (provider === 'local-llm') {
      const models = await getLMStudioModels();
      return Response.json({
        provider: 'local-llm',
        models: models.map(model => ({
          id: model.id,
          name: model.id.split('/').pop() || model.id, // Extract model name from path
          fullId: model.id,
          ownedBy: model.owned_by,
        }))
      });
    }

    if (provider === 'ollama') {
      const models = await getOllamaModels();
      return Response.json({
        provider: 'ollama',
        models: models.map(model => ({
          id: model.name,
          name: model.name.split(':')[0], // Extract model name before tag
          fullId: model.name,
          ownedBy: `${model.details.family} • ${model.details.parameter_size}`,
          tag: model.name.split(':')[1] || 'latest',
          size: model.size,
          family: model.details.family,
          parameterSize: model.details.parameter_size,
        }))
      });
    }

    // For other providers, return empty array for now
    return Response.json({
      provider,
      models: []
    });

  } catch (error) {
    console.error('Error fetching models:', error);
    return Response.json(
      { error: 'Failed to fetch models', provider },
      { status: 500 }
    );
  }
}
// Vercel Edge Function: OpenAI Chat proxy
// - Keeps OPENAI_API_KEY server-side
// - Accepts { messages: { role, content }[], model? } and returns { content, usage? }

export const config = { runtime: 'edge' } as const;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCors(headers: HeadersInit = {}) {
  return { ...CORS_HEADERS, ...headers } as HeadersInit;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'developer' | 'tool';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: withCors() });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: OPENAI_API_KEY missing' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    });
  }

  let body: ChatRequestBody | null = null;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    });
  }

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages[] is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const model = body.model || 'gpt-4o-mini';
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.2;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(
        JSON.stringify({ error: 'OpenAI API error', status: openaiRes.status, details: errText }),
        { status: 502, headers: withCors({ 'Content-Type': 'application/json' }) }
      );
    }

    const data = (await openaiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: unknown;
    };
    const content = data.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ content, usage: data.usage }), {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Upstream request failed', details: String(error) }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    });
  }
}



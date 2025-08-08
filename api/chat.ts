// Vercel Node Serverless Function: OpenAI Chat proxy
// - Keeps OPENAI_API_KEY server-side
// - Accepts { messages: { role, content }[], model?, temperature? } and returns { content, usage? }

type ChatRole = 'system' | 'user' | 'assistant' | 'developer' | 'tool';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}

interface VercelLikeRequest {
  method?: string;
  body?: unknown;
}

interface VercelLikeResponse {
  status: (code: number) => VercelLikeResponse;
  setHeader: (key: string, value: string) => void;
  end: (body?: string) => void;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  // Preflight
  if (req.method === 'OPTIONS') {
    res.status(204);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).setHeader('Content-Type', 'application/json');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).setHeader('Content-Type', 'application/json');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.end(JSON.stringify({ error: 'Server misconfigured: OPENAI_API_KEY missing' }));
    return;
  }

  // Parse body
  let body: ChatRequestBody | null = null;
  if (typeof req.body === 'object' && req.body !== null) {
    body = req.body as ChatRequestBody;
  } else if (typeof req.body === 'string') {
    try {
      body = JSON.parse(req.body) as ChatRequestBody;
    } catch {
      body = null;
    }
  }

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).setHeader('Content-Type', 'application/json');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.end(JSON.stringify({ error: 'messages[] is required' }));
    return;
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
      body: JSON.stringify({ model, messages: body.messages, temperature }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      res.status(502).setHeader('Content-Type', 'application/json');
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      res.end(JSON.stringify({ error: 'OpenAI API error', status: openaiRes.status, details: errText }));
      return;
    }

    const data = await openaiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? '';

    res.status(200).setHeader('Content-Type', 'application/json');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.end(JSON.stringify({ content, usage: data?.usage }));
  } catch (err) {
    res.status(500).setHeader('Content-Type', 'application/json');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.end(JSON.stringify({ error: 'Function crashed', details: String(err) }));
  }
}

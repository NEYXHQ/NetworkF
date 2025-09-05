// LLM wrappers for Founder Profiler
// - Uses Supabase Edge Function `openai-chat` as a generic proxy to OpenAI
// - Enforces strict JSON contracts per mission_statement.MD

import config from '../config/env';

export interface LLMMapSuccess {
  answer_value: -2 | -1 | 0 | 1 | 2;
  confidence: number; // 0..1
  notes?: string;
}

export interface LLMMapClarify {
  need_clarification: true;
  clarifying_question: string;
}

export type LLMMapResponse = LLMMapSuccess | LLMMapClarify;

export interface LLMSummary {
  profile: string;
  confidence: number;
  alternatives: Array<{ profile: string; prob: number }>;
  dimension_estimates: Record<string, number>;
  n_questions: number;
  n_clarifications: number;
  summary: string;
}

const getSupabaseEdge = () => {
  if (!config.ai.useSupabase) {
    throw new Error('Supabase Edge Function not configured for this environment');
  }
  return { 
    url: config.ai.supabaseEdgeUrl, 
    anonKey: config.supabase.anonKey 
  };
};

export async function mapFreeTextToScale(params: {
  questionPrompt: string;
  options: Array<{ label: string; value: number }>;
  userText: string;
}): Promise<LLMMapResponse> {
  const { url, anonKey } = getSupabaseEdge();
  const system = `You are a friendly business advisor helping understand entrepreneurial styles. Your job is to map a user's free-text answer to a scale from -2 to +2 based on how closely it matches the provided options. Be warm and understanding. If the answer is unclear, ask ONE friendly clarifying question. Always return STRICT JSON with one of these shapes:\n\nSuccess: {"answer_value": -2| -1| 0| 1| 2, "confidence": 0..1, "notes": "..."}\nLow confidence: {"need_clarification": true, "clarifying_question": "..."}`;

  const user = `Question: ${params.questionPrompt}\nOptions (value mapping):\n${params.options.map((o) => `- ${o.label} => ${o.value}`).join('\n')}\n\nUser answer: "${params.userText}"\n\nRespond with STRICT JSON only.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM proxy error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { content?: string };
  const content = (data.content || '').trim();
  try {
    const parsed = JSON.parse(content) as LLMMapResponse;
    // Basic shape validation
    if (
      (typeof (parsed as LLMMapSuccess).answer_value === 'number' && typeof (parsed as LLMMapSuccess).confidence === 'number') ||
      (parsed as LLMMapClarify).need_clarification
    ) {
      return parsed;
    }
    throw new Error('Invalid JSON shape from LLM');
  } catch {
    throw new Error('Failed to parse LLM JSON response');
  }
}

export async function summarizeResult(params: {
  profile: string;
  confidence: number;
  alternatives: Array<{ profile: string; prob: number }>;
  dimensions: Record<string, number>;
  nQuestions: number;
  nClarifications: number;
}): Promise<LLMSummary> {
  const { url, anonKey } = getSupabaseEdge();
  const system = `You are a warm, supportive business mentor writing a personal profile for an entrepreneur. Write EXCLUSIVELY in second person using "you" language. 

MANDATORY: Your summary must start with "You are a [profile type]" and continue with phrases like:
- "You prefer to..."
- "You tend to..."
- "When making decisions, you..."
- "Your natural approach is..."
- "You thrive when..."

Write as if speaking directly to them as a friend who understands their entrepreneurial style. Be encouraging and specific about their strengths. Avoid clinical language completely.

Example tone: "You are a Builder who thrives on turning ideas into reality. You prefer to dive deep into the details of your business operations rather than spending time on high-level networking. When faced with challenges, you tend to roll up your sleeves and find practical solutions..."

Return STRICT JSON:\n{"profile":"...","confidence":0..1,"alternatives":[{"profile":"...","prob":...}],"dimension_estimates":{...},"n_questions":N,"n_clarifications":M,"summary":"..."}`;
  const user = `Profile: ${params.profile}\nConfidence: ${params.confidence}\nAlternatives: ${JSON.stringify(params.alternatives)}\nDimensions: ${JSON.stringify(params.dimensions)}\nQuestions: ${params.nQuestions}\nClarifications: ${params.nClarifications}\n\nRespond with STRICT JSON only.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM proxy error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { content?: string };
  const content = (data.content || '').trim();
  try {
    const parsed = JSON.parse(content) as LLMSummary;
    if (typeof parsed.profile === 'string' && typeof parsed.confidence === 'number') {
      return parsed;
    }
    throw new Error('Invalid summary JSON');
  } catch {
    throw new Error('Failed to parse summary JSON');
  }
}



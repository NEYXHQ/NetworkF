// LLM wrappers for Founder Profiler
// - Uses Supabase Edge Function `openai-chat` as a generic proxy to OpenAI
// - Enforces strict JSON contracts per mission_statement.MD

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
  const baseUrl = (import.meta.env.VITE_SUPABASE_DEV_URL as string) || '';
  const anonKey = (import.meta.env.VITE_SUPABASE_DEV_ANON_KEY as string) || '';
  if (!baseUrl || !anonKey) {
    throw new Error('Supabase URL or anon key not configured');
  }
  return { url: `${baseUrl}/functions/v1/openai-chat`, anonKey };
};

export async function mapFreeTextToScale(params: {
  questionPrompt: string;
  options: Array<{ label: string; value: number }>;
  userText: string;
}): Promise<LLMMapResponse> {
  const { url, anonKey } = getSupabaseEdge();
  const system = `You are a professional entrepreneurial profiler. Map a user's free-text answer to a discrete scale among {-2,-1,0,1,2}. Do not invent scoring logic; use semantic closeness to options. If unclear, ask ONE clarifying question. Always return STRICT JSON with one of these shapes:\n\nSuccess: {"answer_value": -2| -1| 0| 1| 2, "confidence": 0..1, "notes": "..."}\nLow confidence: {"need_clarification": true, "clarifying_question": "..."}`;

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
      (typeof (parsed as any).answer_value === 'number' && typeof (parsed as any).confidence === 'number') ||
      (parsed as any).need_clarification
    ) {
      return parsed;
    }
    throw new Error('Invalid JSON shape from LLM');
  } catch (err) {
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
  const system = `You are a professional entrepreneurial profiler. Produce a concise final narrative. Return STRICT JSON:\n{"profile":"...","confidence":0..1,"alternatives":[{"profile":"...","prob":...}],"dimension_estimates":{...},"n_questions":N,"n_clarifications":M,"summary":"..."}`;
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



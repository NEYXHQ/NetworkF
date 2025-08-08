// Supabase Edge Function: OpenAI Chat proxy (Deno)
// - Keeps OPENAI_API_KEY as a Supabase secret
// - Usage: POST with { messages: [{ role, content }], model?, temperature? }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ChatRole = "system" | "user" | "assistant" | "developer" | "tool";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  model?: string;
  temperature?: number;
}

const buildCors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin ?? "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const CORS_HEADERS = buildCors(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY missing" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  let body: ChatRequestBody = {};
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    // ignore, handled below
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages[] is required" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const model = body.model ?? "gpt-4o-mini";
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.2;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: body.messages, temperature }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return new Response(
        JSON.stringify({ error: "OpenAI error", status: r.status, details: txt }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(
      JSON.stringify({ content, usage: data?.usage }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Upstream failed", details: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});



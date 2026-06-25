type AiRequest = {
  kind?: "result_coaching";
  locale?: "ko" | "en";
  run?: {
    status?: "success" | "failed";
    score?: number | null;
    progressMax?: number;
    accuracy?: number;
    smoothness?: number;
    warningPeak?: number;
    durationMs?: number | null;
    failReason?: string | null;
  };
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function buildPrompt(request: AiRequest): string {
  const locale = request.locale === "en" ? "English" : "Korean";
  const run = request.run ?? {};
  return [
    "You are the Hidden Line result coach.",
    `Reply in ${locale}.`,
    "Give one short, calm, non-judgmental improvement tip for a precision tracing game.",
    "Do not mention rankings, prizes, medical claims, money, or personal identity.",
    "Use only these numeric run metrics:",
    JSON.stringify({
      status: run.status ?? "failed",
      score: run.score ?? null,
      progressMax: run.progressMax ?? null,
      accuracy: run.accuracy ?? null,
      smoothness: run.smoothness ?? null,
      warningPeak: run.warningPeak ?? null,
      durationMs: run.durationMs ?? null,
      failReason: run.failReason ?? null,
    }),
  ].join("\n");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const enabled = Deno.env.get("HIDDENLINE_AI_ENABLED") === "true";
  if (!enabled) {
    return json(200, {
      ok: true,
      enabled: false,
      reason: "ai_disabled_for_mvp",
    });
  }

  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "deepseek_api_key_missing" });

  const body = await request.json().catch(() => null) as AiRequest | null;
  if (!body || body.kind !== "result_coaching") return json(400, { ok: false, error: "unsupported_ai_request" });

  const baseUrl = (Deno.env.get("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com").replace(/\/+$/, "");
  const model = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-v4-pro";
  const promptVersion = "hiddenline-result-coach-v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You write compact product-safe coaching copy for Hidden Line." },
        { role: "user", content: buildPrompt(body) },
      ],
      thinking: { type: "disabled" },
      temperature: 0.4,
      max_tokens: 120,
    }),
  });

  if (!response.ok) {
    return json(response.status, {
      ok: false,
      error: "deepseek_request_failed",
      status: response.status,
      model,
      promptVersion,
    });
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const tip = payload.choices?.[0]?.message?.content?.trim() ?? "";

  return json(200, {
    ok: true,
    enabled: true,
    model,
    promptVersion,
    tip,
  });
});

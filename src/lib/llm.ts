export interface LLMMessage {
  role: "system" | "user" | "assistant";
  text: string;
}

export interface LLMResult {
  text: string;
  error?: string;
}

/**
 * Call an LLM via OpenRouter. If apiKey is provided use it; otherwise fall
 * back to the env-level OPENROUTER_API_KEY. Returns { text } on success or
 * { text: "", error } on failure.
 */
export async function callLLM(
  model: string,
  messages: LLMMessage[],
  apiKey?: string | null,
  maxTokens = 200
): Promise<LLMResult> {
  const key = apiKey ?? process.env.OPENROUTER_API_KEY ?? "";

  // Normalise model id: strip leading "openrouter/" prefix if present
  const normModel = model.startsWith("openrouter/")
    ? model.slice("openrouter/".length)
    : model;

  if (!key) {
    // No key at all — return a placeholder
    return {
      text: "(No API key configured — set OPENROUTER_API_KEY or supply a per-agent key)",
      error: "no_key",
    };
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://ai-life-metaverse.replit.app",
        "X-Title": "AI Life Metaverse",
      },
      body: JSON.stringify({
        model: normModel,
        messages: messages.map((m) => ({ role: m.role, content: m.text })),
        max_tokens: maxTokens,
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { text: "", error: `LLM ${res.status}: ${body.slice(0, 200)}` };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  } catch (e) {
    return { text: "", error: String(e) };
  }
}

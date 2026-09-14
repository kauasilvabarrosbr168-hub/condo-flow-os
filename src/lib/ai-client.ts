/**
 * Cliente Anthropic para as server functions do CondoFlow.
 * Substitui o gateway do Lovable (ai.gateway.lovable.dev) que só funciona dentro do Lovable.
 */

export async function callAnthropicText(prompt: string, maxTokens = 1200): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return "";
    const data = await res.json() as { content?: { type: string; text: string }[] };
    return data.content?.[0]?.text ?? "";
  } catch {
    return "";
  }
}

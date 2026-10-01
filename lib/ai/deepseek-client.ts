export class AIError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "AIError";
    this.status = status;
  }
}

export interface DeepseekJsonErrors {
  timeout: string;
  connection: string;
  empty: string;
  invalidJson: string;
}

export interface DeepseekJsonRequestOptions {
  apiKey?: string | null;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
  errors: DeepseekJsonErrors;
}

interface DeepseekChatResponse {
  choices?: { message?: { content?: string } }[];
}

/** Prefer a user-provided key, with a server key as a local/dev fallback. */
export function resolveDeepseekApiKey(userKey?: string | null): string {
  const apiKey = userKey?.trim() || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new AIError("请先在设置中配置 DeepSeek API Key", 503);
  }
  return apiKey;
}

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
}

export async function requestDeepseekJson<T>({
  apiKey: userKey,
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  timeoutMs = 60_000,
  errors,
}: DeepseekJsonRequestOptions): Promise<T> {
  const apiKey = resolveDeepseekApiKey(userKey);
  const baseUrl = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIError(errors.timeout, 504);
    }
    throw new AIError(errors.connection, 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AIError(
      `DeepSeek 返回错误（${response.status}）${
        detail ? `: ${detail.slice(0, 200)}` : ""
      }`,
      502
    );
  }

  const envelope = (await response.json()) as DeepseekChatResponse;
  const raw = envelope.choices?.[0]?.message?.content;
  if (!raw) throw new AIError(errors.empty, 502);

  try {
    return JSON.parse(stripCodeFence(raw)) as T;
  } catch {
    throw new AIError(errors.invalidJson, 502);
  }
}

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AIError,
  requestDeepseekJson,
} from "@/lib/ai/deepseek-client";

const errors = {
  timeout: "请求超时",
  connection: "连接失败",
  empty: "响应为空",
  invalidJson: "JSON 非法",
};

function response(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

function request(timeoutMs?: number) {
  return requestDeepseekJson<{ ok: boolean }>({
    apiKey: "key",
    systemPrompt: "system",
    userPrompt: "user",
    temperature: 0.2,
    timeoutMs,
    errors,
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("requestDeepseekJson", () => {
  it.each(['{"ok":true}', '```json\n{"ok":true}\n```'])(
    "parses JSON response %s",
    async (content) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(content)));

      await expect(request()).resolves.toEqual({ ok: true });
    }
  );

  it("maps a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("denied", { status: 401 }))
    );

    await expect(request()).rejects.toMatchObject({
      name: "AIError",
      status: 502,
      message: "DeepSeek 返回错误（401）: denied",
    });
  });

  it("maps empty and invalid content", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(""))
      .mockResolvedValueOnce(response("not-json"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(request()).rejects.toMatchObject(
      new AIError("响应为空", 502)
    );
    await expect(request()).rejects.toMatchObject(
      new AIError("JSON 非法", 502)
    );
  });

  it("maps an aborted request to the feature timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          );
        })
      )
    );

    const pending = request(10);
    const rejection = expect(pending).rejects.toMatchObject(
      new AIError("请求超时", 504)
    );
    await vi.advanceTimersByTimeAsync(10);

    await rejection;
  });
});

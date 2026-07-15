"use client";

import { useState } from "react";
import Link from "next/link";
import {
  clearSkippedApiKeySetup,
  clearUserDeepseekApiKey,
  getUserDeepseekApiKey,
  maskDeepseekApiKey,
  setUserDeepseekApiKey,
} from "@/lib/ai/user-api-key";

export function ApiKeySettingsForm() {
  const [current, setCurrent] = useState(() => getUserDeepseekApiKey());
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");

  const refresh = () => setCurrent(getUserDeepseekApiKey());

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setMessage("请输入有效的 API Key");
      return;
    }
    setUserDeepseekApiKey(trimmed);
    setDraft("");
    refresh();
    setMessage("已保存");
  };

  const handleClear = () => {
    clearUserDeepseekApiKey();
    clearSkippedApiKeySetup();
    setDraft("");
    refresh();
    setMessage("已清除，使用 AI 前请重新配置");
  };

  return (
    <div className="rounded-panel border border-white/70 bg-white p-6 shadow-card">
      <h2 className="text-[16px] font-semibold text-ink">DeepSeek API Key</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        用于简历解析与 AI 改写。Key 仅保存在本机浏览器，不会上传到我们的数据库。可在{" "}
        <a
          href="https://platform.deepseek.com/api_keys"
          target="_blank"
          rel="noreferrer"
          className="text-landing-cta underline-offset-2 hover:underline"
        >
          DeepSeek 开放平台
        </a>{" "}
        创建。
      </p>

      <div className="mt-4 rounded-xl bg-fog/60 px-3.5 py-3 text-[13px]">
        <span className="text-ink-muted">当前状态：</span>
        {current ? (
          <span className="ml-1 font-medium text-ink">
            已配置（{maskDeepseekApiKey(current)}）
          </span>
        ) : (
          <span className="ml-1 font-medium text-ink">未配置</span>
        )}
      </div>

      <label className="mt-4 block">
        <span className="text-[12px] font-medium text-ink">新的 API Key</span>
        <input
          type="password"
          autoComplete="off"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (message) setMessage("");
          }}
          placeholder="sk-..."
          className="mt-1.5 h-10 w-full rounded-xl border border-ink-soft/10 bg-white px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-landing-cta/15"
        />
      </label>

      {message ? (
        <p className="mt-2 text-[12px] text-ink-soft">{message}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="h-9 rounded-lg bg-landing-cta px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          保存
        </button>
        {current ? (
          <button
            type="button"
            onClick={handleClear}
            className="h-9 rounded-lg border border-ink-soft/20 px-4 text-[13px] font-medium text-ink-soft transition-colors hover:bg-fog-soft hover:text-ink"
          >
            清除
          </button>
        ) : null}
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
        >
          返回简历库
        </Link>
      </div>
    </div>
  );
}

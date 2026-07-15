"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  setSkippedApiKeySetup,
  setUserDeepseekApiKey,
} from "@/lib/ai/user-api-key";

interface ApiKeySetupModalProps {
  open: boolean;
  onClose: () => void;
  /** After save/skip — e.g. anonymous sign-in then navigate. */
  onContinue?: () => void | Promise<void>;
}

export function ApiKeySetupModal({
  open,
  onClose,
  onContinue,
}: ApiKeySetupModalProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setKey("");
      setError("");
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const finish = async () => {
    setBusy(true);
    try {
      onClose();
      await onContinue?.();
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError("请输入 DeepSeek API Key，或选择跳过");
      return;
    }
    setUserDeepseekApiKey(trimmed);
    void finish();
  };

  const handleSkip = () => {
    setSkippedApiKeySetup();
    void finish();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-landing-ink/40 backdrop-blur-sm"
        onClick={onClose}
        disabled={busy}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-setup-title"
        className="relative w-full max-w-md rounded-[20px] border border-white/80 bg-white p-6 shadow-landing-lg"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 rounded-full p-1 text-landing-muted transition-colors hover:bg-slate-100 hover:text-landing-ink"
        >
          <X size={18} />
        </button>

        <h2
          id="api-key-setup-title"
          className="pr-8 text-[18px] font-semibold text-landing-ink"
        >
          配置 DeepSeek API Key
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-landing-muted">
          AI 解析与改写需要你自己的 DeepSeek Key。Key 仅保存在本机浏览器，请求时传给服务端调用
          DeepSeek，不会写入我们的数据库。也可先跳过，稍后在设置页补配。
        </p>

        <label className="mt-5 block">
          <span className="text-[12px] font-medium text-landing-ink">
            API Key
          </span>
          <input
            type="password"
            autoComplete="off"
            value={key}
            disabled={busy}
            onChange={(e) => {
              setKey(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="sk-..."
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] text-landing-ink outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-landing-cta/15"
          />
        </label>
        {error ? (
          <p className="mt-2 text-[12px] text-red-500">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            className="h-10 rounded-lg px-4 text-[13px] font-medium text-landing-muted transition-colors hover:bg-slate-50 hover:text-landing-ink disabled:opacity-50"
          >
            跳过，稍后再说
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="h-10 rounded-lg bg-landing-cta px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            保存并进入
          </button>
        </div>
      </div>
    </div>
  );
}

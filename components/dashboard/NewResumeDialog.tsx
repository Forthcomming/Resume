"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  PencilLine,
  X,
  ChevronLeft,
  Upload,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import {
  saveLocalResumeContent,
  upsertLocalResume,
} from "@/lib/resume/local-storage";
import { emptyResumeContent } from "@/lib/resume/content";

interface NewResumeDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step =
  | "choose"
  | "upload"
  | "scratch"
  | "uploading"
  | "parsing"
  | "error";

interface OptionCardProps {
  icon: typeof UploadCloud;
  title: string;
  description: string;
  onClick: () => void;
}

function OptionCard({ icon: Icon, title, description, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-card border border-white/70 bg-white p-5 text-left shadow-card transition-shadow hover:shadow-card-hover"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
        <Icon size={18} strokeWidth={2} />
      </span>
      <h3 className="mt-3.5 text-[14px] font-medium text-ink">{title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
        {description}
      </p>
    </button>
  );
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT = ".pdf,.docx";

export function NewResumeDialog({ open, onClose }: NewResumeDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const isProcessing = step === "uploading" || step === "parsing";

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Reset to the first step whenever the dialog is reopened.
  useEffect(() => {
    if (open) {
      setStep("choose");
      setDragActive(false);
      setTitle("");
      setErrorMsg("");
    }
  }, [open]);

  if (!open) return null;

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setErrorMsg("文件过大，最大支持 10MB");
      setStep("error");
      return;
    }

    setStep("uploading");

    const formData = new FormData();
    formData.append("file", file);

    // Most of the wait is server-side extraction + LLM parsing, so flip the
    // copy to "parsing" shortly after the request starts.
    const toParsing = setTimeout(() => setStep("parsing"), 700);

    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });
      clearTimeout(toParsing);
      setStep("parsing");

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error || "解析失败，请稍后重试");
        setStep("error");
        return;
      }

      const { id, title: parsedTitle, content, persisted } = data;
      const finalTitle = parsedTitle || "导入的简历";

      if (!persisted) {
        try {
          saveLocalResumeContent(id, content);
          upsertLocalResume({ id, title: finalTitle });
        } catch {
          /* ignore quota errors */
        }
      }

      onClose();
      router.push(
        `/resume/${id}?title=${encodeURIComponent(finalTitle)}`
      );
    } catch {
      clearTimeout(toParsing);
      setErrorMsg("网络异常，请检查连接后重试");
      setStep("error");
    }
  };

  const startScratch = () => {
    const name = title.trim();
    if (!name) {
      titleRef.current?.focus();
      return;
    }

    const id = crypto.randomUUID();
    try {
      saveLocalResumeContent(id, emptyResumeContent());
      upsertLocalResume({ id, title: name });
    } catch {
      /* ignore quota errors */
    }

    onClose();
    router.push(`/resume/${id}?title=${encodeURIComponent(name)}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="开始新的简历"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[540px] rounded-panel border border-white/70 bg-fog bg-[radial-gradient(ellipse_at_50%_0%,#eef3fa_0%,#e2ebf4_55%,#d8e5f0_100%)] p-7 shadow-data"
      >
        {!isProcessing && (
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-white/60 hover:text-ink"
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}

        {step === "choose" && (
          <>
            <h2 className="font-serif text-[20px] font-semibold tracking-tight text-ink">
              开始新的简历
            </h2>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              选择创建方式，AI 会帮助你完成结构化解析。
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <OptionCard
                icon={UploadCloud}
                title="上传已有简历"
                description="支持 PDF、DOCX，AI 自动解析为模块化板块"
                onClick={() => setStep("upload")}
              />
              <OptionCard
                icon={PencilLine}
                title="从零创建"
                description="逐板块填写内容，AI 辅助撰写"
                onClick={() => setStep("scratch")}
              />
            </div>
          </>
        )}

        {step === "upload" && (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                aria-label="返回"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-white/60 hover:text-ink"
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <h2 className="font-serif text-[20px] font-semibold tracking-tight text-ink">
                上传已有简历
              </h2>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={clsx(
                "mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragActive
                  ? "border-brand bg-brand-soft/50"
                  : "border-ink-soft/25 hover:border-brand/40 hover:bg-white/40"
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-ink/5 text-ink-soft">
                <Upload size={20} strokeWidth={2} />
              </span>
              <p className="text-[14px] font-semibold text-ink">
                拖拽文件到此处，或点击上传
              </p>
              <p className="text-[12px] text-ink-muted">
                支持 PDF、DOCX，最大 10MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="mt-1 rounded-full bg-brand px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-hover"
              >
                选择文件
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </>
        )}

        {step === "scratch" && (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                aria-label="返回"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-white/60 hover:text-ink"
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <h2 className="font-serif text-[20px] font-semibold tracking-tight text-ink">
                从零创建
              </h2>
            </div>

            <div className="mt-5">
              <label
                htmlFor="resume-title"
                className="block text-[14px] font-semibold text-ink"
              >
                简历名称
              </label>
              <input
                id="resume-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") startScratch();
                }}
                placeholder="例如：字节跳动·产品经理"
                className="mt-3 h-11 w-full rounded-[10px] border border-white/70 bg-white px-3.5 text-[13px] text-ink shadow-card outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30"
              />

              <button
                type="button"
                onClick={startScratch}
                disabled={title.trim().length === 0}
                className="mt-4 h-11 w-full rounded-lg bg-brand text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand/40 disabled:shadow-none disabled:hover:bg-brand/40"
              >
                开始编辑
              </button>
            </div>
          </>
        )}

        {step === "uploading" && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-brand-soft text-brand">
              <Loader2 size={26} strokeWidth={2} className="animate-spin" />
            </span>
            <p className="text-[15px] font-semibold text-ink">上传中...</p>
            <p className="text-[13px] text-ink-muted">正在上传你的简历文件</p>
          </div>
        )}

        {step === "parsing" && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-[14px] bg-accent-ai/15 text-accent-ai">
              <Sparkles size={26} strokeWidth={2} />
            </span>
            <p className="text-[15px] font-semibold text-ink">
              正在解析简历...
            </p>
            <p className="text-[13px] text-accent-ai">
              识别板块结构，提取结构化内容
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-9 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-red-50 text-red-500">
              <AlertTriangle size={26} strokeWidth={2} />
            </span>
            <p className="text-[15px] font-semibold text-ink">解析未成功</p>
            <p className="max-w-[360px] text-[13px] leading-relaxed text-ink-muted">
              {errorMsg || "解析失败，请稍后重试"}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setStep("upload");
                }}
                className="rounded-full bg-brand px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-hover"
              >
                重新上传
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setStep("choose");
                }}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-white/60"
              >
                返回
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

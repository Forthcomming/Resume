export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_TEXT_LENGTH = 30;

export class ExtractError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ExtractError";
    this.status = status;
  }
}

type FileKind = "pdf" | "docx";

function detectKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  throw new ExtractError("仅支持 PDF 或 DOCX 文件", 415);
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

/**
 * Extract plain text from an uploaded resume file (PDF or DOCX).
 * Throws ExtractError with an appropriate HTTP status on validation failure.
 */
export async function extractResumeText(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new ExtractError("文件为空", 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ExtractError("文件过大，最大支持 10MB", 413);
  }

  const kind = detectKind(file);
  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = kind === "pdf" ? await extractPdf(buffer) : await extractDocx(buffer);
  } catch {
    throw new ExtractError("无法读取文件内容，请确认文件未损坏", 422);
  }

  const cleaned = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();

  if (cleaned.length < MIN_TEXT_LENGTH) {
    throw new ExtractError(
      "未能从文件中提取到足够文本，可能是扫描件或图片型 PDF",
      422
    );
  }

  return cleaned;
}

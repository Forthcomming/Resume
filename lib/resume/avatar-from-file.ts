import { deflateSync } from "zlib";
import { MAX_FILE_SIZE } from "@/lib/resume/extract";

/** Align with AvatarField (2MB source file). */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MIN_EDGE = 64;
const MAX_EDGE = 512;
const PDF_PAGES_TO_SCAN = 1;

export type AvatarCandidate = {
  dataUrl: string;
  width?: number;
  height?: number;
  /** Document order (lower = earlier). */
  order: number;
  byteLength: number;
};

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Encode raw 1/3/4-channel pixels to PNG data URL. */
export function rawPixelsToPngDataUrl(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  channels: 1 | 3 | 4
): string {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++) {
    if (channels === 1) {
      const v = data[i] ?? 0;
      rgba[p++] = v;
      rgba[p++] = v;
      rgba[p++] = v;
      rgba[p++] = 255;
    } else if (channels === 3) {
      rgba[p++] = data[i * 3] ?? 0;
      rgba[p++] = data[i * 3 + 1] ?? 0;
      rgba[p++] = data[i * 3 + 2] ?? 0;
      rgba[p++] = 255;
    } else {
      rgba[p++] = data[i * 4] ?? 0;
      rgba[p++] = data[i * 4 + 1] ?? 0;
      rgba[p++] = data[i * 4 + 2] ?? 0;
      rgba[p++] = data[i * 4 + 3] ?? 255;
    }
  }

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  return `data:image/png;base64,${png.toString("base64")}`;
}

function downscaleRaw(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  channels: 1 | 3 | 4,
  maxEdge: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { data, width, height };
  }
  const scale = maxEdge / longest;
  const tw = Math.max(1, Math.round(width * scale));
  const th = Math.max(1, Math.round(height * scale));
  const out = new Uint8ClampedArray(tw * th * channels);
  for (let y = 0; y < th; y++) {
    const sy = Math.min(height - 1, Math.floor(y / scale));
    for (let x = 0; x < tw; x++) {
      const sx = Math.min(width - 1, Math.floor(x / scale));
      const si = (sy * width + sx) * channels;
      const di = (y * tw + x) * channels;
      for (let c = 0; c < channels; c++) {
        out[di + c] = data[si + c] ?? 0;
      }
    }
  }
  return { data: out, width: tw, height: th };
}

function aspectScore(width: number, height: number): number {
  const ratio = width / Math.max(height, 1);
  if (ratio < 0.55 || ratio > 1.55) return -1;
  // Prefer near-square portraits (often slightly taller).
  return 1 - Math.abs(ratio - 0.85);
}

function scoreCandidate(c: AvatarCandidate): number {
  const w = c.width ?? 0;
  const h = c.height ?? 0;
  if (w > 0 && h > 0) {
    if (Math.min(w, h) < MIN_EDGE) return -1;
    const aspect = aspectScore(w, h);
    if (aspect < 0) return -1;
    const area = w * h;
    return aspect * 1000 + Math.min(area, 400_000) / 400 + (100 - c.order);
  }
  // Unknown dimensions (DOCX): prefer mid-large payloads, earlier order.
  if (c.byteLength < 3_000) return -1;
  if (c.byteLength > MAX_AVATAR_BYTES) return -1;
  return Math.min(c.byteLength, 400_000) / 400 + (100 - c.order);
}

export function pickBestAvatarDataUrl(
  candidates: AvatarCandidate[]
): string | null {
  let best: AvatarCandidate | null = null;
  let bestScore = -1;
  for (const c of candidates) {
    if (c.byteLength > MAX_AVATAR_BYTES) continue;
    if (!c.dataUrl.startsWith("data:image/")) continue;
    const s = scoreCandidate(c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best?.dataUrl ?? null;
}

async function extractFromDocx(buffer: Buffer): Promise<AvatarCandidate[]> {
  const mammoth = await import("mammoth");
  const candidates: AvatarCandidate[] = [];
  let order = 0;

  await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        try {
          const base64 = await image.readAsBase64String();
          const mime = image.contentType || "image/png";
          const dataUrl = `data:${mime};base64,${base64}`;
          const byteLength = Math.floor((base64.length * 3) / 4);
          candidates.push({
            dataUrl,
            order: order++,
            byteLength,
          });
        } catch {
          /* skip bad image */
        }
        return { src: "" };
      }),
    }
  );

  return candidates;
}

async function extractFromPdf(buffer: Buffer): Promise<AvatarCandidate[]> {
  const { extractImages, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const pageCount = Math.min(pdf.numPages ?? 1, PDF_PAGES_TO_SCAN);
  const candidates: AvatarCandidate[] = [];
  let order = 0;

  for (let page = 1; page <= pageCount; page++) {
    let images: Awaited<ReturnType<typeof extractImages>>;
    try {
      images = await extractImages(pdf, page);
    } catch {
      continue;
    }
    for (const img of images) {
      try {
        const channels = img.channels;
        if (channels !== 1 && channels !== 3 && channels !== 4) continue;
        const scaled = downscaleRaw(
          img.data,
          img.width,
          img.height,
          channels,
          MAX_EDGE
        );
        const dataUrl = rawPixelsToPngDataUrl(
          scaled.data,
          scaled.width,
          scaled.height,
          channels
        );
        const byteLength = Math.floor(((dataUrl.split(",")[1] ?? "").length * 3) / 4);
        candidates.push({
          dataUrl,
          width: scaled.width,
          height: scaled.height,
          order: order++,
          byteLength,
        });
      } catch {
        /* skip */
      }
    }
  }

  return candidates;
}

function detectKind(file: File): "pdf" | "docx" | null {
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
  return null;
}

/**
 * Best-effort avatar data URL from an uploaded resume.
 * Returns null when none found or extraction fails (never throws).
 */
export async function extractAvatarFromResumeFile(
  file: File
): Promise<string | null> {
  try {
    if (!file || file.size === 0 || file.size > MAX_FILE_SIZE) return null;
    const kind = detectKind(file);
    if (!kind) return null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const candidates =
      kind === "pdf"
        ? await extractFromPdf(buffer)
        : await extractFromDocx(buffer);

    return pickBestAvatarDataUrl(candidates);
  } catch (err) {
    console.error("[avatar] extract failed", err);
    return null;
  }
}

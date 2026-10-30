import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { A4_HEIGHT_MM, A4_WIDTH_MM } from "@/lib/resume/a4";

export type PdfPageSlice = {
  startPx: number;
  endPx: number;
};

/** Collect CSS-pixel Y offsets (relative to root top) that are safe to cut after. */
export function collectSafeBreakOffsets(root: HTMLElement): number[] {
  const rootRect = root.getBoundingClientRect();
  const offsets = new Set<number>([0]);
  const nodes = root.querySelectorAll(
    "[data-resume-break], section, h1, h2, li, p"
  );

  nodes.forEach((node) => {
    const rect = (node as HTMLElement).getBoundingClientRect();
    const bottom = rect.bottom - rootRect.top;
    if (Number.isFinite(bottom) && bottom > 0) {
      offsets.add(bottom);
    }
  });

  offsets.add(root.scrollHeight);
  return Array.from(offsets).sort((a, b) => a - b);
}

/**
 * Plan page slices that prefer cutting at safe block boundaries.
 * Falls back to a hard A4 cut when no nearby safe break exists.
 */
export function planPdfPageSlices(
  contentHeightPx: number,
  pageHeightPx: number,
  safeBreaksPx: number[]
): PdfPageSlice[] {
  if (
    !Number.isFinite(contentHeightPx) ||
    contentHeightPx <= 0 ||
    !Number.isFinite(pageHeightPx) ||
    pageHeightPx <= 0
  ) {
    return [{ startPx: 0, endPx: Math.max(1, contentHeightPx || 1) }];
  }

  const breaks = Array.from(
    new Set([0, ...safeBreaksPx, contentHeightPx])
  )
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);

  const slices: PdfPageSlice[] = [];
  let start = 0;
  const minUseful = pageHeightPx * 0.45;

  while (start < contentHeightPx - 0.5) {
    const hardEnd = Math.min(contentHeightPx, start + pageHeightPx);
    if (hardEnd >= contentHeightPx - 0.5) {
      slices.push({ startPx: start, endPx: contentHeightPx });
      break;
    }

    let chosen = hardEnd;
    for (let i = breaks.length - 1; i >= 0; i -= 1) {
      const candidate = breaks[i];
      if (candidate <= start + 1) break;
      if (candidate > hardEnd + 0.5) continue;
      if (candidate - start < minUseful) continue;
      chosen = candidate;
      break;
    }

    if (chosen <= start + 1) {
      chosen = hardEnd;
    }

    slices.push({ startPx: start, endPx: chosen });
    start = chosen;
  }

  return slices.length > 0
    ? slices
    : [{ startPx: 0, endPx: contentHeightPx }];
}

function sliceCanvas(
  source: HTMLCanvasElement,
  startPx: number,
  endPx: number,
  scale: number
): HTMLCanvasElement {
  const sy = Math.max(0, Math.floor(startPx * scale));
  const ey = Math.min(source.height, Math.ceil(endPx * scale));
  const sh = Math.max(1, ey - sy);
  const page = document.createElement("canvas");
  page.width = source.width;
  page.height = sh;
  const ctx = page.getContext("2d");
  if (!ctx) return source;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, page.width, page.height);
  ctx.drawImage(source, 0, sy, source.width, sh, 0, 0, source.width, sh);
  return page;
}

/** Capture full resume root and download a multi-page A4 PDF. */
export async function downloadResumePdf(options: {
  element: HTMLElement;
  filename: string;
}): Promise<void> {
  const { element, filename } = options;
  const safeBreaks = collectSafeBreakOffsets(element);
  const cssWidth = Math.max(1, element.getBoundingClientRect().width);
  const pageHeightCssPx = cssWidth * (A4_HEIGHT_MM / A4_WIDTH_MM);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (_doc, cloned) => {
      cloned.style.aspectRatio = "auto";
      cloned.style.height = "auto";
      cloned.style.minHeight = `${A4_HEIGHT_MM}mm`;
      cloned.style.width = `${A4_WIDTH_MM}mm`;
      cloned.style.maxWidth = `${A4_WIDTH_MM}mm`;
      cloned.style.borderRadius = "0";
      cloned.style.boxShadow = "none";
      cloned.style.position = "static";
      cloned.style.left = "auto";
      cloned.style.top = "auto";
      cloned.style.opacity = "1";
      cloned.style.pointerEvents = "auto";
      cloned.style.overflow = "visible";
      // Prefer CJK metrics in the capture clone to avoid title/rule overlap.
      cloned.style.fontFamily =
        "var(--font-noto), var(--font-outfit), 'Noto Sans SC', system-ui, sans-serif";
      cloned.style.lineHeight = "1.5";
    },
  });

  const scale = canvas.width / cssWidth;
  const contentHeightCssPx = canvas.height / scale;
  const slices = planPdfPageSlices(
    contentHeightCssPx,
    pageHeightCssPx,
    safeBreaks
  );

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  slices.forEach((slice, index) => {
    const pageCanvas = sliceCanvas(
      canvas,
      slice.startPx,
      slice.endPx,
      scale
    );
    const imgData = pageCanvas.toDataURL("image/png");
    const drawHeight = Math.min(
      A4_HEIGHT_MM,
      (pageCanvas.height * A4_WIDTH_MM) / pageCanvas.width
    );
    if (index > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, drawHeight);
  });

  const safeName = filename.replace(/[\\/:*?"<>|]+/g, "_").trim() || "resume";
  pdf.save(safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
}

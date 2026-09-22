import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { A4_HEIGHT_MM, A4_WIDTH_MM } from "@/lib/resume/a4";

/** Capture full resume root and download a multi-page A4 PDF. */
export async function downloadResumePdf(options: {
  element: HTMLElement;
  filename: string;
}): Promise<void> {
  const { element, filename } = options;

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
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const imgWidth = A4_WIDTH_MM;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= A4_HEIGHT_MM;

  while (heightLeft > 1) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= A4_HEIGHT_MM;
  }

  const safeName = filename.replace(/[\\/:*?"<>|]+/g, "_").trim() || "resume";
  pdf.save(safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
}

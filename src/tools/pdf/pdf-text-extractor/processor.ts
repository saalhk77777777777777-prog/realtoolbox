/** TOOLBOX v0.14.1 — PDF Text Extractor */
import type { ToolError } from "../../../core/types.ts";
import { loadPdf } from "../shared/loadPdf.ts";

type PdfJsTextItem = { str?: string };
export interface PdfTextInput { file: File; }
export interface PdfTextOutput { fileName: string; pageCount: number; text: string; pages: string[]; characterCount: number; }
export const MAX_PDF_BYTES = 100 * 1024 * 1024;
export function validatePdfText(input: unknown): ToolError | null {
  const v = input as Partial<PdfTextInput> | null;
  if (!v || !(v.file instanceof File)) return { code:"USER_INPUT", what:"PDF 파일이 필요합니다.", why:"입력 파일이 없습니다.", how:"PDF 파일을 선택하세요." };
  if (v.file.size === 0) return { code:"FILE_INVALID", what:"빈 파일입니다.", why:"파일 크기가 0바이트입니다.", how:"내용이 있는 PDF를 선택하세요." };
  if (v.file.size > MAX_PDF_BYTES) return { code:"UNSUPPORTED", what:"PDF가 너무 큽니다.", why:`최대 ${MAX_PDF_BYTES / 1024 / 1024}MB입니다.`, how:"더 작은 PDF를 사용하세요." };
  return null;
}
export async function processPdfText(input: PdfTextInput): Promise<PdfTextOutput> {
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const doc = await loadPdf(bytes);
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const mod = (pdfjs as { default?: typeof pdfjs }).default ?? pdfjs;
  const pdf = await mod.getDocument({ data: bytes }).promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push((content.items as PdfJsTextItem[]).map(item => item.str ?? "").join(" ").replace(/[ \t]+/g, " ").trim());
      page.cleanup();
    }
    const text = pages.join("\n\n");
    return { fileName: input.file.name, pageCount: doc.getPageCount(), text, pages, characterCount: [...text].length };
  } finally { const cleanup = (pdf as unknown as { destroy?: () => Promise<void> }).destroy; if (cleanup) await cleanup.call(pdf); }
}

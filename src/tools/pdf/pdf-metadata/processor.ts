/**
 * TOOLBOX v0.7.0 — PDF Metadata
 * PDF 파일에서 메타데이터와 페이지 수를 정확히 추출합니다. 서버 전송 없음.
 * pdf-lib: load → getPageCount() + getTitle()/getAuthor() 등 Info/XMP 접근.
 * (직전 구현은 바이트를 latin1 문자열로 바꿔 정규식으로 찾았기에 압축/xref 스트림에서 실패했다.)
 */
import { loadPdf } from "../shared/loadPdf.ts";
import type { ToolError } from "../../../core/types.ts";

export interface PdfMetaInput {
  file: File;
}

export interface PdfMetaOutput {
  fileName: string;
  fileSize: number;
  pageCount: number;
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modDate: string;
  pdfVersion: string;
  isEncrypted: boolean;
}

export const MAX_PDF_BYTES = 100 * 1024 * 1024;

export function validatePdfMeta(input: unknown): ToolError | null {
  const v = input as Partial<PdfMetaInput> | null;
  if (!v || !(v.file instanceof File)) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "PDF 파일이 필요합니다.",
      how: "PDF 파일을 업로드하세요.",
    };
  }
  if (v.file.size > MAX_PDF_BYTES) {
    return {
      code: "UNSUPPORTED",
      what: `PDF가 너무 큽니다 (최대 ${Math.round(MAX_PDF_BYTES / 1024 / 1024)}MB).`,
      why: `현재 ${Math.round(v.file.size / 1024 / 1024)}MB입니다.`,
      how: "더 작은 PDF를 사용하세요.",
    };
  }
  return null;
}

const fmtDate = (d: Date | undefined): string =>
  d && !Number.isNaN(d.getTime()) ? d.toISOString() : "";

export async function processPdfMeta(input: PdfMetaInput): Promise<PdfMetaOutput> {
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  const pdfVersion = header.match(/%PDF-(\d+\.\d+)/)?.[1] ?? "unknown";

  // loadPdf가 why/how를 이미 구분해 던지므로 그대로 전달한다.
  const doc = await loadPdf(bytes);

  return {
    fileName: input.file.name,
    fileSize: input.file.size,
    pageCount: doc.getPageCount(),
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: doc.getKeywords() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
    creationDate: fmtDate(doc.getCreationDate()),
    modDate: fmtDate(doc.getModificationDate()),
    pdfVersion,
    isEncrypted: doc.isEncrypted,
  };
}

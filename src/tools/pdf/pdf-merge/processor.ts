/**
 * TOOLBOX v0.7.0 — PDF Merge
 * 여러 PDF 파일을 실제 PDF 문서로 병합합니다. 서버 전송 없음.
 * pdf-lib: 각 파일을 로드해 copyPages로 하나의 문서에 넣고 저장.
 */
import { PDFDocument } from "pdf-lib";
import { loadPdf, PDF_MIME } from "../shared/loadPdf.ts";
import type { ToolError } from "../../../core/types.ts";

export interface MergeInput {
  files: File[];
}

export interface MergeOutput {
  fileCount: number;
  totalSize: number;
  blob: Blob;
  fileName: string;
}

export const MAX_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_MERGE_FILES = 10;

export function validateMerge(input: unknown): ToolError | null {
  const v = input as Partial<MergeInput> | null;
  if (!v || !Array.isArray(v.files) || v.files.length === 0) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "PDF 파일 배열이 필요합니다.",
      how: "PDF 파일을 업로드하세요.",
    };
  }
  if (v.files.length > MAX_MERGE_FILES) {
    return {
      code: "UNSUPPORTED",
      what: `최대 ${MAX_MERGE_FILES}개 파일까지 병합할 수 있습니다.`,
      why: `현재 ${v.files.length}개입니다.`,
      how: "파일 수를 줄이세요.",
    };
  }
  for (const f of v.files) {
    if (!(f instanceof File)) {
      return {
        code: "USER_INPUT",
        what: "유효하지 않은 파일입니다.",
        why: "File 객체가 아닌 값이 포함되어 있습니다.",
        how: "PDF 파일만 업로드하세요.",
      };
    }
    if (f.size > MAX_PDF_BYTES) {
      return {
        code: "UNSUPPORTED",
        what: `파일이 너무 큽니다: ${f.name}`,
        why: `최대 ${Math.round(MAX_PDF_BYTES / 1024 / 1024)}MB입니다.`,
        how: "더 작은 PDF를 사용하세요.",
      };
    }
  }
  return null;
}

export async function processMerge(input: MergeInput): Promise<MergeOutput> {
  const out = await PDFDocument.create();
  let totalSize = 0;
  for (const file of input.files) {
    const src = await loadPdf(await file.arrayBuffer());
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
    totalSize += file.size;
  }
  out.setProducer("TOOLBOX");
  const bytes = await out.save();
  const blob = new Blob([bytes as BlobPart], { type: PDF_MIME });
  return {
    fileCount: input.files.length,
    totalSize,
    blob,
    fileName: "merged.pdf",
  };
}

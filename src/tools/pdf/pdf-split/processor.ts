/**
 * TOOLBOX v0.7.0 — PDF Split
 * PDF에서 선택한 페이지를 실제 새 PDF로 추출합니다. 서버 전송 없음.
 * pdf-lib: load → copyPages(선택 인덱스) → save. 원본은 변경되지 않음.
 */
import { PDFDocument } from "pdf-lib";
import { loadPdf, PDF_MIME } from "../shared/loadPdf.ts";
import type { ToolError } from "../../../core/types.ts";

export type SplitMode = "all" | "odd" | "even" | "range";

export interface SplitInput {
  file: File;
  mode: SplitMode;
  rangeStart?: number;
  rangeEnd?: number;
}

export interface SplitOutput {
  pageCount: number;
  splitCount: number;
  blob: Blob;
  fileName: string;
}

export const MAX_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_PDF_PAGES = 10000;

export function validateSplit(input: unknown): ToolError | null {
  const v = input as Partial<SplitInput> | null;
  if (!v || !(v.file instanceof File)) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "PDF 파일이 필요합니다.",
      how: "PDF 파일을 업로드하세요.",
    };
  }
  if (v.mode !== "all" && v.mode !== "odd" && v.mode !== "even" && v.mode !== "range") {
    return {
      code: "USER_INPUT",
      what: "분할 모드가 올바르지 않습니다.",
      why: "all, odd, even, range만 허용합니다.",
      how: "올바른 모드를 선택하세요.",
    };
  }
  if (v.mode === "range") {
    if (typeof v.rangeStart !== "number" || typeof v.rangeEnd !== "number") {
      return {
        code: "USER_INPUT",
        what: "범위 모드에는 시작/끝 페이지가 필요합니다.",
        why: "rangeStart와 rangeEnd가 필요합니다.",
        how: "페이지 범위를 입력하세요.",
      };
    }
    if (!Number.isInteger(v.rangeStart) || !Number.isInteger(v.rangeEnd)) {
      return {
        code: "USER_INPUT",
        what: "페이지 번호는 정수여야 합니다.",
        why: `현재 ${v.rangeStart}~${v.rangeEnd}입니다.`,
        how: "정수 페이지 번호를 입력하세요.",
      };
    }
    if (v.rangeStart < 1 || v.rangeEnd < v.rangeStart || v.rangeEnd > MAX_PDF_PAGES) {
      return {
        code: "USER_INPUT",
        what: "페이지 범위가 올바르지 않습니다.",
        why: `1 이상 ${MAX_PDF_PAGES} 이하이고 시작 ≤ 끝이어야 합니다.`,
        how: "범위를 다시 입력하세요.",
      };
    }
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

export async function processSplit(input: SplitInput): Promise<SplitOutput> {
  const src = await loadPdf(await input.file.arrayBuffer());
  const pageCount = src.getPageCount();

  const pick = (n: number): boolean => {
    switch (input.mode) {
      case "all":
        return true;
      case "odd":
        return n % 2 === 1;
      case "even":
        return n % 2 === 0;
      case "range": {
        const start = Math.max(1, input.rangeStart ?? 1);
        const end = Math.min(pageCount, input.rangeEnd ?? pageCount);
        return n >= start && n <= end;
      }
    }
  };

  const indices: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    if (pick(i + 1)) indices.push(i);
  }
  if (indices.length === 0) {
    throw {
      code: "USER_INPUT",
      what: "선택된 페이지가 없습니다.",
      why: "모드가 현재 PDF와 맞지 않습니다. even 모드에서 1페이지짜리 PDF를 사용했습니다.",
      how: "다른 모드나 범위를 선택하세요.",
    };
  }

  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  for (const p of pages) out.addPage(p);
  out.setProducer("TOOLBOX");
  const bytes = await out.save();
  const blob = new Blob([bytes as BlobPart], { type: PDF_MIME });

  return {
    pageCount,
    splitCount: indices.length,
    blob,
    fileName: "split.pdf",
  };
}

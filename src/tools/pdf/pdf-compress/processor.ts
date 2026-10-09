/**
 * TOOLBOX v0.8.0 — PDF 메타데이터 제거
 * pdf-lib: load → (모드별 메타데이터 정리) → save({useObjectStreams}).
 * 모드 의미: keep=부식 없는 재작성, strip=작성자·주제·키워드·제조자 제거.
 * (title은 두 모드 모두 보존 — 개인정보로 취급하지 않기로 정함)
 *
 * ponytail: 이미지 다운샘플링은 하지 않는다. PDF 안의 이미지 스트림은 이미
 * DCTDecode/Flate로 압축돼 있어 pdf-lib 재직렬화로는 크기를 줄일 수 없다
 * (실측 고엔트로피 900×700 PNG 53.8KB → 53.8KB, JPEG 533.5KB → 533.5KB).
 * 그래서 크기 축소를 약속하지 않고 이름·단계도 그에 맞춰 정정했다.
 * 진짜 이미지 압축이 필요해지면 pdf.js 렌더 → JPEG 재인코딩 → 재조립이 필요하지만,
 * 텍스트/벡터/링크/선택가능성이 유실된다. 그 트레이드오프를 감수할지 별건으로 다룬다.
 */
import { loadPdf, PDF_MIME } from "../shared/loadPdf.ts";
import type { ToolError } from "../../../core/types.ts";

export type CompressMode = "keep" | "strip";

export interface CompressInput {
  file: File;
  mode: CompressMode;
}

export interface CompressOutput {
  originalSize: number;
  outputSize: number;
  mode: CompressMode;
  blob: Blob;
  fileName: string;
}

export const MAX_PDF_BYTES = 100 * 1024 * 1024;

export function validateCompress(input: unknown): ToolError | null {
  const v = input as Partial<CompressInput> | null;
  if (!v || !(v.file instanceof File)) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "PDF 파일이 필요합니다.",
      how: "PDF 파일을 업로드하세요.",
    };
  }
  if (v.mode !== "keep" && v.mode !== "strip") {
    return {
      code: "USER_INPUT",
      what: "처리 방식이 올바르지 않습니다.",
      why: "keep, strip만 허용합니다.",
      how: "올바른 처리 방식을 선택하세요.",
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

export async function processCompress(input: CompressInput): Promise<CompressOutput> {
  const doc = await loadPdf(await input.file.arrayBuffer());

  if (input.mode === "strip") {
    doc.setCreator("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setAuthor("");
  }
  doc.setModificationDate(new Date(0));
  doc.setProducer("TOOLBOX");

  const bytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([bytes as BlobPart], { type: PDF_MIME });
  return {
    originalSize: input.file.size,
    outputSize: blob.size,
    mode: input.mode,
    blob,
    fileName: "cleaned.pdf",
  };
}

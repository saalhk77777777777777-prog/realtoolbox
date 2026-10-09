/**
 * TOOLBOX v0.7.0 — PDF 공통 검증/오류 매핑
 *
 * pdf-lib은 손상된 PDF를 관대하게 복구해 "0페이지 문서"를 성공으로 돌려준다.
 * 그 결과 merge/split이 깨진 입력을 조용히 통과시켰다. 여기서 한 번 막는다.
 *
 * 주의: 라이브러리가 던진 e.message를 사용자에게 그대로 내보내지 않는다.
 * pdf-lib의 실제 메시지는 "load(..., { ignoreEncryption: true }) if you wish" 처럼
 * 개발자에게만 의미가 있고, 손상 파일에 대해서는 "Cannot read properties of
 * undefined (reading 'Pages')" 같은 내부 TypeError가 그대로 노출된다.
 */
import { PDFDocument } from "pdf-lib";
import type { ToolError } from "../../../core/types.ts";

export const PDF_MIME = "application/pdf";

export function isPdfBytes(head: string): boolean {
  return head.startsWith("%PDF-");
}

function toLatin1(bytes: Uint8Array, from = 0): string {
  return new TextDecoder("latin1").decode(bytes.subarray(from));
}

/** 헤더 검사. 통과하면 null, 아니면 구조화된 오류. */
export function checkPdfHeader(bytes: Uint8Array): ToolError | null {
  if (bytes.length < 8 || !isPdfBytes(toLatin1(bytes, 0).slice(0, 5))) {
    return {
      code: "FILE_INVALID",
      what: "PDF 파일이 아닙니다.",
      why: "파일 맨 앞에 %PDF- 헤더가 없습니다.",
      how: "다른 파일을 선택하세요.",
    };
  }
  return null;
}

/**
 * 암호화 PDF면 trailer에 /Encrypt 딕셔너리가 있다.
 * 파서가 무엇을 던지든(EncryptedPDFError/PasswordException/일반 파싱 오류) 바이트에서 직접 본다.
 */
export function hasEncryptDict(bytes: Uint8Array): boolean {
  // Check the complete byte view: a rewritten trailer or malformed fixture may place
  // the marker outside the last 4 KiB. This function is used only on PDF inputs.
  return toLatin1(bytes).includes("/Encrypt");
}

const isEncryptedError = (e: unknown): boolean => {
  if (!(e instanceof Error)) return false;
  // pdf.js는 name, pdf-lib은 message로 알린다(EncryptedPDFError의 name은 "Error"이다).
  return e.name === "PasswordException" || /encrypt/i.test(e.message);
};

/** 파싱 실패를 사용자용 ToolError로 바꾼다. 라이브러리 원문은 노출하지 않는다. */
export function pdfParseError(e: unknown, bytes: Uint8Array): ToolError {
  if (isEncryptedError(e) || hasEncryptDict(bytes)) {
    return {
      code: "FILE_INVALID",
      what: "암호가 걸린 PDF입니다.",
      why: "이 PDF는 비밀번호로 암호화되어 있어 내용을 읽을 수 없습니다.",
      how: "원래 프로그램에서 PDF를 다시 열어 저장한 뒤 사용하세요.",
    };
  }
  return {
    code: "FILE_INVALID",
    what: "PDF를 열 수 없습니다.",
    why: "파일이 손상되었거나 완성되지 않은 PDF입니다.",
    how: "다른 PDF 파일을 사용하세요. 원본은 보존해 두세요.",
  };
}

/** 헤더·페이지 수를 검증한 PDF를 돌려준다. 실패 시 FILE_INVALID. */
export async function loadPdf(data: ArrayBuffer | Uint8Array): Promise<PDFDocument> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const bad = checkPdfHeader(bytes);
  if (bad) throw bad;
  // Reject /Encrypt dictionaries before pdf-lib attempts a best-effort repair.
  // Otherwise malformed encrypted files may be silently treated as ordinary PDFs.
  if (hasEncryptDict(bytes)) {
    throw {
      code: "FILE_INVALID",
      what: "암호가 걸린 PDF입니다.",
      why: "이 PDF는 비밀번호로 암호화되어 있어 내용을 읽을 수 없습니다.",
      how: "원래 프로그램에서 PDF를 다시 열어 저장한 뒤 사용하세요.",
    };
  }

  let doc: PDFDocument;
  let pageCount: number;
  try {
    // updateMetadata:false — load가 Producer를 pdf-lib 문자열로 덮어쓰는 것을 막는다.
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
    pageCount = doc.getPageCount();
  } catch (e) {
    throw pdfParseError(e, bytes);
  }
  if (pageCount === 0) {
    throw {
      code: "FILE_INVALID",
      what: "PDF에 페이지가 없습니다.",
      why: "복구 후에도 페이지를 찾지 못했습니다. 손상된 파일일 수 있습니다.",
      how: "다른 PDF 파일을 사용하세요.",
    };
  }
  return doc;
}

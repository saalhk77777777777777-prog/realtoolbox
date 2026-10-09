/**
 * TOOLBOX v0.7.0 — PDF to Image
 * PDF 페이지를 실제 이미지로 렌더링합니다. 서버 전송 없음.
 * pdf.js(getDocument + page.render)로 Canvas에 그린 뒤 PNG/JPEG로 내보냅니다.
 * (직전 구현은 페이지 내용을 그리지 않고 파일명만 쓴 자리표시자 이미지를 반환했다.)
 */
import type { ToolError } from "../../../core/types.ts";
import { checkPdfHeader, hasEncryptDict, loadPdf, pdfParseError } from "../shared/loadPdf.ts";

export type OutputImageFormat = "png" | "jpeg";

export interface PdfToImageInput {
  file: File;
  format: OutputImageFormat;
  quality: number;
  scale: number;
  pageNumbers: string;
}

export interface PdfToImagePage {
  page: number;
  width: number;
  height: number;
  blob: Blob;
  dataUrl: string;
}

export interface PdfToImageOutput {
  width: number;
  height: number;
  format: OutputImageFormat;
  /** 첫 페이지 편의 필드. 여러 페이지 지정 시 images를 사용한다. */
  blob: Blob;
  dataUrl: string;
  pageCount: number;
  renderedCount: number;
  pageNumbers: number[];
  images: PdfToImagePage[];
}

export const MAX_PDF_BYTES = 100 * 1024 * 1024;
// 캔버스 1회 + PNG Blob을 전부 메모리에 들고 있으므로 보수적으로 잡는다.
export const MAX_RENDER_PAGES = 20;
export const MAX_SCALE = 4;

export function validatePdfToImage(input: unknown): ToolError | null {
  const v = input as Partial<PdfToImageInput> | null;
  if (!v || !(v.file instanceof File)) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "PDF 파일이 필요합니다.",
      how: "PDF 파일을 업로드하세요.",
    };
  }
  if (v.format !== "png" && v.format !== "jpeg") {
    return {
      code: "USER_INPUT",
      what: "이미지 포맷이 올바르지 않습니다.",
      why: "png, jpeg만 허용합니다.",
      how: "올바른 포맷을 선택하세요.",
    };
  }
  const quality = v.quality ?? 0.92;
  if (typeof quality !== "number" || quality < 0 || quality > 1) {
    return {
      code: "USER_INPUT",
      what: "품질은 0~1 사이여야 합니다.",
      why: `현재 ${quality}입니다.`,
      how: "0~1 사이의 값을 입력하세요.",
    };
  }
  const scale = v.scale ?? 2;
  if (typeof scale !== "number" || scale < 0.5 || scale > MAX_SCALE) {
    return {
      code: "USER_INPUT",
      what: `확대 배율은 0.5~${MAX_SCALE} 사이여야 합니다.`,
      why: `현재 ${scale}입니다.`,
      how: "0.5~4 사이의 값을 입력하세요.",
    };
  }
  const pageNumbers = v.pageNumbers ?? "";
  if (typeof pageNumbers !== "string" || pageNumbers.length > 500) {
    return {
      code: "USER_INPUT",
      what: "페이지 범위가 올바르지 않습니다.",
      why: "빈 문자열(전체) 또는 500자 이하의 '1,3-5' 형식이어야 합니다.",
      how: "예: 1,3-5 또는 빈칸",
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

/** "1,3-5" → [1,3,4,5]. 비어 있으면 null(= 전체). 잘못된 토큰은 무시하고 범위 밖은 제외. */
export function parsePageRange(spec: string, pageCount: number): number[] | null {
  if (spec.trim() === "") return null;
  const out: number[] = [];
  for (const raw of spec.split(",")) {
    const token = raw.trim();
    if (token === "") continue;
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    if (!m) continue;
    const start = Number(m[1]);
    const end = m[2] === undefined ? start : Number(m[2]);
    if (start < 1 || end < start) continue;
    // 범위가 아주 크면 무한 expansion을 막기 위해 실제 페이지 수로 자른다.
    const hi = Math.min(end, pageCount);
    for (let n = start; n <= hi; n++) out.push(n);
  }
  return out.length > 0 ? [...new Set(out)] : null;
}

export async function processPdfToImage(input: PdfToImageInput): Promise<PdfToImageOutput> {
  const scale = input.scale ?? 2;
  const quality = input.quality ?? 0.92;

  // 헤더를 먼저 본다. pdf.js(1.2MB)를 로드하기 전에 걸러야 거짓 파일도 빠르게 거절한다.
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const bad = checkPdfHeader(bytes);
  if (bad) throw bad;
  // pdf.js can sometimes continue parsing a malformed /Encrypt dictionary and fail later
  // at Canvas rendering. Reject it before loading the renderer so users get a stable error.
  if (hasEncryptDict(bytes)) {
    throw {
      code: "FILE_INVALID",
      what: "암호가 걸린 PDF입니다.",
      why: "이 PDF는 비밀번호로 암호화되어 있어 내용을 읽을 수 없습니다.",
      how: "원래 프로그램에서 PDF를 다시 열어 저장한 뒤 사용하세요.",
    };
  }
  // pdf.js may recover a header-only file differently depending on its worker/cache state.
  // Validate the PDF structure with the shared parser before starting rendering.
  await loadPdf(bytes);

  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  // pdf.js 예외(PasswordException/InvalidPDFException)는 그대로 두면 영어 내부 문자열이
  // 사용자에게 노출된다. 다른 PDF 도구와 동일한 문구로 바꾼다.
  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    pdf = await pdfjs.getDocument({ data: bytes }).promise;
  } catch (e) {
    throw pdfParseError(e, bytes);
  }
  const pageCount = pdf.numPages;
  if (pageCount === 0) {
    throw {
      code: "FILE_INVALID",
      what: "PDF에 페이지가 없습니다.",
      why: "렌더링할 수 있는 페이지가 0개입니다.",
      how: "다른 PDF 파일을 사용하세요.",
    };
  }

  const wanted = parsePageRange(input.pageNumbers ?? "", pageCount) ?? null;
  const pages = wanted ?? Array.from({ length: pageCount }, (_, i) => i + 1);
  if (pages.length > MAX_RENDER_PAGES) {
    throw {
      code: "UNSUPPORTED",
      what: `한 번에 최대 ${MAX_RENDER_PAGES}페이지까지 변환할 수 있습니다.`,
      why: `현재 ${pages.length}페이지가 선택되었습니다.`,
      how: "페이지 범위를 나누어 여러 번 변환하세요.",
    };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw {
      code: "BROWSER_LIMIT",
      what: "Canvas를 사용할 수 없습니다.",
      why: "브라우저가 Canvas를 지원하지 않습니다.",
      how: "최신 브라우저를 사용하세요.",
    };
  }

  const mime = input.format === "png" ? "image/png" : "image/jpeg";
  const images: PdfToImagePage[] = [];

  for (const n of pages) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) {
      throw {
        code: "PROCESSING",
        what: "이미지를 저장하지 못했습니다.",
        why: "브라우저가 이미지 인코딩에 실패했습니다.",
        how: "배율을 낮추거나 다른 포맷으로 다시 시도하세요.",
      };
    }
    images.push({
      page: n,
      width: canvas.width,
      height: canvas.height,
      blob,
      dataUrl: canvas.toDataURL(mime, quality),
    });
    page.cleanup();
  }

  const first = images[0]!;
  return {
    width: first.width,
    height: first.height,
    format: input.format,
    blob: first.blob,
    dataUrl: first.dataUrl,
    pageCount,
    renderedCount: images.length,
    pageNumbers: pages,
    images,
  };
}
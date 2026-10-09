/**
 * TOOLBOX v0.4.2 — Image Resizer
 * Canvas 기반 리사이징. dependency 0. 서버 전송 없음.
 */
import type { ToolError } from "../../../core/types.ts";

export interface ResizeInput {
  file: File;
  width: number;
  height: number;
  keepAspect: boolean;
}

export interface ResizeOutput {
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  blob: Blob;
  dataUrl: string;
}

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export function validateResize(input: unknown): ToolError | null {
  const v = input as Partial<ResizeInput> | null;
  if (!v || !(v.file instanceof File) || typeof v.width !== "number" || typeof v.height !== "number") {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "이미지 파일, 너비, 높이가 필요합니다.",
      how: "이미지를 업로드하고 너비/높이를 입력하세요.",
    };
  }
  if (v.width <= 0 || v.height <= 0 || !Number.isInteger(v.width) || !Number.isInteger(v.height)) {
    return {
      code: "USER_INPUT",
      what: "너비/높이는 양의 정수여야 합니다.",
      why: `현재 ${v.width}×${v.height}입니다.`,
      how: "1 이상의 정수를 입력하세요.",
    };
  }
  if (v.width > 10000 || v.height > 10000) {
    return {
      code: "UNSUPPORTED",
      what: "너비/높이는 10000 이하여야 합니다.",
      why: `현재 ${v.width}×${v.height}입니다.`,
      how: "더 작은 값을 입력하세요.",
    };
  }
  if (v.file.size > MAX_IMAGE_BYTES) {
    return {
      code: "UNSUPPORTED",
      what: `이미지가 너무 큽니다 (최대 ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB).`,
      why: `현재 ${Math.round(v.file.size / 1024 / 1024)}MB입니다.`,
      how: "더 작은 이미지를 사용하세요.",
    };
  }
  return null;
}

export async function processResize(input: ResizeInput): Promise<ResizeOutput> {
  const bitmap = await createImageBitmap(input.file);
  let w = input.width;
  let h = input.height;
  if (input.keepAspect) {
    const ratio = bitmap.width / bitmap.height;
    if (w / h > ratio) {
      w = Math.round(h * ratio);
    } else {
      h = Math.round(w / ratio);
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw { code: "BROWSER_LIMIT", what: "Canvas를 사용할 수 없습니다.", why: "브라우저가 Canvas를 지원하지 않습니다.", how: "최신 브라우저를 사용하세요." };
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
  return {
    originalWidth: bitmap.width,
    originalHeight: bitmap.height,
    width: w,
    height: h,
    blob,
    dataUrl: canvas.toDataURL("image/png"),
  };
}

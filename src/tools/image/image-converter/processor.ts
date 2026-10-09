/**
 * TOOLBOX v0.4.3 — Image Converter
 * Canvas 기반 포맷 변환. dependency 0. 서버 전송 없음.
 * JPEG/PNG/WebP 간 변환.
 */
import type { ToolError } from "../../../core/types.ts";

export type ConvertFormat = "jpeg" | "png" | "webp";

export interface ConvertInput {
  file: File;
  format: ConvertFormat;
}

export interface ConvertOutput {
  originalFormat: string;
  format: ConvertFormat;
  width: number;
  height: number;
  blob: Blob;
  dataUrl: string;
}

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export function validateConvert(input: unknown): ToolError | null {
  const v = input as Partial<ConvertInput> | null;
  if (!v || !(v.file instanceof File) || (v.format !== "jpeg" && v.format !== "png" && v.format !== "webp")) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "이미지 파일과 출력 포맷이 필요합니다.",
      how: "이미지를 업로드하고 포맷을 선택하세요.",
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

export async function processConvert(input: ConvertInput): Promise<ConvertOutput> {
  const bitmap = await createImageBitmap(input.file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw { code: "BROWSER_LIMIT", what: "Canvas를 사용할 수 없습니다.", why: "브라우저가 Canvas를 지원하지 않습니다.", how: "최신 브라우저를 사용하세요." };
  if (input.format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const mime = input.format === "png" ? "image/png" : input.format === "webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, 0.92);
  });
  return {
    originalFormat: input.file.type || "unknown",
    format: input.format,
    width: bitmap.width,
    height: bitmap.height,
    blob,
    dataUrl: canvas.toDataURL(mime),
  };
}

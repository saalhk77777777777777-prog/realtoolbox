/**
 * TOOLBOX v0.13.2 — Image Compressor
 * Canvas 기반 이미지 압축. dependency 0. 서버 전송 없음.
 * JPEG/WebP 지원. PNG는 lossless라 quality 무의미.
 */
import type { ToolError } from "../../../core/types.ts";

export type OutputFormat = "jpeg" | "webp" | "png";

export interface ImageInput {
  file: File;
  quality: number;
  format: OutputFormat;
}

export interface ImageOutput {
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number;
  blob: Blob;
  dataUrl: string;
  expanded: boolean;
}

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export function validateImage(input: unknown): ToolError | null {
  const v = input as Partial<ImageInput> | null;
  if (!v || !(v.file instanceof File) || typeof v.quality !== "number" || (v.format !== "jpeg" && v.format !== "webp" && v.format !== "png")) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "이미지 파일, 품질(0~1), 출력 포맷이 필요합니다.",
      how: "이미지를 업로드하고 품질과 포맷을 선택하세요.",
    };
  }
  if (v.quality < 0 || v.quality > 1) {
    return {
      code: "USER_INPUT",
      what: "품질은 0~1 사이여야 합니다.",
      why: `현재 ${v.quality}입니다.`,
      how: "0~1 사이의 값을 입력하세요.",
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

export async function processImage(input: ImageInput): Promise<ImageOutput> {
  const bitmap = await createImageBitmap(input.file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw { code: "BROWSER_LIMIT", what: "Canvas를 사용할 수 없습니다.", why: "브라우저가 Canvas를 지원하지 않습니다.", how: "최신 브라우저를 사용하세요." };
  ctx.drawImage(bitmap, 0, 0);
  const mime = input.format === "png" ? "image/png" : input.format === "webp" ? "image/webp" : "image/jpeg";
  const quality = input.format === "png" ? undefined : input.quality;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, quality);
  });
  const expanded = blob.size > input.file.size;
  const resultBlob = expanded && input.format === "png" && input.file.type === "image/png" ? input.file : blob;
  const dataUrl = expanded && input.format === "png" && input.file.type === "image/png"
    ? URL.createObjectURL(input.file)
    : canvas.toDataURL(mime, quality);
  return {
    originalSize: input.file.size,
    compressedSize: resultBlob.size,
    width: bitmap.width,
    height: bitmap.height,
    format: input.format,
    quality: input.quality,
    blob: resultBlob,
    dataUrl,
    expanded,
  };
}

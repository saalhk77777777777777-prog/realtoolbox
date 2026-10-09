/**
 * TOOLBOX v0.4.6 — Crop / Rotate / Flip
 * Canvas 기반 변환. dependency 0. 서버 전송 없음.
 * Rotate: 90/180/270도. Flip: 좌우/상하. Crop: 영역 선택.
 */
import type { ToolError } from "../../../core/types.ts";

export type RotateAngle = 90 | 180 | 270;
export type FlipDirection = "horizontal" | "vertical";

export interface CropFlipInput {
  file: File;
  rotate: RotateAngle | 0;
  flip: FlipDirection | null;
  crop: { x: number; y: number; width: number; height: number } | null;
}

export interface CropFlipOutput {
  width: number;
  height: number;
  blob: Blob;
  dataUrl: string;
}

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export function validateCropFlip(input: unknown): ToolError | null {
  const v = input as Partial<CropFlipInput> | null;
  if (!v || !(v.file instanceof File)) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "이미지 파일이 필요합니다.",
      how: "이미지를 업로드하세요.",
    };
  }
  if (v.rotate !== 0 && v.rotate !== 90 && v.rotate !== 180 && v.rotate !== 270) {
    return {
      code: "USER_INPUT",
      what: "회전 각도가 올바르지 않습니다.",
      why: "0, 90, 180, 270만 허용합니다.",
      how: "올바른 각도를 선택하세요.",
    };
  }
  if (v.flip !== null && v.flip !== "horizontal" && v.flip !== "vertical") {
    return {
      code: "USER_INPUT",
      what: "반전 방향이 올바르지 않습니다.",
      why: "null, horizontal, vertical만 허용합니다.",
      how: "올바른 방향을 선택하세요.",
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

export async function processCropFlip(input: CropFlipInput): Promise<CropFlipOutput> {
  const bitmap = await createImageBitmap(input.file);
  let srcX = 0;
  let srcY = 0;
  let srcW = bitmap.width;
  let srcH = bitmap.height;
  if (input.crop) {
    srcX = Math.max(0, Math.min(input.crop.x, bitmap.width - 1));
    srcY = Math.max(0, Math.min(input.crop.y, bitmap.height - 1));
    srcW = Math.max(1, Math.min(input.crop.width, bitmap.width - srcX));
    srcH = Math.max(1, Math.min(input.crop.height, bitmap.height - srcY));
  }
  let dstW = srcW;
  let dstH = srcH;
  if (input.rotate === 90 || input.rotate === 270) {
    dstW = srcH;
    dstH = srcW;
  }
  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw { code: "BROWSER_LIMIT", what: "Canvas를 사용할 수 없습니다.", why: "브라우저가 Canvas를 지원하지 않습니다.", how: "최신 브라우저를 사용하세요." };
  ctx.save();
  ctx.translate(dstW / 2, dstH / 2);
  if (input.rotate) ctx.rotate((input.rotate * Math.PI) / 180);
  if (input.flip === "horizontal") ctx.scale(-1, 1);
  if (input.flip === "vertical") ctx.scale(1, -1);
  ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.restore();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
  return { width: dstW, height: dstH, blob, dataUrl: canvas.toDataURL("image/png") };
}

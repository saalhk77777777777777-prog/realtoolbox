/**
 * TOOLBOX v0.4.4 — Target Size Compressor
 * 목표 파일 크기 이하로 이미지를 압축. Canvas + 이진 탐색. dependency 0.
 * 목표 크기보다 원본이 작으면 압축하지 않음.
 */
import type { ToolError } from "../../../core/types.ts";

export type TargetUnit = "KB" | "MB";

export interface TargetInput {
  file: File;
  targetSize: number;
  unit: TargetUnit;
}

export interface TargetOutput {
  originalSize: number;
  targetSize: number;
  resultSize: number;
  width: number;
  height: number;
  quality: number;
  blob: Blob;
  dataUrl: string;
}

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export function validateTarget(input: unknown): ToolError | null {
  const v = input as Partial<TargetInput> | null;
  if (!v || !(v.file instanceof File) || typeof v.targetSize !== "number" || (v.unit !== "KB" && v.unit !== "MB")) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "이미지 파일, 목표 크기, 단위(KB/MB)가 필요합니다.",
      how: "이미지를 업로드하고 목표 크기를 입력하세요.",
    };
  }
  if (v.targetSize <= 0) {
    return {
      code: "USER_INPUT",
      what: "목표 크기는 0보다 커야 합니다.",
      why: `현재 ${v.targetSize}${v.unit}입니다.`,
      how: "1 이상의 값을 입력하세요.",
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

export async function processTarget(input: TargetInput): Promise<TargetOutput> {
  const targetBytes = input.targetSize * (input.unit === "MB" ? 1024 * 1024 : 1024);
  const bitmap = await createImageBitmap(input.file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw { code: "BROWSER_LIMIT", what: "Canvas를 사용할 수 없습니다.", why: "브라우저가 Canvas를 지원하지 않습니다.", how: "최신 브라우저를 사용하세요." };
  ctx.drawImage(bitmap, 0, 0);

  // 원본이 목표보다 작으면 압축하지 않음
  if (input.file.size <= targetBytes) {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.92);
    });
    return {
      originalSize: input.file.size,
      targetSize: targetBytes,
      resultSize: blob.size,
      width: bitmap.width,
      height: bitmap.height,
      quality: 0.92,
      blob,
      dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    };
  }

  // 이진 탐색으로 품질 찾기
  let lo = 0.01;
  let hi = 0.95;
  let bestBlob: Blob | null = null;
  let bestQuality = 0.01;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", mid);
    });
    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (!bestBlob) {
    // 최소 품질로도 목표 미달 — 가장 작은 결과 반환
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.01);
    });
    return {
      originalSize: input.file.size,
      targetSize: targetBytes,
      resultSize: blob.size,
      width: bitmap.width,
      height: bitmap.height,
      quality: 0.01,
      blob,
      dataUrl: canvas.toDataURL("image/jpeg", 0.01),
    };
  }

  return {
    originalSize: input.file.size,
    targetSize: targetBytes,
    resultSize: bestBlob.size,
    width: bitmap.width,
    height: bitmap.height,
    quality: bestQuality,
    blob: bestBlob,
    dataUrl: canvas.toDataURL("image/jpeg", bestQuality),
  };
}

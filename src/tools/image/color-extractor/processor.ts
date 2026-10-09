/**
 * TOOLBOX v0.4.5 — Color Extractor
 * Canvas 기반 색상 추출. dependency 0. 서버 전송 없음.
 * 팔레트: 단순화된 quantization (4bit per channel).
 */
import type { ToolError } from "../../../core/types.ts";

export interface ColorInput {
  file: File;
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  count: number;
}

export interface ColorOutput {
  width: number;
  height: number;
  palette: ColorInfo[];
  dataUrl: string;
}

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

export function validateColor(input: unknown): ToolError | null {
  const v = input as Partial<ColorInput> | null;
  if (!v || !(v.file instanceof File)) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "이미지 파일이 필요합니다.",
      how: "이미지를 업로드하세요.",
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

export async function processColor(input: ColorInput): Promise<ColorOutput> {
  const bitmap = await createImageBitmap(input.file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw { code: "BROWSER_LIMIT", what: "Canvas를 사용할 수 없습니다.", why: "브라우저가 Canvas를 지원하지 않습니다.", how: "최신 브라우저를 사용하세요." };
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
  const step = Math.max(1, Math.floor(Math.sqrt((canvas.width * canvas.height) / 10000)));
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const i = (y * canvas.width + x) * 4;
      const r = imageData.data[i]!;
      const g = imageData.data[i + 1]!;
      const b = imageData.data[i + 2]!;
      const a = imageData.data[i + 3]!;
      if (a < 128) continue;
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      const key = `${qr},${qg},${qb}`;
      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { r: qr, g: qg, b: qb, count: 1 });
      }
    }
  }
  const palette: ColorInfo[] = [...colorMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((c) => ({
      hex: rgbToHex(c.r, c.g, c.b),
      rgb: { r: c.r, g: c.g, b: c.b },
      hsl: rgbToHsl(c.r, c.g, c.b),
      count: c.count,
    }));
  return {
    width: canvas.width,
    height: canvas.height,
    palette,
    dataUrl: canvas.toDataURL("image/png"),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

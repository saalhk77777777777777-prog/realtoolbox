/** TOOLBOX v0.14.75 — Reliable self-hosted FFmpeg core loading */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

type VideoToWebPOptions = {
  fps: 8 | 12 | 15 | 20;
  width: 320 | 480 | 640 | 800;
  quality: number;
  startSeconds: number;
  durationSeconds: number;
};

export const videoToWebPManifest: ToolManifest = {
  id: "video-to-webp",
  version: "0.14.75",
  title: "영상 → 움직이는 WebP",
  slug: "video-to-webp",
  category: "image",
  description: "짧은 영상의 원하는 구간을 움직이는 WebP 이미지로 변환합니다.",
  keywords: ["video to webp", "animated webp", "mp4 webp", "영상 webp 변환", "움짤 만들기", "움직이는 이미지", "mp4 to webp", "mov to webp", "webm to webp"],
  aliases: ["영상 WebP 변환", "움짤 변환", "동영상 움짤", "애니메이션 WebP 만들기"],
  inputTypes: ["video/mp4", "video/webm", "video/quicktime"],
  outputTypes: ["image/webp"],
  localProcessing: true,
  relatedTools: ["image-converter", "image-compressor", "image-resizer"],
  load: async () => {
    const processor = await import("./processor.ts");
    const ui = await import("./ui.ts");
    return {
      manifest: { ...videoToWebPManifest, load: undefined as never },
      validate: (input: unknown) => {
        const value = input as { file?: File | null; options?: VideoToWebPOptions } | null;
        if (!value?.options) return { code: "USER_INPUT", what: "변환 설정을 확인해 주세요.", why: "필요한 설정이 없습니다.", how: "설정을 확인한 뒤 다시 시도해 주세요." };
        return processor.validateVideoToWebP(value.file ?? null, value.options);
      },
      process: async () => { throw new Error("이 도구는 변환 진행 상황을 표시하는 화면에서 실행해 주세요."); },
      render: ui.renderVideoToWebP,
    };
  },
};

export function registerVideoToWebP(): void {
  registerTool(videoToWebPManifest);
}
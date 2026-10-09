/**
 * TOOLBOX v0.11.0 — Image Compressor manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const imageCompressorManifest: ToolManifest = {
  id: "image-compressor",
  version: "0.13.3",
  title: "Image Compressor — 이미지 압축",
  slug: "image-compressor",
  category: "image",
  description:
    "이미지를 압축합니다. JPEG/WebP 지원, 품질 조절, 서버 전송 없음.",
  keywords: ["image compressor", "이미지 압축", "image compress", "jpg compress", "webp compress"],
  aliases: ["이미지 압축", "image compressor", "이미지 용량 줄이기", "image compress"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["image-resizer", "image-converter", "target-size-compressor"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...imageCompressorManifest, load: undefined as never },
      validate: processor.validateImage,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processImage(input as never);
      },
      render: ui.renderImageCompressor,
    };
  },};

export function registerImageCompressor(): void {
  registerTool(imageCompressorManifest);
}

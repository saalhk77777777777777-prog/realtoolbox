/**
 * TOOLBOX v0.11.0 — Image Converter manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const imageConverterManifest: ToolManifest = {
  id: "image-converter",
  version: "0.13.3",
  title: "Image Converter — 이미지 포맷 변환",
  slug: "image-converter",
  category: "image",
  description:
    "이미지 포맷을 변환합니다. JPEG/PNG/WebP 간 변환, 투명도 처리, 서버 전송 없음.",
  keywords: ["image converter", "이미지 변환", "jpg to png", "png to webp", "image format"],
  aliases: ["이미지 변환", "image converter", "이미지 포맷 변환", "jpg png webp"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["image-compressor", "image-resizer", "target-size-compressor"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...imageConverterManifest, load: undefined as never },
      validate: processor.validateConvert,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processConvert(input as never);
      },
      render: ui.renderImageConverter,
    };
  },};

export function registerImageConverter(): void {
  registerTool(imageConverterManifest);
}

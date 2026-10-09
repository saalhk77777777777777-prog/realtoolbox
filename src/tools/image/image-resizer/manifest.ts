/**
 * TOOLBOX v0.11.0 — Image Resizer manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const imageResizerManifest: ToolManifest = {
  id: "image-resizer",
  version: "0.13.3",
  title: "Image Resizer — 이미지 크기 조절",
  slug: "image-resizer",
  category: "image",
  description:
    "이미지 크기를 조절합니다. 비율 유지, 서버 전송 없음.",
  keywords: ["image resizer", "이미지 리사이즈", "image resize", "크기 조절", "리사이징"],
  aliases: ["이미지 리사이즈", "image resizer", "이미지 크기 조절", "image resize"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["image-compressor", "image-converter", "target-size-compressor"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...imageResizerManifest, load: undefined as never },
      validate: processor.validateResize,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processResize(input as never);
      },
      render: ui.renderImageResizer,
    };
  },};

export function registerImageResizer(): void {
  registerTool(imageResizerManifest);
}

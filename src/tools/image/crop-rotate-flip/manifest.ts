/**
 * TOOLBOX v0.11.0 — Crop / Rotate / Flip manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const cropFlipManifest: ToolManifest = {
  id: "crop-rotate-flip",
  version: "0.13.3",
  title: "Crop / Rotate / Flip — 이미지 자르기·회전·반전",
  slug: "crop-rotate-flip",
  category: "image",
  description:
    "이미지를 자르거나 회전·반전합니다. 서버 전송 없음.",
  keywords: ["crop", "rotate", "flip", "이미지 자르기", "이미지 회전", "이미지 반전"],
  aliases: ["이미지 자르기", "이미지 회전", "이미지 반전", "crop rotate flip"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["image-compressor", "image-resizer", "image-converter"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...cropFlipManifest, load: undefined as never },
      validate: processor.validateCropFlip,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processCropFlip(input as never);
      },
      render: ui.renderCropFlip,
    };
  },};

export function registerCropFlip(): void {
  registerTool(cropFlipManifest);
}

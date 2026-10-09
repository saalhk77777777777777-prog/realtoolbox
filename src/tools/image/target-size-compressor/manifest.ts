/**
 * TOOLBOX v0.11.0 — Target Size Compressor manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const targetManifest: ToolManifest = {
  id: "target-size-compressor",
  version: "0.13.3",
  title: "Target Size Compressor — 목표 크기로 압축",
  slug: "target-size-compressor",
  category: "image",
  description:
    "목표 파일 크기 이하로 이미지를 압축합니다. 이진 탐색으로 품질을 조절합니다.",
  keywords: ["target size", "목표 크기", "file size", "파일 크기", "compress to size"],
  aliases: ["목표 크기 압축", "target size compressor", "파일 크기 맞추기", "compress to size"],
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
      manifest: { ...targetManifest, load: undefined as never },
      validate: processor.validateTarget,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processTarget(input as never);
      },
      render: ui.renderTarget,
    };
  },};

export function registerTarget(): void {
  registerTool(targetManifest);
}

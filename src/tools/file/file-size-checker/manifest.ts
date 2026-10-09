/**
 * TOOLBOX v0.11.0 — File Size Checker manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const fileSizeCheckerManifest: ToolManifest = {
  id: "file-size-checker",
  version: "0.13.3",
  title: "File Size Checker — 파일 크기 확인",
  slug: "file-size-checker",
  category: "file",
  description:
    "파일을 업로드하지 않고 브라우저에서 파일명·MIME·확장자·바이트 크기를 확인합니다.",
  keywords: ["file size", "파일 크기", "file checker", "용량 확인"],
  aliases: ["파일 크기 확인", "file size checker", "용량 체크"],
  inputTypes: ["file"],
  outputTypes: ["file-meta-json"],
  localProcessing: true,
  relatedTools: ["target-size-compressor", "image-compressor", "zip-viewer"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...fileSizeCheckerManifest, load: undefined as never },
      validate: processor.validateSizeChecker,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processSizeChecker(input as never);
      },
      render: ui.renderFileSizeChecker,
    };
  },};

export function registerFileSizeChecker(): void {
  registerTool(fileSizeCheckerManifest);
}

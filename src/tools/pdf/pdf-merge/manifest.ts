/**
 * TOOLBOX v0.11.0 — PDF Merge manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const pdfMergeManifest: ToolManifest = {
  id: "pdf-merge",
  version: "0.13.3",
  title: "PDF Merge — PDF 병합",
  slug: "pdf-merge",
  category: "pdf",
  description: "여러 PDF 파일을 하나로 병합합니다. 서버 전송 없음.",
  keywords: ["pdf merge", "pdf 병합", "pdf combine", "pdf 합치기"],
  aliases: ["pdf 병합", "pdf merge", "pdf 합치기", "pdf combine"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["pdf-split", "pdf-compress", "pdf-metadata"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...pdfMergeManifest, load: undefined as never },
      validate: processor.validateMerge,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processMerge(input as never);
      },
      render: ui.renderPdfMerge,
    };
  },};

export function registerPdfMerge(): void {
  registerTool(pdfMergeManifest);
}
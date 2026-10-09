/**
 * TOOLBOX v0.11.0 — PDF Split manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const pdfSplitManifest: ToolManifest = {
  id: "pdf-split",
  version: "0.13.3",
  title: "PDF Split — PDF 분할",
  slug: "pdf-split",
  category: "pdf",
  description: "PDF에서 선택한 페이지를 실제 새 PDF로 추출합니다. 서버 전송 없음.",
  keywords: ["pdf split", "pdf 분할", "pdf extract pages", "pdf 페이지 추출"],
  aliases: ["pdf 분할", "pdf split", "pdf 페이지 추출", "pdf extract pages"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["pdf-merge", "pdf-compress", "pdf-metadata"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...pdfSplitManifest, load: undefined as never },
      validate: processor.validateSplit,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processSplit(input as never);
      },
      render: ui.renderPdfSplit,
    };
  },};

export function registerPdfSplit(): void {
  registerTool(pdfSplitManifest);
}
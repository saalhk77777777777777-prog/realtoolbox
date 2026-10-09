/**
 * TOOLBOX v0.11.0 — PDF Metadata manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const pdfMetaManifest: ToolManifest = {
  id: "pdf-metadata",
  version: "0.13.3",
  title: "PDF Metadata — PDF 정보 추출",
  slug: "pdf-metadata",
  category: "pdf",
  description:
    "PDF 파일에서 메타데이터와 페이지 수를 정확히 추출합니다. 제목, 작성자, 생성 도구, 페이지 수, 서버 전송 없음.",
  keywords: ["pdf metadata", "pdf 정보", "pdf 메타데이터", "pdf info", "pdf pages"],
  aliases: ["pdf 정보", "pdf metadata", "pdf 메타데이터", "pdf 페이지 수"],
  inputTypes: ["file"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["pdf-merge", "pdf-split", "pdf-compress"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...pdfMetaManifest, load: undefined as never },
      validate: processor.validatePdfMeta,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processPdfMeta(input as never);
      },
      render: ui.renderPdfMeta,
    };
  },};

export function registerPdfMeta(): void {
  registerTool(pdfMetaManifest);
}
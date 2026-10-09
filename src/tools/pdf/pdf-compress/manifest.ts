/**
 * TOOLBOX v0.11.0 — PDF 메타데이터 제거 manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const pdfCompressManifest: ToolManifest = {
  id: "pdf-compress",
  version: "0.13.3",
  title: "PDF 메타데이터 제거 — 개인정보 정리",
  slug: "pdf-compress",
  category: "pdf",
  description:
    "PDF에 남은 작성자·주제·키워드·제조자 정보를 지우고 구조를 정리합니다. 서버 전송 없음. 이미지 크기는 줄이지 않습니다.",
  keywords: ["pdf metadata 제거", "pdf 개인정보 제거", "pdf 정보 제거", "pdf optimize", "pdf 정리"],
  aliases: ["pdf 메타데이터 제거", "pdf 개인정보 제거", "pdf 정보 제거", "pdf optimize", "pdf 정리"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["pdf-merge", "pdf-split", "pdf-metadata"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...pdfCompressManifest, load: undefined as never },
      validate: processor.validateCompress,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processCompress(input as never);
      },
      render: ui.renderPdfCompress,
    };
  },};

export function registerPdfCompress(): void {
  registerTool(pdfCompressManifest);
}
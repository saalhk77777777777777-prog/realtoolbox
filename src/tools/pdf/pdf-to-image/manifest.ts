/**
 * TOOLBOX v0.11.0 — PDF to Image manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const pdfToImageManifest: ToolManifest = {
  id: "pdf-to-image",
  version: "0.13.3",
  title: "PDF to Image — PDF를 이미지로 변환",
  slug: "pdf-to-image",
  category: "pdf",
  description: "PDF의 각 페이지를 PNG/JPEG 이미지로 렌더링합니다. 서버 전송 없음.",
  keywords: ["pdf to image", "pdf 이미지", "pdf convert", "pdf png", "pdf jpeg"],
  aliases: ["pdf 이미지", "pdf to image", "pdf 변환", "pdf png"],
  inputTypes: ["file"],
  outputTypes: ["file"],
  localProcessing: true,
  relatedTools: ["pdf-merge", "pdf-split", "pdf-compress"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...pdfToImageManifest, load: undefined as never },
      validate: processor.validatePdfToImage,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processPdfToImage(input as never);
      },
      render: ui.renderPdfToImage,
    };
  },};

export function registerPdfToImage(): void {
  registerTool(pdfToImageManifest);
}
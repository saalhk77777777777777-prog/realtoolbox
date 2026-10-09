/**
 * TOOLBOX v0.11.0 — Image to PDF manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const imageToPdfManifest: ToolManifest = {
  id: "image-to-pdf",
  version: "0.13.3",
  title: "Image to PDF — 이미지를 PDF로 변환",
  slug: "image-to-pdf",
  category: "pdf",
  description: "이미지 파일을 실제 PDF로 변환합니다. 서버 전송 없음.",
  keywords: ["image to pdf", "이미지 pdf", "img2pdf", "image pdf"],
  aliases: ["이미지 pdf", "image to pdf", "이미지 변환", "img2pdf"],
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
      manifest: { ...imageToPdfManifest, load: undefined as never },
      validate: processor.validateImageToPdf,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processImageToPdf(input as never);
      },
      render: ui.renderImageToPdf,
    };
  },};

export function registerImageToPdf(): void {
  registerTool(imageToPdfManifest);
}
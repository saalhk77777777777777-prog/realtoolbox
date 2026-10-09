/** TOOLBOX v0.14.40 — PDF Watermark — PDF 워터마크 manifest (dynamic loading regression fix) */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "pdf-watermark", version: "0.14.2", title: "PDF Watermark — PDF 워터마크", slug: "pdf-watermark", category: "pdf",
  description: "PDF 모든 페이지에 텍스트 워터마크를 추가합니다.", keywords: ["pdf", "pdf-watermark"], aliases: ["PDF Watermark — PDF 워터마크"],
  inputTypes: ["file"], outputTypes: ["data"], localProcessing: true, relatedTools: [],
  load: async () => {
    const [p, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validateWatermark,
      process: async (input, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return p.processWatermark(input as never); },
      render: ui.render };
  }
};
export function registerPdfWatermark() { registerTool(manifest); }

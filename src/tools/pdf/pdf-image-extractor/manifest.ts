/** TOOLBOX v0.14.40 — PDF Image Extractor — PDF 이미지 추출 manifest (dynamic loading regression fix) */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "pdf-image-extractor", version: "0.14.3", title: "PDF Image Extractor — PDF 이미지 추출", slug: "pdf-image-extractor", category: "pdf",
  description: "PDF 내부의 JPEG/PNG 이미지를 추출합니다.", keywords: ["pdf", "pdf-image-extractor"], aliases: ["PDF Image Extractor — PDF 이미지 추출"],
  inputTypes: ["file"], outputTypes: ["data"], localProcessing: true, relatedTools: [],
  load: async () => {
    const [p, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validateExtract,
      process: async (input, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return p.processExtract(input as never); },
      render: ui.render };
  }
};
export function registerPdfImageExtractor() { registerTool(manifest); }

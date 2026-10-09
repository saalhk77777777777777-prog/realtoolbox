/** TOOLBOX v0.14.40 — PDF Page Numberer — PDF 페이지 번호 manifest (dynamic loading regression fix) */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "pdf-page-numberer", version: "0.14.2", title: "PDF Page Numberer — PDF 페이지 번호", slug: "pdf-page-numberer", category: "pdf",
  description: "PDF 각 페이지에 페이지 번호를 추가합니다.", keywords: ["pdf", "pdf-page-numberer"], aliases: ["PDF Page Numberer — PDF 페이지 번호"],
  inputTypes: ["file"], outputTypes: ["data"], localProcessing: true, relatedTools: [],
  load: async () => {
    const [p, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validateNumber,
      process: async (input, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return p.processNumber(input as never); },
      render: ui.render };
  }
};
export function registerPdfPageNumberer() { registerTool(manifest); }

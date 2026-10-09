/** TOOLBOX v0.14.40 — PDF Text Search — PDF 검색 manifest (dynamic loading regression fix) */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "pdf-text-search", version: "0.14.4", title: "PDF Text Search — PDF 검색", slug: "pdf-text-search", category: "pdf",
  description: "PDF 전체 페이지에서 단어를 검색합니다.", keywords: ["pdf", "pdf-text-search"], aliases: ["PDF Text Search — PDF 검색"],
  inputTypes: ["file"], outputTypes: ["data"], localProcessing: true, relatedTools: [],
  load: async () => {
    const [p, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validateSearch,
      process: async (input, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return p.processSearch(input as import("./processor.ts").SearchInput); },
      render: ui.render };
  }
};
export function registerPdfTextSearch() { registerTool(manifest); }

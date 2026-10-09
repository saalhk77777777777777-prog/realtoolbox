/** TOOLBOX v0.14.40 — PDF Compare manifest (dynamic loading regression fix) */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "pdf-compare", version: "0.14.6", title: "PDF Compare — PDF 비교", slug: "pdf-compare", category: "pdf",
  description: "두 PDF의 파일 동일성, 페이지 수, 크기와 SHA-256을 비교합니다.",
  keywords: ["pdf compare", "pdf diff", "pdf 비교"], aliases: ["PDF 비교"], inputTypes: ["file"], outputTypes: ["data"],
  localProcessing: true, relatedTools: ["pdf-text-search", "pdf-page-preview"],
  load: async () => {
    const [p, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validateCompare,
      process: async (i, c) => { if (c.signal.aborted) throw new Error("cancelled"); return p.processCompare(i as import("./processor.ts").CompareInput); },
      render: ui.render };
  }
};
export function registerPdfCompare() { registerTool(manifest); }

/** TOOLBOX v0.14.40 — PDF Page Preview — PDF 미리보기 manifest (dynamic loading regression fix) */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "pdf-page-preview", version: "0.14.5", title: "PDF Page Preview — PDF 미리보기", slug: "pdf-page-preview", category: "pdf",
  description: "PDF의 모든 페이지를 브라우저에서 이미지 미리보기로 렌더링합니다.", keywords: ["pdf", "pdf-page-preview"], aliases: ["PDF Page Preview — PDF 미리보기"],
  inputTypes: ["file"], outputTypes: ["data"], localProcessing: true, relatedTools: [],
  load: async () => {
    const [p, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validatePreview,
      process: async (input, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return p.processPreview(input as import("./processor.ts").PreviewInput); },
      render: ui.render };
  }
};
export function registerPdfPagePreview() { registerTool(manifest); }

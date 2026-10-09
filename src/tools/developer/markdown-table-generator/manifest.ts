/** TOOLBOX v0.11.0 — Markdown Table Generator — 마크다운 표 생성 manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const markdowntablegeneratorManifest: ToolManifest = {
  id: "markdown-table-generator", version: "0.13.3", title: "Markdown Table Generator — 마크다운 표 생성", slug: "markdown-table-generator", category: "developer",
  description: "탭 또는 구분자로 나뉜 데이터를 Markdown 표로 변환합니다.", keywords: ["markdown", "table", "csv", "표", "마크다운"], aliases: ["markdown table", "md table"],
  inputTypes: ["text"], outputTypes: ["text"], localProcessing: true, relatedTools: [],
  load: async () => { const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]); return {manifest: {...markdowntablegeneratorManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render}; }
};
export function registerMarkdownTableGenerator(): void { registerTool(markdowntablegeneratorManifest); }

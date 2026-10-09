/** TOOLBOX v0.11.0 — Regex Escape — 정규식 이스케이프 manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const regexescapeManifest: ToolManifest = {
  id: "regex-escape", version: "0.13.3", title: "Regex Escape — 정규식 이스케이프", slug: "regex-escape", category: "developer",
  description: "정규식에서 특수한 의미를 갖는 문자를 리터럴로 사용할 수 있게 이스케이프합니다.", keywords: ["regex", "escape", "regexp", "정규식", "이스케이프"], aliases: ["regex escape", "regexp escape"],
  inputTypes: ["text"], outputTypes: ["text"], localProcessing: true, relatedTools: [],
  load: async () => { const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]); return {manifest: {...regexescapeManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render}; }
};
export function registerRegexEscape(): void { registerTool(regexescapeManifest); }

/** TOOLBOX v0.11.0 — Text Reverser — 텍스트 뒤집기 manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const textreverserManifest: ToolManifest = {
  id: "text-reverser", version: "0.13.3", title: "Text Reverser — 텍스트 뒤집기", slug: "text-reverser", category: "text",
  description: "텍스트의 문자 순서를 거꾸로 뒤집습니다.", keywords: ["reverse", "text", "문자열", "뒤집기"], aliases: ["reverse", "뒤집기"],
  inputTypes: ["text"], outputTypes: ["text"], localProcessing: true, relatedTools: [],
  load: async () => { const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]); return {manifest: {...textreverserManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render}; }
};
export function registerTextReverser(): void { registerTool(textreverserManifest); }

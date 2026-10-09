/** TOOLBOX v0.11.0 — Character Frequency — 문자 빈도 manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const characterfrequencyManifest: ToolManifest = {
  id: "character-frequency", version: "0.13.3", title: "Character Frequency — 문자 빈도", slug: "character-frequency", category: "text",
  description: "텍스트에 등장하는 문자별 횟수를 계산합니다.", keywords: ["character", "frequency", "count", "문자", "빈도", "횟수"], aliases: ["문자 빈도", "character count"],
  inputTypes: ["text"], outputTypes: ["text"], localProcessing: true, relatedTools: [],
  load: async () => { const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]); return {manifest: {...characterfrequencyManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render}; }
};
export function registerCharacterFrequency(): void { registerTool(characterfrequencyManifest); }

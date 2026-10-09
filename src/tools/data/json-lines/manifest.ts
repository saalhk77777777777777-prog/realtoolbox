/** TOOLBOX v0.11.0 — JSON Lines Converter — JSONL 변환 manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const jsonlinesManifest: ToolManifest = { id:"json-lines", version: "0.13.3", title:"JSON Lines Converter — JSONL 변환", slug:"json-lines", category:"data", description:"JSON 배열과 JSON Lines(JSONL) 사이를 변환합니다.", keywords:["jsonl", "json", "lines", "ndjson", "변환"], aliases:["jsonl", "json", "lines"], inputTypes:["text"], outputTypes:["text"], localProcessing:true, relatedTools:[], load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return {manifest:{...jsonlinesManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render}}};
export function registerJsonLines():void{registerTool(jsonlinesManifest)}

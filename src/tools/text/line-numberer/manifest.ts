/** TOOLBOX v0.11.0 — Line Numberer — 줄 번호 추가 manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const linenumbererManifest: ToolManifest = { id:"line-numberer", version: "0.13.3", title:"Line Numberer — 줄 번호 추가", slug:"line-numberer", category:"text", description:"텍스트 각 줄에 번호를 붙이거나 제거합니다.", keywords:["line", "number", "lines", "줄번호", "텍스트"], aliases:["line", "number", "lines"], inputTypes:["text"], outputTypes:["text"], localProcessing:true, relatedTools:[], load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return {manifest:{...linenumbererManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render}}};
export function registerLineNumberer():void{registerTool(linenumbererManifest)}

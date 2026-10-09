/** TOOLBOX v0.11.0 — JSON Minifier — JSON 압축 manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const jsonminifierManifest: ToolManifest = { id:"json-minifier", version: "0.13.3", title:"JSON Minifier — JSON 압축", slug:"json-minifier", category:"developer", description:"JSON을 한 줄로 압축해 공백을 제거합니다.", keywords:["json", "minify", "compact", "압축"], aliases:["json", "minify", "compact"], inputTypes:["text"], outputTypes:["text"], localProcessing:true, relatedTools:[], load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return {manifest:{...jsonminifierManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render}}};
export function registerJsonMinifier():void{registerTool(jsonminifierManifest)}

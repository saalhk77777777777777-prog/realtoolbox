/** TOOLBOX v0.13.3 — File Name Analyzer — 파일명 분석 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const filenameanalyzerManifest:ToolManifest={
 id:"file-name-analyzer",version: "0.13.3",title:"File Name Analyzer — 파일명 분석",slug:"file-name-analyzer",category:"file",
 description:"파일명의 이름·확장자·숨김 여부·유효하지 않은 Windows 문자 등을 분석합니다.",keywords:["filename", "file name", "extension", "windows", "파일명", "확장자"],aliases:["파일명 분석", "확장자 분석"],
 inputTypes:["file"],outputTypes:["file-analysis"],localProcessing:true,relatedTools:["file-size-checker"],
 load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return {manifest:{...filenameanalyzerManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render};}
};
export function registerFileNameAnalyzer():void{registerTool(filenameanalyzerManifest);}

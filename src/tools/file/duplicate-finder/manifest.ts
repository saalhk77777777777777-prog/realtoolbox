/** TOOLBOX v0.13.3 — Duplicate Finder — 중복 파일 찾기 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const duplicatefinderManifest:ToolManifest={
 id:"duplicate-finder",version: "0.13.3",title:"Duplicate Finder — 중복 파일 찾기",slug:"duplicate-finder",category:"file",
 description:"선택한 파일의 크기와 SHA-256을 비교해 중복 파일 그룹을 찾습니다.",keywords:["duplicate", "files", "sha256", "중복", "파일"],aliases:["중복 파일", "duplicate finder"],
 inputTypes:["file"],outputTypes:["file-analysis"],localProcessing:true,relatedTools:["file-size-checker"],
 load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return {manifest:{...duplicatefinderManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render};}
};
export function registerDuplicateFinder():void{registerTool(duplicatefinderManifest);}

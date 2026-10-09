/** TOOLBOX v0.13.3 — File Checksum — 파일 해시 계산 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const filechecksumManifest:ToolManifest={
 id:"file-checksum",version: "0.13.3",title:"File Checksum — 파일 해시 계산",slug:"file-checksum",category:"file",
 description:"파일의 SHA-256 또는 SHA-1 체크섬을 브라우저에서 계산합니다.",keywords:["checksum", "hash", "sha256", "sha-1", "해시", "체크섬"],aliases:["파일 해시", "checksum"],
 inputTypes:["file"],outputTypes:["file-analysis"],localProcessing:true,relatedTools:["file-size-checker"],
 load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return {manifest:{...filechecksumManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render};}
};
export function registerFileChecksum():void{registerTool(filechecksumManifest);}

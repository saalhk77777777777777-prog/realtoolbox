/** TOOLBOX v0.13.3 — File Signature Checker — 파일 시그니처 확인 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const filesignaturecheckerManifest:ToolManifest={
 id:"file-signature-checker",version: "0.13.3",title:"File Signature Checker — 파일 시그니처 확인",slug:"file-signature-checker",category:"file",
 description:"파일 앞부분의 바이트 시그니처를 검사해 확장자와 실제 형식이 맞는지 확인합니다.",keywords:["signature", "magic bytes", "mime", "file type", "시그니처", "매직 바이트"],aliases:["파일 형식 검사", "magic bytes"],
 inputTypes:["file"],outputTypes:["file-analysis"],localProcessing:true,relatedTools:["file-size-checker"],
 load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return {manifest:{...filesignaturecheckerManifest,load:undefined as never},validate:processor.validate,process:async(input,ctx)=>{if(ctx.signal.aborted)throw new Error("cancelled");return processor.process(input as never)},render:ui.render};}
};
export function registerFileSignatureChecker():void{registerTool(filesignaturecheckerManifest);}

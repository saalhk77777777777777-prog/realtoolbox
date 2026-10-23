/** TOOLBOX v0.14.96 — Text Diff. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{name:"left",label:"Original text",type:"textarea",value:"Hello\nWorld"},{name:"right",label:"Modified text",type:"textarea",value:"Hello\nTOOLBOX"}];
export const manifest: ToolManifest = {id:"text-diff",version:"0.14.96",title:"Text Diff",slug:"text-diff",category:"text",description:"두 텍스트를 줄 단위로 비교해 추가·삭제된 줄을 표시합니다.",keywords:["text-diff","text diff","텍스트 비교","텍스트 차이"],aliases:["Text Diff","텍스트 비교","텍스트 차이 비교"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:processor.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return processor.process(i as never)},render:ui.render}}};
export const diffManifest = manifest;
export function registerDiff(){registerTool(manifest)}
export function registerTextDiff(){registerTool(manifest)}
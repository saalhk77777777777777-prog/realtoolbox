/** TOOLBOX v0.14.98 — Text Wrap — 텍스트 줄바꿈. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"text","label":"텍스트","type":"textarea","value":"TOOLBOX는 다양한 텍스트를 간편하게 정리할 수 있는 온라인 도구 모음입니다."},{"name":"width","label":"줄 너비 (10~500)","type":"number","value":"40"}];
export const manifest: ToolManifest = {id:"text-wrap",version:"0.14.98",title:"Text Wrap — 텍스트 줄바꿈",slug:"text-wrap",category:"text",description:"지정한 글자 너비를 기준으로 텍스트를 줄바꿈합니다.",keywords:["text-wrap","Text Wrap — 텍스트 줄바꿈","텍스트","줄 정리"],aliases:["Text Wrap — 텍스트 줄바꿈"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:["text-counter","whitespace-cleaner"],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerTextWrap(){registerTool(manifest)}

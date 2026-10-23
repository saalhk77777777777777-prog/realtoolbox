/** TOOLBOX v0.14.97 — Text Repeater — 텍스트 반복. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"text","label":"반복할 텍스트","type":"textarea","value":"TOOLBOX"},{"name":"count","label":"반복 횟수 (1~1000)","type":"number","value":"3"}];
export const manifest: ToolManifest = {id:"text-repeater",version:"0.14.97",title:"Text Repeater — 텍스트 반복",slug:"text-repeater",category:"text",description:"입력한 텍스트를 지정한 횟수만큼 반복합니다.",keywords:["text repeater","텍스트 반복","문자 반복"],aliases:["Text Repeater — 텍스트 반복"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:["text-counter","whitespace-cleaner"],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerTextRepeater(){registerTool(manifest)}

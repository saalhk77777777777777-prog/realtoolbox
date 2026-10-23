/** TOOLBOX v0.14.99 — Text to JSON Array — 텍스트를 JSON 배열로. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"text","label":"텍스트 (한 줄당 항목 하나)","type":"textarea","value":"사과\n바나나\n포도"}];
export const manifest: ToolManifest = {id:"text-to-json-array",version:"0.14.99",title:"Text to JSON Array — 텍스트를 JSON 배열로",slug:"text-to-json-array",category:"text",description:"각 줄을 JSON 문자열 배열 항목으로 변환합니다.",keywords:["text-to-json-array","Text to JSON Array — 텍스트를 JSON 배열로","JSON","텍스트","변환"],aliases:["Text to JSON Array — 텍스트를 JSON 배열로"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:["json-formatter","text-counter"],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerTextToJsonArray(){registerTool(manifest)}

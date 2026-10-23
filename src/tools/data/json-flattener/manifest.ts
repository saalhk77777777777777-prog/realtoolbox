/** TOOLBOX v0.14.92 — JSON Flattener manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"json","label":"JSON","type":"textarea","value":"{\"user\":{\"name\":\"Tabi\",\"stats\":{\"level\":3}}}"}];
export const manifest: ToolManifest = { id:"json-flattener",version:"0.14.92",title:"JSON Flattener",slug:"json-flattener",category:"data",description:"중첩 JSON을 경로 기반 평면 객체로 변환합니다.",keywords:["json-flattener","json flattener"],aliases:["JSON Flattener"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerJsonFlattener(){registerTool(manifest)}

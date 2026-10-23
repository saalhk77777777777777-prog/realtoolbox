/** TOOLBOX v0.14.92 — JSON Value Type Inspector manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"json","label":"JSON","type":"textarea","value":"{\"name\":\"Tabi\",\"scores\":[100,95],\"active\":true,\"meta\":null}"}];
export const manifest: ToolManifest = { id:"json-value-type-inspector",version:"0.14.92",title:"JSON Value Type Inspector",slug:"json-value-type-inspector",category:"developer",description:"JSON 각 값의 경로, 자료형, 미리보기를 표로 분석합니다.",keywords:["json-value-type-inspector","json type inspector"],aliases:["JSON Value Type Inspector"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerJsonValueTypeInspector(){registerTool(manifest)}

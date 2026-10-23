/** TOOLBOX v0.14.99 — JSON Array to Lines — JSON 배열을 줄로. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"json","label":"JSON 배열","type":"textarea","value":"[\"사과\",\"바나나\",\"포도\"]"}];
export const manifest: ToolManifest = {id:"json-array-to-lines",version:"0.14.99",title:"JSON Array to Lines — JSON 배열을 줄로",slug:"json-array-to-lines",category:"text",description:"JSON의 원시값 배열을 한 줄씩 텍스트로 변환합니다.",keywords:["json-array-to-lines","JSON Array to Lines — JSON 배열을 줄로","JSON","텍스트","변환"],aliases:["JSON Array to Lines — JSON 배열을 줄로"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:["json-formatter","text-counter"],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerJsonArrayToLines(){registerTool(manifest)}

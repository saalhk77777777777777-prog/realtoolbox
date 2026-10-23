/** TOOLBOX v0.14.97 — Text Line Numberer — 줄 번호 추가. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"text","label":"텍스트","type":"textarea","value":"첫 번째 줄\n두 번째 줄\n세 번째 줄"}];
export const manifest: ToolManifest = {id:"text-line-numberer",version:"0.14.97",title:"Text Line Numberer — 줄 번호 추가",slug:"text-line-numberer",category:"text",description:"각 텍스트 줄 앞에 줄 번호를 붙입니다.",keywords:["line numberer","줄 번호","텍스트 줄 번호"],aliases:["Text Line Numberer — 줄 번호 추가"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:["text-counter","whitespace-cleaner"],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerTextLineNumberer(){registerTool(manifest)}

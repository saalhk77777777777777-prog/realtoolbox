/** TOOLBOX v0.14.92 — XML Escape manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"text","label":"Text","type":"textarea","value":"<message name=\"Tabi\">A & B</message>"}];
export const manifest: ToolManifest = { id:"xml-escape",version:"0.14.92",title:"XML Escape",slug:"xml-escape",category:"developer",description:"XML 특수 문자를 엔티티로 변환합니다.",keywords:["xml-escape"],aliases:["XML Escape"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerXmlEscape(){registerTool(manifest)}

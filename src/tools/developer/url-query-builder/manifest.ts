/** TOOLBOX v0.14.92 — URL Query Builder manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"url","label":"Base URL","value":"https://example.com/search"},{"name":"params","label":"One key=value per line","type":"textarea","value":"q=Tabi fan\npage=2"}];
export const manifest: ToolManifest = { id:"url-query-builder",version:"0.14.92",title:"URL Query Builder",slug:"url-query-builder",category:"developer",description:"key=value 목록으로 URL 쿼리를 생성합니다.",keywords:["url-query-builder"],aliases:["URL Query Builder"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerUrlQueryBuilder(){registerTool(manifest)}

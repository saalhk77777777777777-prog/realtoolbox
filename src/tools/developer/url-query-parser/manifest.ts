/** TOOLBOX v0.14.92 — URL Query Parser manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"url","label":"Absolute URL","value":"https://example.com/search?q=tabi&page=2#top"}];
export const manifest: ToolManifest = { id:"url-query-parser",version:"0.14.92",title:"URL Query Parser",slug:"url-query-parser",category:"developer",description:"URL의 쿼리 파라미터를 분석합니다.",keywords:["url-query-parser"],aliases:["URL Query Parser"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerUrlQueryParser(){registerTool(manifest)}

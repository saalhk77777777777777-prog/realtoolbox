/** TOOLBOX v0.14.91 — HTTP Header Formatter manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"headers","label":"Header lines","type":"textarea","value":"Accept: application/json\nX-Client: TOOLBOX"}];
export const manifest: ToolManifest = { id:"http-header-formatter",version:"0.14.91",title:"HTTP Header Formatter",slug:"http-header-formatter",category:"developer",description:"HTTP Header Formatter 도구입니다.",keywords:["http-header-formatter"],aliases:["HTTP Header Formatter"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerHttpHeaderFormatter(){registerTool(manifest)}

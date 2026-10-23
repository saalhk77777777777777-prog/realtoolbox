/** TOOLBOX v0.14.91 — URL List Validator manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"urls","label":"One URL per line","type":"textarea","value":"https://example.com\nhttps://toolboxbox.netlify.app\nnot-a-url"}];
export const manifest: ToolManifest = { id:"url-list-validator",version:"0.14.91",title:"URL List Validator",slug:"url-list-validator",category:"developer",description:"URL List Validator 도구입니다.",keywords:["url-list-validator"],aliases:["URL List Validator"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerUrlListValidator(){registerTool(manifest)}

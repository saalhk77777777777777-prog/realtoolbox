/** TOOLBOX v0.14.91 — JSON Key Sorter manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"json","label":"JSON","type":"textarea","value":"{\"z\":1,\"a\":{\"y\":2,\"b\":3}}"}];
export const manifest: ToolManifest = { id:"json-key-sorter",version:"0.14.91",title:"JSON Key Sorter",slug:"json-key-sorter",category:"data",description:"JSON Key Sorter 도구입니다.",keywords:["json-key-sorter"],aliases:["JSON Key Sorter"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerJsonKeySorter(){registerTool(manifest)}

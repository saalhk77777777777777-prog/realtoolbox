/** TOOLBOX v0.14.91 — JSON to YAML manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"json","label":"JSON","type":"textarea","value":"{\"name\":\"Tabi\",\"level\":3,\"active\":true}"}];
export const manifest: ToolManifest = { id:"json-to-yaml",version:"0.14.91",title:"JSON to YAML",slug:"json-to-yaml",category:"data",description:"JSON to YAML 도구입니다.",keywords:["json-to-yaml"],aliases:["JSON to YAML"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerJsonToYaml(){registerTool(manifest)}

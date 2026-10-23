/** TOOLBOX v0.14.92 — CSV Row Filter manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"column","label":"Column number (1-based)","type":"number","value":"2"},{"name":"contains","label":"Contains text","value":"Tabi"},{"name":"csv","label":"CSV","type":"textarea","value":"id,name\n1,Tabi\n2,Guest\n3,Tabi Fan"}];
export const manifest: ToolManifest = { id:"csv-row-filter",version:"0.14.92",title:"CSV Row Filter",slug:"csv-row-filter",category:"data",description:"지정한 열에 포함 문자열이 있는 CSV 행만 남깁니다.",keywords:["csv-row-filter"],aliases:["CSV Row Filter"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerCsvRowFilter(){registerTool(manifest)}

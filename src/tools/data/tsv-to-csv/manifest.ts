/** TOOLBOX v0.14.91 — TSV to CSV manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"tsv","label":"TSV","type":"textarea","value":"Name\tScore\nTabi\t100"}];
export const manifest: ToolManifest = { id:"tsv-to-csv",version:"0.14.91",title:"TSV to CSV",slug:"tsv-to-csv",category:"data",description:"TSV to CSV 도구입니다.",keywords:["tsv-to-csv"],aliases:["TSV to CSV"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerTsvToCsv(){registerTool(manifest)}

/** TOOLBOX v0.14.94 — CSV to TSV. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"csv","label":"CSV","type":"textarea","value":"name,level\nTabi,3\nTimi,2"}];
export const manifest: ToolManifest = {id:"csv-to-tsv",version:"0.14.94",title:"CSV to TSV",slug:"csv-to-tsv",category:"data",description:"CSV 데이터를 탭으로 구분된 TSV 형식으로 변환합니다.",keywords:["csv-to-tsv"],aliases:["CSV to TSV"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:processor.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return processor.process(i)},render:ui.render}}};
export function registerCsvToTsv(){registerTool(manifest)}
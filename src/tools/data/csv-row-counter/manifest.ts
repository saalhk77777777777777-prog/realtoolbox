/** TOOLBOX v0.14.94 — CSV Row Counter. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"csv","label":"CSV","type":"textarea","value":"name,level\nTabi,3\nTimi,2"}];
export const manifest: ToolManifest = {id:"csv-row-counter",version:"0.14.94",title:"CSV Row Counter",slug:"csv-row-counter",category:"data",description:"CSV 데이터 행과 열 개수를 빠르게 계산합니다.",keywords:["csv-row-counter"],aliases:["CSV Row Counter"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:processor.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return processor.process(i)},render:ui.render}}};
export function registerCsvRowCounter(){registerTool(manifest)}
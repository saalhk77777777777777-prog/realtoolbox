/** TOOLBOX v0.14.91 — CSV to SQL Insert manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"table","label":"Table name","value":"records"},{"name":"csv","label":"CSV","type":"textarea","value":"id,name\n1,Tabi\n2,Guest"}];
export const manifest: ToolManifest = { id:"csv-to-sql-insert",version:"0.14.91",title:"CSV to SQL Insert",slug:"csv-to-sql-insert",category:"data",description:"CSV 데이터에서 INSERT 문을 생성합니다.",keywords:["csv-to-sql-insert","csv database"],aliases:["CSV to SQL Insert"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerCsvToSqlInsert(){registerTool(manifest)}

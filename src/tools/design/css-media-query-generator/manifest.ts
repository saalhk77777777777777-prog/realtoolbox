/** TOOLBOX v0.14.92 — CSS Media Query Generator manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"minWidth","label":"Minimum width (px)","type":"number","value":"480"},{"name":"maxWidth","label":"Maximum width (px)","type":"number","value":"1024"},{"name":"rules","label":"CSS declarations","type":"textarea","value":"display: grid;\ngap: 1rem;"}];
export const manifest: ToolManifest = { id:"css-media-query-generator",version:"0.14.92",title:"CSS Media Query Generator",slug:"css-media-query-generator",category:"design",description:"뷰포트 범위에 맞는 CSS 미디어 쿼리를 생성합니다.",keywords:["css-media-query-generator"],aliases:["CSS Media Query Generator"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerCssMediaQueryGenerator(){registerTool(manifest)}

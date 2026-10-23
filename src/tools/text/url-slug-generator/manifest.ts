/** TOOLBOX v0.14.95 — URL Slug Generator. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{name:"text",label:"Title",type:"textarea",value:"TOOLBOX New Features 2026"}];
export const manifest: ToolManifest = {id:"url-slug-generator",version:"0.14.95",title:"URL Slug Generator",slug:"url-slug-generator",category:"text",description:"제목을 URL 경로에 쓰기 좋은 슬러그로 변환합니다.",keywords:["url-slug-generator"],aliases:["URL Slug Generator"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:processor.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return processor.process(i)},render:ui.render}}};
export function registerUrlSlugGenerator(){registerTool(manifest)}

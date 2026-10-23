/** TOOLBOX v0.14.92 — HTML to Text manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"html","label":"HTML source","type":"textarea","value":"<h1>Hello</h1><p>Text &amp; more</p>"}];
export const manifest: ToolManifest = { id:"html-to-text",version:"0.14.92",title:"HTML to Text",slug:"html-to-text",category:"data",description:"HTML 태그와 스크립트·스타일을 제거해 텍스트를 추출합니다.",keywords:["html-to-text"],aliases:["HTML to Text"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerHtmlToText(){registerTool(manifest)}

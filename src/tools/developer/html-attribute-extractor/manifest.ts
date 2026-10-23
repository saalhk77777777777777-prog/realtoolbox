/** TOOLBOX v0.14.91 — HTML Attribute Extractor manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const fields = [{"name":"attribute","label":"Attribute name","value":"href"},{"name":"html","label":"HTML source","type":"textarea","value":"<a href=\"https://example.com\">Example</a>\n<a href=\"/about\">About</a>"}];
export const manifest: ToolManifest = { id:"html-attribute-extractor",version:"0.14.91",title:"HTML Attribute Extractor",slug:"html-attribute-extractor",category:"developer",description:"HTML에서 속성값을 추출합니다.",keywords:["html-attribute-extractor","html attribute"],aliases:["HTML Attribute Extractor"],inputTypes:["text"],outputTypes:["text","data"],localProcessing:true,relatedTools:[],load:async()=>{const [p,u]=await Promise.all([import("./processor.ts"),import("./ui.ts")]);return{manifest:{...manifest,load:undefined as never},validate:p.validate,process:async(i,c)=>{if(c.signal.aborted)throw Error("cancelled");return p.process(i)},render:u.render}}};
export function registerHtmlAttributeExtractor(){registerTool(manifest)}

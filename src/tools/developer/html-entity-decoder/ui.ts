/** TOOLBOX v0.14.96 — HTML Entity Decoder UI. */
import { renderPackTool } from "../../shared/pack-v0.14.95.ts";
const fields = [{name:"html",label:"HTML entities",type:"textarea",value:"&lt;hello&gt; &amp; &#x1F431;"}];
export function render(mount:HTMLElement):void { renderPackTool(mount,"HTML Entity Decoder",fields,"html-entity-decoder"); }

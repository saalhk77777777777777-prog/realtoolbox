/** TOOLBOX v0.14.96 — Text Diff UI. */
import { renderPackTool } from "../../shared/pack-v0.14.95.ts";
const fields = [{name:"left",label:"Original text",type:"textarea",value:"Hello\nWorld"},{name:"right",label:"Modified text",type:"textarea",value:"Hello\nTOOLBOX"}];
export function render(mount:HTMLElement):void { renderPackTool(mount,"Text Diff",fields,"text-diff"); }

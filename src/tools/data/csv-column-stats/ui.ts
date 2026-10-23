/** TOOLBOX v0.14.89 — CSV statistics UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"CSV Column Stats",[{name:"text",label:"CSV text",type:"textarea",value:"name,age,score\nAri,16,90\nBo,,82\nCleo,15,95"}],process,validate)}

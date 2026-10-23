/** TOOLBOX v0.14.89 — JSON diff UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"JSON Diff",[{name:"before",label:"Before JSON",type:"textarea",value:'{"name":"Tabi","level":1}'},{name:"after",label:"After JSON",type:"textarea",value:'{"name":"Tabi","level":2,"active":true}'}],process,validate)}

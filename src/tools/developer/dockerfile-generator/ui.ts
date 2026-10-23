/** TOOLBOX v0.14.89 — Dockerfile UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"Dockerfile Generator",[{name:"kind",label:"Template type (node, python, static)",value:"node"},{name:"port",label:"Port",type:"number",value:"3000"}],process,validate)}

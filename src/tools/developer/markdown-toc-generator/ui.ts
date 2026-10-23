/** TOOLBOX v0.14.89 — Markdown TOC UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"Markdown TOC Generator",[{name:"text",label:"Markdown",type:"textarea",value:"# Getting Started\n## Install\n## Usage"}],process,validate)}

/** TOOLBOX v0.14.89 — text/hex UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"Text ↔ Hex Converter",[{name:"direction",label:"Direction (text-to-hex or hex-to-text)",value:"text-to-hex"},{name:"text",label:"Input text / hex bytes",type:"textarea",value:"Hello, TOOLBOX!"}],process,validate)}

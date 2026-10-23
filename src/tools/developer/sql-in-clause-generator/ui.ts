/** TOOLBOX v0.14.89 — SQL IN UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"SQL IN Clause Generator",[{name:"column",label:"Column identifier",value:"users.id"},{name:"mode",label:"Value mode (string or number)",value:"string"},{name:"values",label:"One value per line",type:"textarea",value:"alice\nbob\ncharlie"}],process,validate)}

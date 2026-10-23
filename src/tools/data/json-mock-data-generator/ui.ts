/** TOOLBOX v0.14.89 — JSON mock data UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"JSON Mock Data Generator",[{name:"fields",label:"Fields (name:type, comma-separated)",value:"name:string, age:number, enabled:boolean, email:email, id:id"},{name:"count",label:"Record count (1–1000)",type:"number",value:"5"}],process,validate)}

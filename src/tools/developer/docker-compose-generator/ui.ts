/** TOOLBOX v0.14.89 — Docker Compose UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"Docker Compose Generator",[{name:"service",label:"Service name",value:"web"},{name:"image",label:"Image",value:"nginx:alpine"},{name:"ports",label:"Port mappings (comma-separated host:container)",value:"8080:80"}],process,validate)}

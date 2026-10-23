/** TOOLBOX v0.14.90 — JSON Array Field Picker UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"JSON Array Field Picker",[{"name":"json","label":"JSON array","type":"textarea","value":"[{\"name\":\"Tabi\",\"level\":3,\"active\":true},{\"name\":\"Explorer\",\"level\":2,\"active\":false}]"},{"name":"fields","label":"Fields to keep (comma-separated)","value":"name,level"}],process,validate)}

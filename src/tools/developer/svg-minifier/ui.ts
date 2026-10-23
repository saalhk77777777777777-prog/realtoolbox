/** TOOLBOX v0.14.90 — SVG Minifier UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"SVG Minifier",[{"name":"svg","label":"SVG source","type":"textarea","value":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\">\\n  <!-- icon -->\\n  <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"#7fd0ff\" />\\n</svg>"}],process,validate)}

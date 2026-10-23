/** TOOLBOX v0.14.90 — Nginx Config Generator UI. */
import{process,validate}from"./processor.ts";import{renderSimpleTool}from"../../shared/simple-tool-ui.ts";
export function render(mount:HTMLElement):void{renderSimpleTool(mount,"Nginx Config Generator",[{"name":"kind","label":"Type (static or proxy)","value":"static"},{"name":"domain","label":"Domain / server name","value":"example.com"},{"name":"port","label":"Proxy target port","type":"number","value":"3000"},{"name":"root","label":"Static root","value":"/usr/share/nginx/html"}],process,validate)}

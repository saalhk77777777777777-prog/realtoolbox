/** TOOLBOX v0.14.87 — json-path-finder processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("json-path-finder" as ToolId,input)}export function process(input:unknown){return run("json-path-finder" as ToolId,input)}

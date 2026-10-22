/** TOOLBOX v0.14.87 — csv-delimiter-detector processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("csv-delimiter-detector" as ToolId,input)}export function process(input:unknown){return run("csv-delimiter-detector" as ToolId,input)}

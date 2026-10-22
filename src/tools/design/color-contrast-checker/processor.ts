/** TOOLBOX v0.14.87 — color-contrast-checker processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("color-contrast-checker" as ToolId,input)}export function process(input:unknown){return run("color-contrast-checker" as ToolId,input)}

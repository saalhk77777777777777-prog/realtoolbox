/** TOOLBOX v0.14.86 — px-rem-converter processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("px-rem-converter" as ToolId,input)}export function process(input:unknown){return run("px-rem-converter" as ToolId,input)}

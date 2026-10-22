/** TOOLBOX v0.14.86 — binary-text-converter processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("binary-text-converter" as ToolId,input)}export function process(input:unknown){return run("binary-text-converter" as ToolId,input)}

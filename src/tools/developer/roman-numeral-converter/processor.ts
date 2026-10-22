/** TOOLBOX v0.14.86 — roman-numeral-converter processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("roman-numeral-converter" as ToolId,input)}export function process(input:unknown){return run("roman-numeral-converter" as ToolId,input)}

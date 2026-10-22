/** TOOLBOX v0.14.87 — mime-type-checker processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("mime-type-checker" as ToolId,input)}export function process(input:unknown){return run("mime-type-checker" as ToolId,input)}

/** TOOLBOX v0.14.86 — percentage-calculator processor adapter. */
import{process as run,validate as check,type ToolId}from"../tool-pack/processor.ts";export function validate(input:unknown){return check("percentage-calculator" as ToolId,input)}export function process(input:unknown){return run("percentage-calculator" as ToolId,input)}

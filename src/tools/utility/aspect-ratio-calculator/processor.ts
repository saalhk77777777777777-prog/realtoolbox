/** TOOLBOX v0.14.86 — aspect-ratio-calculator processor adapter. */
import{process as run,validate as check,type ToolId}from"../tool-pack/processor.ts";export function validate(input:unknown){return check("aspect-ratio-calculator" as ToolId,input)}export function process(input:unknown){return run("aspect-ratio-calculator" as ToolId,input)}

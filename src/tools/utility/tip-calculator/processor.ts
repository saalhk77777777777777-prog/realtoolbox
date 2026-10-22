/** TOOLBOX v0.14.87 — tip-calculator processor adapter. */
import{process as run,validate as check,type ToolId}from"../tool-pack/processor.ts";export function validate(input:unknown){return check("tip-calculator" as ToolId,input)}export function process(input:unknown){return run("tip-calculator" as ToolId,input)}

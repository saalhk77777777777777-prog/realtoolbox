/** TOOLBOX v0.14.86 — random-number-generator processor adapter. */
import{process as run,validate as check,type ToolId}from"../tool-pack/processor.ts";export function validate(input:unknown){return check("random-number-generator" as ToolId,input)}export function process(input:unknown){return run("random-number-generator" as ToolId,input)}

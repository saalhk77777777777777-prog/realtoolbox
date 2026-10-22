/** TOOLBOX v0.14.87 — loan-calculator processor adapter. */
import{process as run,validate as check,type ToolId}from"../tool-pack/processor.ts";export function validate(input:unknown){return check("loan-calculator" as ToolId,input)}export function process(input:unknown){return run("loan-calculator" as ToolId,input)}

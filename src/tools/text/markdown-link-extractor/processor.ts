/** TOOLBOX v0.14.87 — markdown-link-extractor processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("markdown-link-extractor" as ToolId,input)}export function process(input:unknown){return run("markdown-link-extractor" as ToolId,input)}

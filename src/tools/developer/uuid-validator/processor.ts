/** TOOLBOX v0.14.87 — uuid-validator processor adapter. */
import{process as run,validate as check,type ToolId}from"../../utility/tool-pack/processor.ts";export function validate(input:unknown){return check("uuid-validator" as ToolId,input)}export function process(input:unknown){return run("uuid-validator" as ToolId,input)}

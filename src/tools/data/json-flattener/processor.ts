/** TOOLBOX v0.14.92 — JSON Flattener processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("json-flattener",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("json-flattener",input)}

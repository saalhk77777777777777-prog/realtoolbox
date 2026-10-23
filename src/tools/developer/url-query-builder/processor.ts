/** TOOLBOX v0.14.92 — URL Query Builder processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("url-query-builder",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("url-query-builder",input)}

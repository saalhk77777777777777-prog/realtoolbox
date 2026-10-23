/** TOOLBOX v0.14.92 — URL Query Parser processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("url-query-parser",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("url-query-parser",input)}

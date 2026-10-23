/** TOOLBOX v0.14.91 — JSON Key Sorter processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.91.ts";
export function validate(input:unknown){return validateGeneric("json-key-sorter",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("json-key-sorter",input)}

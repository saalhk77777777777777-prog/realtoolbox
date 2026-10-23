/** TOOLBOX v0.14.94 — JSON Array Sorter processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.94.ts";
export function validate(input:unknown){return validateGeneric("json-array-sorter",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("json-array-sorter",input)}

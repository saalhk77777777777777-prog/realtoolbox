/** TOOLBOX v0.14.94 — JSON String Escaper processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.94.ts";
export function validate(input:unknown){return validateGeneric("json-string-escaper",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("json-string-escaper",input)}

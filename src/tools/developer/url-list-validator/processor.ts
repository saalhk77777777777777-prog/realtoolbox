/** TOOLBOX v0.14.91 — URL List Validator processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.91.ts";
export function validate(input:unknown){return validateGeneric("url-list-validator",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("url-list-validator",input)}

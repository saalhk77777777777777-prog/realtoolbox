/** TOOLBOX v0.14.92 — XML Escape processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("xml-escape",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("xml-escape",input)}

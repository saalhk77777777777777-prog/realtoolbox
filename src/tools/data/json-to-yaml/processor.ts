/** TOOLBOX v0.14.91 — JSON to YAML processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.91.ts";
export function validate(input:unknown){return validateGeneric("json-to-yaml",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("json-to-yaml",input)}

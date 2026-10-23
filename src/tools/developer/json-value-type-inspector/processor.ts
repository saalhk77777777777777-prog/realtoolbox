/** TOOLBOX v0.14.92 — JSON Value Type Inspector processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("json-value-type-inspector",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("json-value-type-inspector",input)}

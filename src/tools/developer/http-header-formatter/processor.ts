/** TOOLBOX v0.14.91 — HTTP Header Formatter processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.91.ts";
export function validate(input:unknown){return validateGeneric("http-header-formatter",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("http-header-formatter",input)}

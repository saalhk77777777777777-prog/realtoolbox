/** TOOLBOX v0.14.92 — HTML to Text processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("html-to-text",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("html-to-text",input)}

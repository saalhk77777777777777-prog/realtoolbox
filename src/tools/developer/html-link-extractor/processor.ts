/** TOOLBOX v0.14.94 — HTML Link Extractor processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.94.ts";
export function validate(input:unknown){return validateGeneric("html-link-extractor",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("html-link-extractor",input)}

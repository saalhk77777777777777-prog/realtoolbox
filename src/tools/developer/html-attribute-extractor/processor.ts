/** TOOLBOX v0.14.91 — HTML Attribute Extractor processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.91.ts";
export function validate(input:unknown){return validateGeneric("html-attribute-extractor",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("html-attribute-extractor",input)}

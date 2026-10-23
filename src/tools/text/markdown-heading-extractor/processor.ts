/** TOOLBOX v0.14.94 — Markdown Heading Extractor processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.94.ts";
export function validate(input:unknown){return validateGeneric("markdown-heading-extractor",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("markdown-heading-extractor",input)}

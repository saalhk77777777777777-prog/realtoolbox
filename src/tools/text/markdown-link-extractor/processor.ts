/** TOOLBOX v0.14.94 — Markdown Link Extractor processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.94.ts";
export function validate(input:unknown){return validateGeneric("markdown-link-extractor",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("markdown-link-extractor",input)}

/** TOOLBOX v0.14.95 — URL Slug Generator processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.95.ts";
export function validate(input:unknown){return validateGeneric("url-slug-generator",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("url-slug-generator",input)}

/** TOOLBOX v0.14.92 — CSS Media Query Generator processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("css-media-query-generator",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("css-media-query-generator",input)}

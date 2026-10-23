/** TOOLBOX v0.14.92 — CSV Row Filter processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.92.ts";
export function validate(input:unknown){return validateGeneric("csv-row-filter",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("csv-row-filter",input)}

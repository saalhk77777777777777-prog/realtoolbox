/** TOOLBOX v0.14.94 — CSV Row Counter processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.94.ts";
export function validate(input:unknown){return validateGeneric("csv-row-counter",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("csv-row-counter",input)}

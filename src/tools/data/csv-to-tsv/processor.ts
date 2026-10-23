/** TOOLBOX v0.14.94 — CSV to TSV processor. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.94.ts";
export function validate(input:unknown){return validateGeneric("csv-to-tsv",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("csv-to-tsv",input)}

/** TOOLBOX v0.14.91 — TSV to CSV processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.91.ts";
export function validate(input:unknown){return validateGeneric("tsv-to-csv",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("tsv-to-csv",input)}

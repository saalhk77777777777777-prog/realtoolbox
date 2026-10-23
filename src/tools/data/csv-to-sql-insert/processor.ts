/** TOOLBOX v0.14.91 — CSV to SQL Insert processor adapter. */
import {validateGeneric,processGeneric} from "../../shared/pack-v0.14.91.ts";
export function validate(input:unknown){return validateGeneric("csv-to-sql-insert",input)}
export async function process(input:unknown):Promise<unknown>{return processGeneric("csv-to-sql-insert",input)}

/** TOOLBOX v0.14.90 — HTML Table to CSV processor adapter. */
import { validateGeneric, processGeneric } from "../../shared/pack-v0.14.90.ts";
export function validate(input: unknown) { return validateGeneric("html-table-to-csv", input); }
export async function process(input: unknown): Promise<unknown> { return processGeneric("html-table-to-csv", input); }

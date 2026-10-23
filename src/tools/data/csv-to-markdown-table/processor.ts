/** TOOLBOX v0.14.90 — CSV to Markdown Table processor adapter. */
import { validateGeneric, processGeneric } from "../../shared/pack-v0.14.90.ts";
export function validate(input: unknown) { return validateGeneric("csv-to-markdown-table", input); }
export async function process(input: unknown): Promise<unknown> { return processGeneric("csv-to-markdown-table", input); }

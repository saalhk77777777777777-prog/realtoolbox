/** TOOLBOX v0.14.90 — JSON to TypeScript processor adapter. */
import { validateGeneric, processGeneric } from "../../shared/pack-v0.14.90.ts";
export function validate(input: unknown) { return validateGeneric("json-to-typescript", input); }
export async function process(input: unknown): Promise<unknown> { return processGeneric("json-to-typescript", input); }

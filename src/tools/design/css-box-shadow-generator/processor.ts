/** TOOLBOX v0.14.90 — CSS Box Shadow Generator processor adapter. */
import { validateGeneric, processGeneric } from "../../shared/pack-v0.14.90.ts";
export function validate(input: unknown) { return validateGeneric("css-box-shadow-generator", input); }
export async function process(input: unknown): Promise<unknown> { return processGeneric("css-box-shadow-generator", input); }

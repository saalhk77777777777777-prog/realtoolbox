/** TOOLBOX v0.14.90 — Nginx Config Generator processor adapter. */
import { validateGeneric, processGeneric } from "../../shared/pack-v0.14.90.ts";
export function validate(input: unknown) { return validateGeneric("nginx-config-generator", input); }
export async function process(input: unknown): Promise<unknown> { return processGeneric("nginx-config-generator", input); }

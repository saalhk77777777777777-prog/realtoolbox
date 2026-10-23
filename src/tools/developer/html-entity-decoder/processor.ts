/** TOOLBOX v0.14.96 — HTML Entity Decoder processor. */
import type { ToolError } from "../../../core/types.ts";
export function validate(input: unknown): ToolError | null {
  const v = input as { html?: unknown } | null;
  if (!v || typeof v.html !== "string" || !v.html.length) return { code:"USER_INPUT", what:"HTML text required", why:"Input is empty or invalid", how:"Paste text containing HTML entities." };
  if (v.html.length > 1_000_000) return { code:"UNSUPPORTED", what:"Input too large", why:"Maximum 1,000,000 characters", how:"Split the input into smaller parts." };
  return null;
}
export function process(raw: unknown): {decoded:string; characters:number} {
  const input = raw as {html:string};
  const text = input.html.replace(/&#(x[0-9a-f]+|\d+);?/gi, (all, code:string) => {
    const n = code[0]?.toLowerCase() === "x" ? parseInt(code.slice(1),16) : parseInt(code,10);
    try { return Number.isFinite(n) && n >= 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : all; } catch { return all; }
  }).replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (all, name:string) => ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "}[name.toLowerCase()] ?? all));
  return {decoded:text, characters:text.length};
}
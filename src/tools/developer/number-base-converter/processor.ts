/** TOOLBOX v0.9.0 — Number Base Converter processor */
import type { ToolError } from "../../../core/types.ts";
export interface Input { value: string; from: number; to: number; }
export interface Output { result: string; decimal: string; }
const BASES = [2, 8, 10, 16];
export function validate(input: unknown): ToolError | null {
  const v = input as Partial<Input> | null;
  if (!v || typeof v.value !== "string" || !BASES.includes(v.from as number) || !BASES.includes(v.to as number)) return { code: "USER_INPUT", what: "입력이 올바르지 않습니다.", why: "값과 2/8/10/16 진법이 필요합니다.", how: "숫자와 진법을 확인하세요." };
  const raw = v.value.trim().replace(/^[-+]/, "").replace(/^0x/i, "");
  if (!raw || !/^[0-9a-f]+$/i.test(raw)) return { code: "USER_INPUT", what: "숫자 형식이 올바르지 않습니다.", why: "허용되지 않은 문자가 있습니다.", how: "선택한 진법에 맞는 숫자를 입력하세요." };
  const max = Number(v.from); const bad = [...raw.toLowerCase()].some(c => parseInt(c, 16) >= max);
  if (bad) return { code: "USER_INPUT", what: "진법에 맞지 않는 숫자입니다.", why: `${v.value}에는 ${v.from}진법에서 사용할 수 없는 숫자가 있습니다.`, how: `${v.from}진법의 유효한 숫자만 입력하세요.` };
  return null;
}
function parseBase(raw: string, base: number): bigint { let n = 0n; for (const c of raw) n = n * BigInt(base) + BigInt(parseInt(c, 16)); return n; }
export async function process(input: Input): Promise<Output> { const raw = input.value.trim(); const negative = raw.startsWith("-"); const body = raw.replace(/^[-+]/, "").replace(/^0x/i, ""); const decimal = parseBase(body, input.from) * (negative ? -1n : 1n); return { result: decimal.toString(input.to).toUpperCase(), decimal: decimal.toString(10) }; }

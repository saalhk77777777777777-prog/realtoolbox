/** TOOLBOX v0.15.0 — Bit Field Inspector processor. */
import type { ToolError } from "../../../core/types.ts";
export function validate(input: unknown): ToolError | null {
  const v = input as { value?: unknown; width?: unknown } | null;
  const value = Number(v?.value), width = Number(v?.width);
  if (!v || !Number.isSafeInteger(value) || value < 0) return { code: "USER_INPUT", what: "0 이상의 안전한 정수를 입력하세요.", why: "비트 분석은 정확한 정수 입력이 필요합니다.", how: "예: 42" };
  if (!Number.isInteger(width) || width < 1 || width > 53) return { code: "USER_INPUT", what: "비트 폭은 1~53이어야 합니다.", why: "JavaScript 안전 정수 범위를 초과하지 않도록 제한합니다.", how: "1에서 53 사이의 정수를 입력하세요." };
  if (value >= 2 ** width) return { code: "USER_INPUT", what: "값이 선택한 비트 폭에 들어가지 않습니다.", why: "입력값이 표현 가능한 최댓값보다 큽니다.", how: "비트 폭을 늘리거나 값을 줄이세요." };
  return null;
}
export function process(input: unknown): unknown {
  const e = validate(input); if (e) throw Error(e.what + " " + e.how);
  const v = input as { value: number; width: number }, bits = v.value.toString(2).padStart(v.width, "0");
  const setBits = [...bits].reverse().flatMap((bit, index) => bit === "1" ? [index] : []);
  return { value: v.value, hex: "0x" + v.value.toString(16).toUpperCase(), width: v.width, binary: bits, setBitPositionsFromLeastSignificant: setBits, setBitCount: setBits.length, clearBitCount: v.width - setBits.length, mask: bits.replace(/0/g, "·").replace(/1/g, "1"), note: "비트 위치는 가장 오른쪽(최하위 비트)을 0번으로 계산합니다." };
}

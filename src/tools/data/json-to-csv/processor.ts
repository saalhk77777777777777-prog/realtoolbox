/** TOOLBOX v0.9.0 — JSON to CSV processor */
import type { ToolError } from "../../../core/types.ts";
export interface Input { text: string; }
export function validate(input: unknown): ToolError | null {
  const v = input as Partial<Input> | null;
  if (!v || typeof v.text !== "string") return { code: "USER_INPUT", what: "JSON 입력이 필요합니다.", why: "텍스트 입력이 없습니다.", how: "JSON 배열을 붙여 넣으세요." };
  try { const x = JSON.parse(v.text); if (!Array.isArray(x) || x.length === 0 || x.some(a => !a || typeof a !== "object" || Array.isArray(a))) throw new Error(); }
  catch { return { code: "USER_INPUT", what: "JSON 배열이 올바르지 않습니다.", why: "객체 배열만 CSV로 변환할 수 있습니다.", how: "예: [{\"name\":\"Tabi\",\"age\":16}]" }; }
  return null;
}
function escapeCsv(value: unknown): string { const s = value == null ? "" : (typeof value === "string" ? value : JSON.stringify(value)); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
export async function process(input: Input): Promise<{ csv: string }> {
  const rows = JSON.parse(input.text) as Record<string, unknown>[];
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  return { csv: [keys.map(escapeCsv).join(","), ...rows.map(r => keys.map(k => escapeCsv(r[k])).join(","))].join("\r\n") };
}

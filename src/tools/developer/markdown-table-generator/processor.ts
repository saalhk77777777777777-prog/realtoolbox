/** TOOLBOX v0.11.0 — Markdown Table Generator processor */
import type { ToolError } from "../../../core/types.ts";

export interface Input { text: string; delimiter: string; }
export interface Output { markdown: string; }

export function validate(input: unknown): ToolError | null {
  const v = input as Partial<Input> | null;
  if (!v || typeof v.text !== "string" || typeof v.delimiter !== "string" || v.delimiter.length !== 1) {
    return { code: "USER_INPUT", what: "입력이 올바르지 않습니다.", why: "텍스트와 한 글자 구분자가 필요합니다.", how: "예: 탭 또는 쉼표를 사용하세요." };
  }
  return null;
}

const escapeCell = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

export async function process(input: Input): Promise<Output> {
  const lines = input.text.replace(/\r\n/g, "\n").split("\n").filter((line) => line.length > 0);
  if (lines.length === 0) return { markdown: "" };
  const rows = lines.map((line) => line.split(input.delimiter).map((cell) => escapeCell(cell.trim())));
  const columns = Math.max(...rows.map((row) => row.length));
  const padded = rows.map((row) => Array.from({ length: columns }, (_, i) => row[i] ?? ""));
  const header = padded[0];
  const separator = Array.from({ length: columns }, () => "---");
  const body = padded.slice(1).map((row) => "| " + row.join(" | ") + " |").join("\n");
  return { markdown: "| " + header.join(" | ") + " |\n| " + separator.join(" | ") + " |" + (body ? "\n" + body : "") };
}

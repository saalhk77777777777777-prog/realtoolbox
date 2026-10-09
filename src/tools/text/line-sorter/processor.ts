/**
 * TOOLBOX v0.6.3 — Line Sorter
 * 텍스트 줄 정렬. dependency 0. 서버 전송 없음.
 * 옵션: 문자열, 숫자, 길이, 대소문자 무시.
 */
import type { ToolError } from "../../../core/types.ts";

export type SortMode = "string" | "number" | "length" | "caseInsensitive";

export interface LineSortInput {
  text: string;
  mode: SortMode;
  descending: boolean;
}

export interface LineSortOutput {
  result: string;
  lineCount: number;
  mode: SortMode;
}

export const MAX_LINESORT_CHARS = 1_000_000;

export function validateLineSort(input: unknown): ToolError | null {
  const v = input as Partial<LineSortInput> | null;
  if (!v || typeof v.text !== "string" || (v.mode !== "string" && v.mode !== "number" && v.mode !== "length" && v.mode !== "caseInsensitive")) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "텍스트와 정렬 모드가 필요합니다.",
      how: "텍스트를 입력하고 모드를 선택하세요.",
    };
  }
  if (v.text.length === 0) {
    return {
      code: "USER_INPUT",
      what: "텍스트가 비어 있습니다.",
      why: "빈 문자열은 정렬할 수 없습니다.",
      how: "정리할 텍스트를 입력하세요.",
    };
  }
  if (v.text.length > MAX_LINESORT_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_LINESORT_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 정렬하세요.",
    };
  }
  return null;
}

export async function processLineSort(input: LineSortInput): Promise<LineSortOutput> {
  const lines = input.text.split("\n");
  const sorted = [...lines].sort((a, b) => {
    let cmp = 0;
    if (input.mode === "string") {
      cmp = a.localeCompare(b);
    } else if (input.mode === "number") {
      cmp = Number(a) - Number(b);
    } else if (input.mode === "length") {
      cmp = a.length - b.length;
    } else if (input.mode === "caseInsensitive") {
      cmp = a.toLowerCase().localeCompare(b.toLowerCase());
    }
    return input.descending ? -cmp : cmp;
  });
  return {
    result: sorted.join("\n"),
    lineCount: sorted.length,
    mode: input.mode,
  };
}

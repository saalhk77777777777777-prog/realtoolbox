/**
 * TOOLBOX v0.6.4 — Duplicate Line Remover
 * 중복 줄 제거. dependency 0. 서버 전송 없음.
 * 옵션: 첫 항목 유지 / 마지막 항목 유지.
 */
import type { ToolError } from "../../../core/types.ts";

export type KeepMode = "first" | "last";

export interface DuplicateInput {
  text: string;
  keep: KeepMode;
}

export interface DuplicateOutput {
  result: string;
  originalCount: number;
  removedCount: number;
  keep: KeepMode;
}

export const MAX_DUPLICATE_CHARS = 1_000_000;

export function validateDuplicate(input: unknown): ToolError | null {
  const v = input as Partial<DuplicateInput> | null;
  if (!v || typeof v.text !== "string" || (v.keep !== "first" && v.keep !== "last")) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "텍스트와 유지 모드(first/last)가 필요합니다.",
      how: "텍스트를 입력하고 모드를 선택하세요.",
    };
  }
  if (v.text.length === 0) {
    return {
      code: "USER_INPUT",
      what: "텍스트가 비어 있습니다.",
      why: "빈 문자열은 처리할 수 없습니다.",
      how: "처리할 텍스트를 입력하세요.",
    };
  }
  if (v.text.length > MAX_DUPLICATE_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_DUPLICATE_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 처리하세요.",
    };
  }
  return null;
}

export async function processDuplicate(input: DuplicateInput): Promise<DuplicateOutput> {
  const lines = input.text.split("\n");
  const seen = new Set<string>();
  const result: string[] = [];
  if (input.keep === "first") {
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        result.push(line);
      }
    }
  } else {
    const lastIndex = new Map<string, number>();
    lines.forEach((line, i) => lastIndex.set(line, i));
    lines.forEach((line, i) => {
      if (lastIndex.get(line) === i) result.push(line);
    });
  }
  return {
    result: result.join("\n"),
    originalCount: lines.length,
    removedCount: lines.length - result.length,
    keep: input.keep,
  };
}

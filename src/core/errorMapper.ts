/**
 * TOOLBOX v0.1.0 — Error Mapper (§44)
 * 기술적 stack trace 대신 [무슨 문제 → 왜 → 어떻게 해결] 순서로 표시.
 */
import type { ToolError } from "./types.ts";

export function toUserMessage(error: ToolError): string {
  return `${error.what}\n원인: ${error.why}\n해결: ${error.how}`;
}

export function internalError(why: string): ToolError {
  return {
    code: "INTERNAL",
    what: "예상하지 못한 오류가 발생했습니다.",
    why,
    how: "페이지를 새로고침하고 다시 시도하세요. 반복되면 파일 크기를 줄여보세요.",
  };
}

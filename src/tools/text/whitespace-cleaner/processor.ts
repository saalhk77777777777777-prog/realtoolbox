/**
 * TOOLBOX v0.6.2 — Whitespace Cleaner
 * 텍스트 공백 정리. dependency 0. 서버 전송 없음.
 * 옵션: trim, 다중 공백 제거, 빈 줄 제거, 탭 정규화, CRLF/LF 정규화.
 */
import type { ToolError } from "../../../core/types.ts";

export interface WhitespaceInput {
  text: string;
  trim: boolean;
  collapseSpaces: boolean;
  removeEmptyLines: boolean;
  normalizeTabs: boolean;
  normalizeNewlines: boolean;
}

export interface WhitespaceOutput {
  result: string;
  originalLength: number;
  cleanedLength: number;
}

export const MAX_WHITESPACE_CHARS = 1_000_000;

export function validateWhitespace(input: unknown): ToolError | null {
  const v = input as Partial<WhitespaceInput> | null;
  if (!v || typeof v.text !== "string") {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "텍스트 문자열이 필요합니다.",
      how: "정리할 텍스트를 입력하세요.",
    };
  }
  if (v.text.length === 0) {
    return {
      code: "USER_INPUT",
      what: "텍스트가 비어 있습니다.",
      why: "빈 문자열은 정리할 수 없습니다.",
      how: "정리할 텍스트를 입력하세요.",
    };
  }
  if (v.text.length > MAX_WHITESPACE_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_WHITESPACE_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 정리하세요.",
    };
  }
  return null;
}

export async function processWhitespace(input: WhitespaceInput): Promise<WhitespaceOutput> {
  let text = input.text;
  if (input.normalizeNewlines) {
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }
  if (input.normalizeTabs) {
    text = text.replace(/\t/g, "  ");
  }
  if (input.collapseSpaces) {
    text = text.replace(/ {2,}/g, " ");
  }
  if (input.removeEmptyLines) {
    text = text.split("\n").filter((l) => l.trim() !== "").join("\n");
  }
  if (input.trim) {
    text = text.trim();
  }
  return {
    result: text,
    originalLength: input.text.length,
    cleanedLength: text.length,
  };
}

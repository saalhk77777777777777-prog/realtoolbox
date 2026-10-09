/**
 * TOOLBOX v0.6.1 — Case Converter
 * 텍스트 대소문자 변환. dependency 0. 서버 전송 없음.
 */
import type { ToolError } from "../../../core/types.ts";

export type CaseMode = "lower" | "upper" | "title" | "camel" | "pascal" | "snake" | "kebab";

export interface CaseInput {
  text: string;
  mode: CaseMode;
}

export interface CaseOutput {
  mode: CaseMode;
  result: string;
}

export const MAX_CASE_CHARS = 1_000_000;

export function validateCase(input: unknown): ToolError | null {
  const v = input as Partial<CaseInput> | null;
  if (!v || typeof v.text !== "string" || (v.mode !== "lower" && v.mode !== "upper" && v.mode !== "title" && v.mode !== "camel" && v.mode !== "pascal" && v.mode !== "snake" && v.mode !== "kebab")) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "텍스트와 변환 모드가 필요합니다.",
      how: "텍스트를 입력하고 모드를 선택하세요.",
    };
  }
  if (v.text.length === 0) {
    return {
      code: "USER_INPUT",
      what: "텍스트가 비어 있습니다.",
      why: "빈 문자열은 변환할 수 없습니다.",
      how: "변환할 텍스트를 입력하세요.",
    };
  }
  if (v.text.length > MAX_CASE_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_CASE_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 변환하세요.",
    };
  }
  return null;
}

export async function processCase(input: CaseInput): Promise<CaseOutput> {
  const words = input.text.split(/[\s_-]+/).filter(Boolean);
  let result = "";
  switch (input.mode) {
    case "lower":
      result = input.text.toLowerCase();
      break;
    case "upper":
      result = input.text.toUpperCase();
      break;
    case "title":
      result = input.text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      break;
    case "camel":
      result = words.map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join("");
      break;
    case "pascal":
      result = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
      break;
    case "snake":
      result = words.map((w) => w.toLowerCase()).join("_");
      break;
    case "kebab":
      result = words.map((w) => w.toLowerCase()).join("-");
      break;
  }
  return { mode: input.mode, result };
}

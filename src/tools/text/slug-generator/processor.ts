/**
 * TOOLBOX v0.6.5 — Slug Generator
 * 텍스트를 URL 친화적 slug로 변환. dependency 0. 서버 전송 없음.
 * Unicode 정규화 → 공백 변환 → 허용 문자 필터 → separator collapse → trim.
 */
import type { ToolError } from "../../../core/types.ts";

export interface SlugInput {
  text: string;
  separator: string;
  lowercase: boolean;
}

export interface SlugOutput {
  slug: string;
  originalLength: number;
  slugLength: number;
}

export const MAX_SLUG_CHARS = 1_000_000;

export function validateSlug(input: unknown): ToolError | null {
  const v = input as Partial<SlugInput> | null;
  if (!v || typeof v.text !== "string" || typeof v.separator !== "string" || typeof v.lowercase !== "boolean") {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "텍스트, 구분자, 소문자 여부가 필요합니다.",
      how: "텍스트를 입력하고 옵션을 선택하세요.",
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
  if (v.separator !== "-" && v.separator !== "_") {
    return {
      code: "USER_INPUT",
      what: "구분자가 올바르지 않습니다.",
      why: "구분자는 하이픈(-) 또는 밑줄(_)만 사용할 수 있습니다.",
      how: "하이픈 또는 밑줄을 선택하세요.",
    };
  }
  if (v.text.length > MAX_SLUG_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_SLUG_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 변환하세요.",
    };
  }
  return null;
}

export async function processSlug(input: SlugInput): Promise<SlugOutput> {
  let text = input.text;
  if (input.lowercase) text = text.toLowerCase();
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sep = input.separator;
  const cleaned = normalized.replace(/[^\w\s-]/g, "").trim();
  // 공백 연속 → sep, sep 연속 → sep 하나로 collapse. 선택하지 않은 구분자 문자는 보존.
  const slug = cleaned
    .split(/[\s-]+/)
    .filter(Boolean)
    .join(sep)
    .split(sep)
    .filter(Boolean)
    .join(sep);
  return {
    slug,
    originalLength: input.text.length,
    slugLength: slug.length,
  };
}

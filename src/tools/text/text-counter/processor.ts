/**
 * TOOLBOX v0.1.1 — Text Counter (§102.1)
 * 모든 수치는 입력 텍스트에서 직접 계산한다. 하드코딩 결과 없음.
 * - characters: Unicode code points ([...text].length)
 * - graphemes: Intl.Segmenter 기준 (미지원 환경은 code points + estimated 플래그)
 * - words: 공백 분리 근사치 (한국어 등에서는 근사치임을 UI에 고지)
 * - UTF-8 bytes: TextEncoder 기준
 */
import type { ToolError } from "../../../core/types.ts";

export interface TextCounterInput {
  text: string;
}

export interface TextCounterOutput {
  /** Unicode code points */
  characters: number;
  /** grapheme clusters (Intl.Segmenter) */
  graphemes: number;
  /** Segmenter 미지원 시 true (graphemes = characters fallback) */
  graphemeEstimated: boolean;
  charactersWithoutSpaces: number;
  /** 공백 분리 근사치 — 한국어에서는 단어 경계가 다르므로 근사치 */
  words: number;
  wordsApproximate: boolean;
  lines: number;
  paragraphs: number;
  utf8Bytes: number;
}

/** v0.1.1 safe mode 상한 (메모리 보호, §50) */
export const MAX_TEXT_CHARS = 1_000_000;

export function validateTextCounter(input: unknown): ToolError | null {
  const v = input as Partial<TextCounterInput> | null;
  if (!v || typeof v.text !== "string") {
    return {
      code: "USER_INPUT",
      what: "텍스트가 입력되지 않았습니다.",
      why: "입력값이 문자열이 아닙니다.",
      how: "텍스트 상자에 분석할 글을 붙여넣으세요.",
    };
  }
  if (v.text.length === 0) {
    return {
      code: "USER_INPUT",
      what: "텍스트가 비어 있습니다.",
      why: "빈 문자열은 분석할 수 없습니다.",
      how: "텍스트 상자에 분석할 글을 입력하세요.",
    };
  }
  if (v.text.length > MAX_TEXT_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_TEXT_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 분석하세요.",
    };
  }
  return null;
}

export async function processTextCounter(
  input: TextCounterInput,
): Promise<TextCounterOutput> {
  const text = input.text;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const characters = [...text].length;

  let graphemes = characters;
  let graphemeEstimated = false;
  const Segmenter =
    (globalThis as Record<string, unknown>)["Intl"] instanceof Object
      ? (Intl as unknown as Record<string, unknown>)["Segmenter"]
      : undefined;
  if (typeof Segmenter === "function") {
    try {
      const seg = new (Segmenter as new (l: string, o: object) => { segment(s: string): Iterable<unknown> })("ko", {
        granularity: "grapheme",
      });
      let n = 0;
      for (const _ of seg.segment(text)) n++;
      graphemes = n;
    } catch {
      graphemeEstimated = true;
    }
  } else {
    graphemeEstimated = true;
  }

  const withoutSpaces = text.replace(/\s/g, "");
  const charactersWithoutSpaces = [...withoutSpaces].length;

  const words = normalized.split(/\s+/).filter((w) => w.length > 0).length;

  const lines = normalized.split("\n").length;

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;

  const utf8Bytes = new TextEncoder().encode(text).length;

  return {
    characters,
    graphemes,
    graphemeEstimated,
    charactersWithoutSpaces,
    words,
    wordsApproximate: true,
    lines,
    paragraphs,
    utf8Bytes,
  };
}

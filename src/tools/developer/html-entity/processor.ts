/**
 * TOOLBOX v0.2.3 — HTML Entity Encoder / Decoder
 * 순수 텍스트 변환. innerHTML/DOMParser/eval 일체 사용 금지. dependency 0. 서버 전송 없음.
 *
 * SUPPORTED ENTITIES (이 범위를 초과 주장하지 않는다):
 * - Encode: & < > " ' → &amp; &lt; &gt; &quot; &#39; (그 외 모든 문자 그대로)
 * - Decode: 위 5종 + &nbsp;(U+00A0) + 10진/16진 수치 참조
 *
 * ENCODE POLICY:
 * - &를 먼저 치환해 다른 entity를 망가뜨리지 않는다.
 * - 이미 encoded된 입력의 재encode는 의도된 이중 encode다 (&amp; → &amp;amp;).
 * DECODE POLICY:
 * - 수치 참조: 1~0x10FFFF, 서로게이트·0 제외. 벗어나면 FILE_INVALID.
 * - 세미콜론 없는 형태(&amp 등)는 미지원 → 원문 유지.
 * - 미지원 named(&copy; &apos; 등)는 임의 변환 없이 원문 + warning (성공伪装 금지).
 * - decode → encode가 byte-for-byte 동일하다고 주장하지 않는다
 *   (예: &nbsp; → U+00A0은 encode 대상 5종이 아니라 그대로 남는다).
 */
import type { ToolError } from "../../../core/types.ts";

export type EntityDirection = "encode" | "decode";

export interface EntityInput {
  text: string;
  direction: EntityDirection;
}

export interface EntityWarning {
  type: "unsupported-entity";
  message: string;
}

export interface EntityOutput {
  direction: EntityDirection;
  result: string;
  changed: boolean;
  warnings: EntityWarning[];
}

/** v0.2.3 safe mode 상한 — 기존 텍스트 도구와 동일 기준 (§50) */
export const MAX_ENTITY_CHARS = 1_000_000;

const DECODE_NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: "\u00a0", // U+00A0 NO-BREAK SPACE (escape 표기, invisible 문자 방지)
};

export function validateEntity(input: unknown): ToolError | null {
  const v = input as Partial<EntityInput> | null;
  if (!v || typeof v.text !== "string" || (v.direction !== "encode" && v.direction !== "decode")) {
    return {
      code: "USER_INPUT",
      what: "입력 또는 방향이 올바르지 않습니다.",
      why: "텍스트 문자열과 encode/decode 방향이 필요합니다.",
      how: "텍스트를 입력하고 인코딩/디코딩을 선택하세요.",
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
  if (v.text.length > MAX_ENTITY_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_ENTITY_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 변환하세요.",
    };
  }
  return null;
}

export async function processEntity(input: EntityInput): Promise<EntityOutput> {
  if (input.direction === "encode") {
    const result = encodeEntities(input.text);
    return { direction: input.direction, result, changed: result !== input.text, warnings: [] };
  }
  const decoded = decodeEntities(input.text);
  return {
    direction: input.direction,
    result: decoded.text,
    changed: decoded.text !== input.text,
    warnings: decoded.warnings,
  };
}

/** & 먼저 치환 (순서 고정 — 다른 entity를 망가뜨리지 않음). */
export function encodeEntities(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface DecodeResult {
  text: string;
  warnings: EntityWarning[];
}

export function decodeEntities(text: string): DecodeResult {
  // 수치 참조 형태(&#...;)인데 10진/16진 유효 형식이 아니면 즉시 오류 (전체 탐색).
  // (&copy; 같은 named 미지원은 아래에서 warning + 원문 유지 — 수치 시도는 엄격히 거부)
  for (const m of text.matchAll(/&#[^;\s]*;/g)) {
    if (!/^&#\d+;$/.test(m[0]) && !/^&#[xX][0-9a-fA-F]+;$/.test(m[0])) {
      throw malformed(m[0]);
    }
  }
  const warnings: EntityWarning[] = [];
  const seen = new Set<string>();
  const out = text.replace(
    /&(?:#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);|&(?:#\d+|#[xX][0-9a-fA-F]*|[a-zA-Z][a-zA-Z0-9]*)(?![\w;])/g,
    (m) => {
      // 세미콜론 있는 완전형
      if (m.endsWith(";")) {
        const body = m.slice(1, -1);
        if (body in DECODE_NAMED) return DECODE_NAMED[body]!;
        if (body.startsWith("#")) return decodeNumeric(body);
        if (!seen.has(m)) {
          seen.add(m);
          warnings.push({
            type: "unsupported-entity",
            message: `지원하지 않는 entity "${m}" — 변환하지 않고 그대로 두었습니다.`,
          });
        }
        return m;
      }
      // 세미콜론 없는 불완전형 — 미지원, 원문
      if (!seen.has(m)) {
        seen.add(m);
        warnings.push({
          type: "unsupported-entity",
          message: `"${m}" — 세미콜론 없는 형태는 지원하지 않아 그대로 두었습니다.`,
        });
      }
      return m;
    },
  );
  return { text: out, warnings };
}

function decodeNumeric(body: string): string {
  // body는 "#..." 형태, 호출 전 형식이 보장됨
  const isHex = body[1] === "x" || body[1] === "X";
  const digits = isHex ? body.slice(2) : body.slice(1);
  if (digits.length === 0) throw malformed(`&#${isHex ? "x" : ""};`);
  const code = Number.parseInt(digits, isHex ? 16 : 10);
  if (!Number.isSafeInteger(code) || code <= 0 || code > 0x10ffff) {
    throw malformed(`&${body};`);
  }
  if (code >= 0xd800 && code <= 0xdfff) throw malformed(`&${body};`);
  return String.fromCodePoint(code);
}

function malformed(ref: string): ToolError {
  return {
    code: "FILE_INVALID",
    what: `잘못된 수치 참조입니다: ${ref}`,
    why: "10진/16진 숫자 형식이 아니거나 허용 코드 범위(1~U+10FFFF, 서로게이트 제외)를 벗어났습니다.",
    how: "&#65; 또는 &#x41; 같은 올바른 형태를 입력하세요.",
  };
}

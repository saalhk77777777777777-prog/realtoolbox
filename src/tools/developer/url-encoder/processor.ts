/**
 * TOOLBOX v0.1.5 — URL Encode/Decode (§101.6)
 * browser-native API만 사용. dependency 0. 출력은 입력의 순수함수.
 *
 * API 선택 근거 (실제 동작 기준):
 * - component scope (기본): encodeURIComponent — 쿼리값 등 개별 조각용.
 *   A-Za-z0-9와 -_.!~*'() 를 제외한 모든 문자(예약 문자 & = ? # + % 포함)를 이스케이프.
 * - fullUrl scope: encodeURI — 전체 URL 구조 유지.
 *   ; , / ? : @ & = + $ - _ . ! ~ * ' ( ) # 는 유지하고 공백·한글 등만 이스케이프.
 * - decode: decodeURIComponent로 통일. encodeURI 결과물도 해독 가능하고,
 *   decodeURI는 %26 같은 시퀀스를 남겨 왕복이 깨지므로 사용하지 않는다.
 * - decode 실패(URIError)는 FILE_INVALID로 보고하고 원문을 반환하지 않는다.
 */
import type { ToolError } from "../../../core/types.ts";

export type UrlMode = "encode" | "decode";
export type UrlScope = "component" | "fullUrl";

export interface UrlCoderInput {
  text: string;
  mode: UrlMode;
  scope: UrlScope;
}

export interface UrlCoderOutput {
  mode: UrlMode;
  scope: UrlScope;
  /** 사용된 실제 API (검증·문서용) */
  api: "encodeURIComponent" | "encodeURI" | "decodeURIComponent";
  inputLength: number;
  output: string;
  outputBytes: number;
}

/** v0.1.5 safe mode 상한 — 기존 텍스트 도구와 동일 기준 (§50) */
export const MAX_URL_CHARS = 1_000_000;

export function validateUrlCoder(input: unknown): ToolError | null {
  const v = input as Partial<UrlCoderInput> | null;
  if (
    !v ||
    typeof v.text !== "string" ||
    (v.mode !== "encode" && v.mode !== "decode") ||
    (v.scope !== "component" && v.scope !== "fullUrl")
  ) {
    return {
      code: "USER_INPUT",
      what: "입력, 모드 또는 범위가 올바르지 않습니다.",
      why: "텍스트 문자열, encode/decode 모드, component/fullUrl 범위가 필요합니다.",
      how: "텍스트를 입력하고 변환 모드와 범위를 선택하세요.",
    };
  }
  if (v.text.length === 0) {
    return {
      code: "USER_INPUT",
      what: "텍스트가 비어 있습니다.",
      why: "빈 문자열은 변환할 수 없습니다.",
      how: "변환할 텍스트 또는 URL을 입력하세요.",
    };
  }
  if (v.text.length > MAX_URL_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_URL_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 변환하세요.",
    };
  }
  return null;
}

export async function processUrlCoder(input: UrlCoderInput): Promise<UrlCoderOutput> {
  let output: string;
  let api: UrlCoderOutput["api"];
  if (input.mode === "encode") {
    if (input.scope === "component") {
      api = "encodeURIComponent";
      output = encodeURIComponent(input.text);
    } else {
      api = "encodeURI";
      output = encodeURI(input.text);
    }
  } else {
    api = "decodeURIComponent";
    try {
      output = decodeURIComponent(input.text);
    } catch {
      throw {
        code: "FILE_INVALID",
        what: "URL 디코딩에 실패했습니다.",
        why: "잘못된 percent-encoding이 포함되어 있습니다 (예: 단독 %, % 뒤 16진수 2자리 아님).",
        how: "인코딩 결과물을 그대로 붙여넣었는지 확인하세요. 원문은 반환하지 않습니다.",
      };
    }
  }
  return {
    mode: input.mode,
    scope: input.scope,
    api,
    inputLength: input.text.length,
    output,
    outputBytes: new TextEncoder().encode(output).length,
  };
}

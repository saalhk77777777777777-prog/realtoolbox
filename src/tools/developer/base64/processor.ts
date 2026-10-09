/**
 * TOOLBOX v0.1.3 — Base64 Encode/Decode (§101.5 Text mode)
 * browser-native API 우선: TextEncoder/TextDecoder + btoa/atob. dependency 0.
 * 출력은 입력의 순수함수다. 하드코딩 결과 없음.
 * Binary(File) 모드는 범위 외 — 다음 Atomic Task에서 input contract 확장으로 분리.
 */
import type { ToolError } from "../../../core/types.ts";

export type Base64Mode = "encode" | "decode";

export interface Base64Input {
  text: string;
  mode: Base64Mode;
}

export interface Base64Output {
  mode: Base64Mode;
  /** 입력 문자열 길이 (UTF-16 units, 검증용 표시) */
  inputLength: number;
  output: string;
  /** 출력 UTF-8 바이트 */
  outputBytes: number;
}

/** v0.1.3 safe mode 상한 — Text Counter와 동일 기준 (§50) */
export const MAX_BASE64_CHARS = 1_000_000;

export function validateBase64(input: unknown): ToolError | null {
  const v = input as Partial<Base64Input> | null;
  if (!v || typeof v.text !== "string" || (v.mode !== "encode" && v.mode !== "decode")) {
    return {
      code: "USER_INPUT",
      what: "입력 또는 모드가 올바르지 않습니다.",
      why: "텍스트 문자열과 encode/decode 모드가 필요합니다.",
      how: "텍스트를 입력하고 인코딩/디코딩 중 하나를 선택하세요.",
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
  if (v.text.length > MAX_BASE64_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_BASE64_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 변환하세요.",
    };
  }
  if (v.mode === "decode") {
    const stripped = v.text.replace(/\s/g, "");
    if (stripped.length === 0) {
      return {
        code: "USER_INPUT",
        what: "디코딩할 내용이 없습니다.",
        why: "공백만 입력되었습니다.",
        how: "Base64 문자열을 입력하세요.",
      };
    }
    if (!isStrictBase64(stripped)) {
      return {
        code: "FILE_INVALID",
        what: "유효한 Base64 문자열이 아닙니다.",
        why: "허용 문자(A–Z, a–z, 0–9, +, /, = 패딩) 형식을 만족하지 않습니다.",
        how: "인코딩 결과물을 그대로 붙여넣었는지 확인하세요. URL-safe(-, _) 형식은 지원하지 않습니다.",
      };
    }
  }
  return null;
}

function isStrictBase64(s: string): boolean {
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
}

export async function processBase64(input: Base64Input): Promise<Base64Output> {
  const output = input.mode === "encode" ? encodeText(input.text) : decodeText(input.text);
  return {
    mode: input.mode,
    inputLength: input.text.length,
    output,
    outputBytes: new TextEncoder().encode(output).length,
  };
}

/** UTF-8 텍스트 → Base64 (chunked, 대용량 스택 보호) */
function encodeText(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Base64 → UTF-8 텍스트 (잘못된 바이트열은 FILE_INVALID) */
function decodeText(text: string): string {
  const stripped = text.replace(/\s/g, "");
  let binary: string;
  try {
    binary = atob(stripped);
  } catch {
    throw {
      code: "FILE_INVALID",
      what: "Base64 디코딩에 실패했습니다.",
      why: "패딩 또는 길이가 올바르지 않습니다.",
      how: "인코딩 결과물을 그대로 붙여넣었는지 확인하세요.",
    };
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw {
      code: "FILE_INVALID",
      what: "UTF-8 텍스트로 해석할 수 없습니다.",
      why: "디코딩된 바이트가 유효한 UTF-8이 아닙니다.",
      how: "텍스트를 인코딩한 Base64가 맞는지 확인하세요.",
    };
  }
}

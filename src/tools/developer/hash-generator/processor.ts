/**
 * TOOLBOX v0.1.9 — Hash Generator (§101.7 Text mode)
 * browser-native Web Crypto API (crypto.subtle.digest)만 사용. dependency 0.
 * 서버/API로 입력을 전송하지 않는다. 출력은 입력의 순수함수(고정벡터는 테스트 기대값).
 *
 * ALGORITHM POLICY (표준 동작 기준):
 * - SHA-256 (기본), SHA-384, SHA-512: 표준 안전 선택.
 * - SHA-1: 호환용으로만 제공. 충돌 취약하므로 신규 용도 금지 — UI에서 경고.
 * - MD5 등 그 외: Web Crypto 미지원 → 라이브러리를 추가하지 않고 UNSUPPORTED로 거부.
 * - crypto.subtle 부재(비-secure context 등) → BROWSER_LIMIT.
 *
 * OUTPUT POLICY: 정본은 소문자 hex 전체. 대문자는 표시 옵션(값 동일, 잘라서 표시 금지).
 * MEMORY POLICY: TextEncoder 1회 + digest 단일 패스. 100만자 상한 (§50).
 */
import type { ToolError } from "../../../core/types.ts";

export type HashAlgorithm = "SHA-256" | "SHA-384" | "SHA-512" | "SHA-1";

export const SUPPORTED_ALGORITHMS: readonly HashAlgorithm[] = [
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHA-1",
];

export const WEAK_ALGORITHMS: readonly HashAlgorithm[] = ["SHA-1"];

export interface HashInput {
  text: string;
  algorithm: HashAlgorithm | string;
}

export interface HashOutput {
  algorithm: HashAlgorithm;
  /** 정본: 소문자 hex 전체 */
  hex: string;
  /** hex 문자 길이 (알고리즘별 고정: 64/96/128/40) */
  hexLength: number;
  /** 입력 UTF-8 바이트 */
  inputBytes: number;
  weakWarning: boolean;
}

/** v0.1.9 safe mode 상한 — 기존 텍스트 도구와 동일 기준 (§50) */
export const MAX_HASH_CHARS = 1_000_000;

export function validateHash(input: unknown): ToolError | null {
  const v = input as Partial<HashInput> | null;
  if (!v || typeof v.text !== "string" || typeof v.algorithm !== "string") {
    return {
      code: "USER_INPUT",
      what: "입력 또는 알고리즘이 올바르지 않습니다.",
      why: "텍스트 문자열과 알고리즘 선택이 필요합니다.",
      how: "텍스트를 입력하고 알고리즘을 선택하세요.",
    };
  }
  if (v.text.length === 0) {
    return {
      code: "USER_INPUT",
      what: "텍스트가 비어 있습니다.",
      why: "빈 입력은 처리하지 않습니다 (다른 TOOLBOX 텍스트 도구와 동일한 정책).",
      how: "해시할 텍스트를 입력하세요.",
    };
  }
  if (v.text.length > MAX_HASH_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_HASH_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 해시하세요.",
    };
  }
  if (!(SUPPORTED_ALGORITHMS as readonly string[]).includes(v.algorithm)) {
    return {
      code: "UNSUPPORTED",
      what: `지원하지 않는 알고리즘입니다: ${v.algorithm}`,
      why: "Web Crypto 표준이 제공하는 SHA-1/SHA-256/SHA-384/SHA-512만 지원합니다. MD5 등은 별도 라이브러리 없이 제공할 수 없습니다.",
      how: "SHA-256(권장), SHA-384, SHA-512 중 선택하세요.",
    };
  }
  return null;
}

export async function processHash(input: HashInput): Promise<HashOutput> {
  const subtle = (globalThis as Record<string, unknown>)["crypto"] as
    | { subtle?: { digest(a: string, d: BufferSource): Promise<ArrayBuffer> } }
    | undefined;
  if (!subtle?.subtle) {
    throw {
      code: "BROWSER_LIMIT",
      what: "Web Crypto API를 사용할 수 없습니다.",
      why: "crypto.subtle은 secure context(HTTPS/localhost)에서만 동작합니다.",
      how: "HTTPS 또는 localhost에서 접속하세요.",
    };
  }
  const algorithm = input.algorithm as HashAlgorithm;
  const bytes = new TextEncoder().encode(input.text);
  let digest: ArrayBuffer;
  try {
    digest = await subtle.subtle.digest(algorithm, bytes);
  } catch {
    throw {
      code: "BROWSER_LIMIT",
      what: `${algorithm} 연산을 시작할 수 없습니다.`,
      why: "브라우저가 해당 알고리즘 digest를 거부했습니다.",
      how: "최신 브라우저에서 다시 시도하세요.",
    };
  }
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return {
    algorithm,
    hex,
    hexLength: hex.length,
    inputBytes: bytes.length,
    weakWarning: (WEAK_ALGORITHMS as readonly string[]).includes(algorithm),
  };
}

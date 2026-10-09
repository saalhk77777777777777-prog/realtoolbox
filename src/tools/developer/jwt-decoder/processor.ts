/**
 * TOOLBOX v0.2.5 — JWT Decoder (디코딩 전용, 서명 검증 없음)
 * Base64URL helper는 JWT 내부 로컬 함수다. Base64 Tool·Core를 수정하지 않는다.
 * dependency 0. 서버 전송·fetch·저장 없음. 출력은 입력의 순수함수.
 *
 * SECURITY POLICY (UI·FAQ·manifest와 동일):
 * - "디코딩은 서명 검증이 아닙니다." 유효/안전/인증성공 표현 전면 금지.
 * - 서명 빈 문자열: invalid 아님. 구조 디코딩 + signatureEmpty 경고.
 * - alg 값은 표시만 한다 (whitelist로 파싱 가능 여부 판단 없음). alg:none은 경고.
 * - exp 미래 ≠ 유효. iss/sub/aud 신뢰 판단 없음. 시간 claim은 UTC 보조 표시만.
 * - 결과 렌더링은 textContent/textarea.value로만 (XSS: payload 내 script 문자열 실행 금지).
 */
import type { ToolError } from "../../../core/types.ts";

export interface JwtInput {
  text: string;
}

export interface JwtTimeClaim {
  /** 원본 숫자 (없으면 표시 안 함) */
  value?: number;
  /** UTC 보조 표시 (숫자·범위 정상일 때만) */
  utc?: string;
}

export interface JwtMetadata {
  algorithm?: string;
  type?: string;
  keyId?: string;
  issuer?: string;
  subject?: string;
  audience?: unknown;
  issuedAt?: JwtTimeClaim;
  expiration?: JwtTimeClaim;
  notBefore?: JwtTimeClaim;
  jwtId?: string;
}

export interface JwtOutput {
  valid: true;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** 서명 hex (빈 서명이면 "") */
  signatureHex: string;
  signatureBytes: number;
  /** 빈 서명 경고 플래그 */
  signatureEmpty: boolean;
  metadata: JwtMetadata;
}

/** v0.2.5 상한 — 기존 텍스트 도구와 일관되게 100만자 (§15) */
export const MAX_JWT_CHARS = 1_000_000;

export function validateJwt(input: unknown): ToolError | null {
  const v = input as Partial<JwtInput> | null;
  if (!v || typeof v.text !== "string") {
    return {
      code: "USER_INPUT",
      what: "JWT가 입력되지 않았습니다.",
      why: "입력값이 문자열이 아닙니다.",
      how: "디코딩할 JWT를 붙여넣으세요.",
    };
  }
  if (v.text.trim().length === 0) {
    return {
      code: "USER_INPUT",
      what: "JWT가 비어 있습니다.",
      why: "빈 문자열은 디코딩할 수 없습니다.",
      how: "디코딩할 JWT를 붙여넣으세요.",
    };
  }
  if (v.text.length > MAX_JWT_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `JWT가 너무 깁니다 (최대 ${MAX_JWT_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "토큰 값을 확인하고 다시 붙여넣으세요.",
    };
  }
  return null;
}

export async function processJwt(input: JwtInput): Promise<JwtOutput> {
  const token = input.text.trim();
  const segments = token.split(".");
  if (segments.length !== 3) {
    throw segmentError(
      `JWT는 3개 segment여야 합니다 (현재 ${segments.length}개).`,
      "JWS Compact Serialization 형태(header.payload.signature)가 아닙니다.",
    );
  }
  const [hSeg, pSeg, sSeg] = segments as [string, string, string];
  if (hSeg === "" || pSeg === "") {
    throw segmentError(
      "Header 또는 Payload segment가 비어 있습니다.",
      "빈 segment는 디코딩할 수 없습니다.",
    );
  }
  const header = decodeJsonSegment(hSeg, "Header");
  const payload = decodeJsonSegment(pSeg, "Payload");
  const sig = decodeSignatureSegment(sSeg);
  return {
    valid: true,
    header,
    payload,
    signatureHex: sig.hex,
    signatureBytes: sig.bytes,
    signatureEmpty: sSeg === "",
    metadata: buildMetadata(header, payload),
  };
}

function segmentError(what: string, why: string): ToolError {
  return {
    code: "FILE_INVALID",
    what,
    why,
    how: "header.payload.signature 형태의 JWT를 붙여넣으세요. 서명 검증이 아니라 구조 디코딩만 수행합니다.",
  };
}

/** Base64URL → bytes (JWT 내부 helper. padding 복원, -_ 변환). */
export function base64UrlToBytes(seg: string, name: string): Uint8Array {
  if (!/^[A-Za-z0-9\-_]*$/.test(seg)) {
    throw segmentError(
      `${name} Base64URL이 깨졌습니다.`,
      "허용 문자(A–Z, a–z, 0–9, -, _) 이외가 포함되어 있습니다.",
    );
  }
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw segmentError(`${name} Base64URL이 깨졌습니다.`, "길이·패딩이 올바르지 않습니다.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToText(bytes: Uint8Array, name: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw segmentError(`${name} UTF-8이 깨졌습니다.`, "유효한 UTF-8 바이트가 아닙니다.");
  }
}

function decodeJsonSegment(seg: string, name: string): Record<string, unknown> {
  const text = bytesToText(base64UrlToBytes(seg, name), name);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw segmentError(`${name} JSON이 깨졌습니다.`, "디코딩된 내용이 JSON 객체가 아닙니다.");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw segmentError(`${name} JSON이 깨졌습니다.`, "최상위가 JSON 객체가 아닙니다.");
  }
  return value as Record<string, unknown>;
}

function decodeSignatureSegment(seg: string): { hex: string; bytes: number } {
  if (seg === "") return { hex: "", bytes: 0 }; // 정책: 빈 서명은 경고로 처리 (invalid 아님)
  const bytes = base64UrlToBytes(seg, "Signature");
  return {
    hex: [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""),
    bytes: bytes.length,
  };
}

function strField(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function timeField(payload: Record<string, unknown>, key: string): JwtTimeClaim | undefined {
  const v = payload[key];
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const ms = v * 1000;
  if (Math.abs(ms) > 8.64e15) return { value: v }; // 범위 밖: 원본만, 날짜 변환 없음
  return { value: v, utc: new Date(ms).toISOString() };
}

function buildMetadata(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
): JwtMetadata {
  const meta: JwtMetadata = {};
  const alg = strField(header, "alg");
  const typ = strField(header, "typ");
  const kid = strField(header, "kid");
  if (alg !== undefined) meta.algorithm = alg;
  if (typ !== undefined) meta.type = typ;
  if (kid !== undefined) meta.keyId = kid;
  const iss = strField(payload, "iss");
  const sub = strField(payload, "sub");
  const jti = strField(payload, "jti");
  if (iss !== undefined) meta.issuer = iss;
  if (sub !== undefined) meta.subject = sub;
  if (jti !== undefined) meta.jwtId = jti;
  if ("aud" in payload) meta.audience = payload["aud"];
  const iat = timeField(payload, "iat");
  const exp = timeField(payload, "exp");
  const nbf = timeField(payload, "nbf");
  if (iat) meta.issuedAt = iat;
  if (exp) meta.expiration = exp;
  if (nbf) meta.notBefore = nbf;
  return meta;
}

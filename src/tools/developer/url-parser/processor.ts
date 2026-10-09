/**
 * TOOLBOX v0.2.4 — URL Parser
 * 표준 new URL()만 사용. 정규식 자작 파서 없음. dependency 0. 서버 전송 없음.
 * URL Parser는 parser이지 navigation tool이 아니다 — fetch·이동·링크 생성 없음.
 *
 * POLICY:
 * - Absolute URL만 지원 (상대 URL은 base 없이는 거부, 정책 A).
 * - 실행 scheme(javascript:/data:/vbscript:, 대소문자 무시)은 명시적 거부.
 * - canonicalization을 숨기지 않는다: input(원문 trim)과 href(정규화)를 병기.
 * - password는 출력에 포함하지 않는다. 마스킹 표시 + 경고만 제공한다.
 * - searchParams는 순서·중복·빈값 보존 (URLSearchParams 표준: +는 공백으로 디코드됨).
 * - 입력 URL을 임의로 encode/decode하지 않는다. API 반환값을 그대로 사용.
 * - analytics에는 URL·query·hash를 절대 포함하지 않는다 (tool id + 성공/실패만).
 */
import type { ToolError } from "../../../core/types.ts";

export interface UrlParserInput {
  text: string;
}

export interface QueryPair {
  key: string;
  value: string;
}

export interface UrlParserOutput {
  valid: true;
  /** trim된 원문 입력 */
  input: string;
  /** 표준 canonicalization 적용 결과 */
  href: string;
  protocol: string;
  username: string;
  /** 실제 password 미포함. 존재 시 마스킹 문자열, 없으면 "" */
  passwordMasked: string;
  hasCredentials: boolean;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  searchParams: QueryPair[];
}

/** v0.2.4 상한 — URL은 길 수 있으나 쿼리 폭탄 방지 (§50) */
export const MAX_URL_CHARS = 10_000;

/** 실행 가능한 scheme — 파싱 결과 제공 없이 거부 */
const EXECUTABLE_SCHEMES = ["javascript:", "data:", "vbscript:"];

export function validateUrlParser(input: unknown): ToolError | null {
  const v = input as Partial<UrlParserInput> | null;
  if (!v || typeof v.text !== "string") {
    return {
      code: "USER_INPUT",
      what: "URL이 입력되지 않았습니다.",
      why: "입력값이 문자열이 아닙니다.",
      how: "분석할 absolute URL을 입력하세요 (예: https://example.com/path).",
    };
  }
  if (v.text.trim().length === 0) {
    return {
      code: "USER_INPUT",
      what: "URL이 비어 있습니다.",
      why: "빈 문자열은 분석할 수 없습니다.",
      how: "분석할 absolute URL을 입력하세요.",
    };
  }
  if (v.text.length > MAX_URL_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `URL이 너무 깁니다 (최대 ${MAX_URL_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "URL을 줄여서 입력하세요.",
    };
  }
  return null;
}

export async function processUrlParser(input: UrlParserInput): Promise<UrlParserOutput> {
  const text = input.text.trim();
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw {
      code: "FILE_INVALID",
      what: "유효한 absolute URL이 아닙니다.",
      why: "상대 URL(/path 등)은 base 없이는 해석할 수 없고, scheme이 없거나 형식이 깨졌습니다.",
      how: "https://로 시작하는 전체 주소를 입력하세요. 상대 경로는 지원하지 않습니다.",
    } as ToolError;
  }
  if (EXECUTABLE_SCHEMES.includes(url.protocol.toLowerCase())) {
    throw {
      code: "UNSUPPORTED",
      what: `실행 가능한 scheme은 분석하지 않습니다: ${url.protocol}`,
      why: "javascript:/data: 등은 실행 대상이 될 수 있어 결과 제공 대상에서 제외합니다.",
      how: "http/https 등 일반 웹 주소를 입력하세요.",
    } as ToolError;
  }
  const searchParams: QueryPair[] = [];
  url.searchParams.forEach((value, key) => {
    searchParams.push({ key, value });
  });
  const hasCredentials = url.username !== "" || url.password !== "";
  return {
    valid: true,
    input: text,
    href: url.href,
    protocol: url.protocol,
    username: url.username,
    passwordMasked: url.password !== "" ? "••••••" : "",
    hasCredentials,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    origin: url.origin,
    searchParams,
  };
}

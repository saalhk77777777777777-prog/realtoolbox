/** TOOLBOX v0.17.0 — cURL Request Builder processor. */
import type { ToolError } from "../../../core/types.ts";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface RequestSpec {
  method: HttpMethod;
  url: string;
  headers: Array<{ name: string; value: string }>;
  body: string;
  includeBody: boolean;
}

export interface RequestOutput extends RequestSpec {
  curl: string;
  fetch: string;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const MAX_CHARS = 200_000;

export function validate(input: unknown): ToolError | null {
  if (!input || typeof input !== "object") {
    return { code: "USER_INPUT", what: "요청 설정이 없습니다.", why: "입력 데이터가 비어 있습니다.", how: "HTTP 메서드와 URL을 입력하세요." };
  }
  const value = input as Partial<RequestSpec>;
  if (typeof value.url !== "string" || !value.url.trim()) {
    return { code: "USER_INPUT", what: "URL을 입력하세요.", why: "요청 대상 주소가 없습니다.", how: "https://api.example.com/items 같은 절대 URL을 입력하세요." };
  }
  if (value.url.length > 8_000) {
    return { code: "USER_INPUT", what: "URL이 너무 깁니다.", why: "URL은 8,000자 이하여야 합니다.", how: "주소를 줄여 다시 입력하세요." };
  }
  try {
    const parsed = new URL(value.url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw Error("scheme");
    if (parsed.username || parsed.password) {
      return { code: "USER_INPUT", what: "URL에 계정 정보가 포함되어 있습니다.", why: "명령어 출력에 비밀번호가 노출될 수 있습니다.", how: "URL에서 사용자 이름과 비밀번호를 제거하고 별도 인증 헤더를 사용하세요." };
    }
  } catch {
    return { code: "USER_INPUT", what: "올바른 HTTP(S) URL이 아닙니다.", why: "URL 형식이 잘못되었거나 지원하지 않는 프로토콜입니다.", how: "https:// 또는 http:// 로 시작하는 절대 URL을 입력하세요." };
  }
  if (typeof value.method !== "string" || !METHODS.includes(value.method as HttpMethod)) {
    return { code: "USER_INPUT", what: "지원하지 않는 HTTP 메서드입니다.", why: "메서드가 허용 목록에 없습니다.", how: METHODS.join(", ") + " 중 하나를 선택하세요." };
  }
  if (!Array.isArray(value.headers) || value.headers.length > 100) {
    return { code: "USER_INPUT", what: "헤더 목록이 올바르지 않습니다.", why: "헤더는 배열이며 최대 100개까지 허용됩니다.", how: "헤더 목록을 확인하세요." };
  }
  if (typeof value.body !== "string" || value.body.length > MAX_CHARS) {
    return { code: "USER_INPUT", what: "요청 본문이 너무 큽니다.", why: "본문은 200,000자 이하여야 합니다.", how: "본문을 줄이세요." };
  }
  for (const header of value.headers) {
    if (!header || typeof header.name !== "string" || typeof header.value !== "string") {
      return { code: "USER_INPUT", what: "헤더 형식이 올바르지 않습니다.", why: "각 헤더에는 이름과 값이 필요합니다.", how: "이름: 값 형식으로 입력하세요." };
    }
    if (!header.name.trim() || /[\r\n:]/.test(header.name) || /[\r\n]/.test(header.value)) {
      return { code: "USER_INPUT", what: "헤더에 사용할 수 없는 문자가 있습니다.", why: "헤더 이름/값에 줄바꿈 또는 잘못된 구분자가 있습니다.", how: "헤더 이름의 콜론과 줄바꿈을 제거하세요." };
    }
  }
  return null;
}

function shellQuote(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

function jsQuote(value: string): string {
  return JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function process(input: unknown): RequestOutput {
  const error = validate(input);
  if (error) throw Error(error.what + " " + error.how);
  const value = input as RequestSpec;
  const url = value.url.trim();
  const headers = value.headers.filter((header) => header.name.trim()).map((header) => ({ name: header.name.trim(), value: header.value }));
  const includeBody = value.includeBody && value.method !== "GET" && value.method !== "HEAD";
  const curlParts = ["curl", "--request", shellQuote(value.method), "--url", shellQuote(url)];
  for (const header of headers) curlParts.push("--header", shellQuote(header.name + ": " + header.value));
  if (includeBody && value.body.length) curlParts.push("--data-raw", shellQuote(value.body));
  const fetchOptions: Record<string, unknown> = { method: value.method };
  if (headers.length) fetchOptions.headers = Object.fromEntries(headers.map((header) => [header.name, header.value]));
  if (includeBody && value.body.length) fetchOptions.body = value.body;
  const fetchCode = "const response = await fetch(" + jsQuote(url) + ", " + JSON.stringify(fetchOptions, null, 2) + ");\n" +
    "const responseText = await response.text();\n" +
    "console.log({ status: response.status, ok: response.ok, body: responseText });";
  return { method: value.method, url, headers, body: value.body, includeBody, curl: curlParts.join(" "), fetch: fetchCode };
}

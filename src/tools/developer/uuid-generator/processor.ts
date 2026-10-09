/**
 * TOOLBOX v0.2.2 — UUID Generator
 * Web Crypto CSPRNG만 사용. Math.random() 금지. dependency 0. 서버 전송 없음.
 * 생성 결과를 저장·전송하지 않으며 analytics에는 개수만 기록한다 (값 기록 금지).
 *
 * SUPPORTED VERSIONS:
 * - v4 (기본): crypto.randomUUID() 1순위. 부재 시 getRandomValues 수동 구성(fallback도 CSPRNG).
 * - v7 (RFC 9562): unix_ts_ms(48bit) + ver(0111) + rand(12bit) + var(10) + rand(62bit)를
 *   getRandomValues로 구성. 시간 순서는 보장하지 않는다 (동일 ms 내 랜덤부로 역전 가능).
 * - v1/v3/v5/NIL/기타: 지원하지 않음 → UNSUPPORTED로 명시적 거부 (억지 구현 없음).
 */
import type { ToolError } from "../../../core/types.ts";

export type UuidVersion = "v4" | "v7";

export const SUPPORTED_VERSIONS: readonly UuidVersion[] = ["v4", "v7"];

export interface UuidInput {
  version: UuidVersion | string;
  count: number;
}

export interface UuidOutput {
  version: UuidVersion;
  count: number;
  uuids: string[];
}

/** DOM·클립보드 폭증 방지 상한 (설계 v0.2.0: 1000 → v0.2.2에서 100으로 축소, 목록 렌더링 기준) */
export const MAX_UUID_COUNT = 100;

export function validateUuid(input: unknown): ToolError | null {
  const v = input as Partial<UuidInput> | null;
  if (!v || typeof v.version !== "string" || typeof v.count !== "number") {
    return {
      code: "USER_INPUT",
      what: "버전 또는 개수가 올바르지 않습니다.",
      why: "UUID 버전(v4/v7)과 생성 개수(숫자)가 필요합니다.",
      how: "버전을 선택하고 1~100 사이의 개수를 입력하세요.",
    };
  }
  if (!(SUPPORTED_VERSIONS as readonly string[]).includes(v.version)) {
    return {
      code: "UNSUPPORTED",
      what: `지원하지 않는 UUID 버전입니다: ${v.version}`,
      why: "v4와 v7만 제공한다. v1(MAC 노출)·NIL은 범위 외이며 억지로 만들지 않는다.",
      how: "v4(무작위) 또는 v7(시간순)을 선택하세요.",
    };
  }
  if (!Number.isInteger(v.count) || v.count < 1 || v.count > MAX_UUID_COUNT) {
    return {
      code: "USER_INPUT",
      what: `개수는 1~${MAX_UUID_COUNT} 사이의 정수여야 합니다.`,
      why: `입력값 ${String(v.count)}이 범위를 벗어났습니다.`,
      how: `1~${MAX_UUID_COUNT} 사이의 정수를 입력하세요.`,
    };
  }
  return null;
}

export async function processUuid(input: UuidInput): Promise<UuidOutput> {
  const version = input.version as UuidVersion;
  const uuids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    uuids.push(version === "v4" ? generateV4() : generateV7());
  }
  return { version, count: uuids.length, uuids };
}

function requireCspRng(): { getRandomValues: (a: Uint8Array) => void; randomUUID?: () => string } {
  const cryptoObj = (globalThis as Record<string, unknown>)["crypto"] as
    | { getRandomValues?: (a: Uint8Array) => void; randomUUID?: () => string }
    | undefined;
  if (typeof cryptoObj?.getRandomValues !== "function") {
    throw {
      code: "BROWSER_LIMIT",
      what: "안전한 난수를 생성할 수 없습니다.",
      why: "Web Crypto(getRandomValues)가 없어 Math.random 같은 약한 난수로 대체하지 않습니다.",
      how: "최신 브라우저(HTTPS/localhost)에서 사용하세요.",
    };
  }
  return cryptoObj as { getRandomValues: (a: Uint8Array) => void; randomUUID?: () => string };
}

function randomBytes(c: { getRandomValues: (a: Uint8Array) => void }, len: number): Uint8Array {
  const b = new Uint8Array(len);
  c.getRandomValues(b);
  return b;
}

const HEX = "0123456789abcdef";

function hexOf(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += HEX[b >> 4]! + HEX[b & 0xf]!;
  return s;
}

/** v4: randomUUID() 1순위, 부재 시 수동 구성 (둘 다 CSPRNG). */
export function generateV4(): string {
  const c = requireCspRng();
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = randomBytes(c, 16);
  b[6] = (b[6]! & 0x0f) | 0x40; // version 0100
  b[8] = (b[8]! & 0x3f) | 0x80; // variant 10xx
  return format16(b);
}

/** v7 (RFC 9562): 바이트 배열로 구성 — b[0..5]=unix_ts_ms, b[6] 상위=0111, b[8] 상위=10, 나머지 난수. */
export function generateV7(nowMs: number = Date.now()): string {
  const c = requireCspRng();
  const b = randomBytes(c, 16);
  const t48 = BigInt(Math.trunc(nowMs)) & 0xffffffffffffn; // 48bit 마스크 (음수·초과 방어)
  for (let k = 5; k >= 0; k--) {
    b[k] = Number((t48 >> BigInt((5 - k) * 8)) & 0xffn);
  }
  b[6] = (b[6]! & 0x0f) | 0x70; // ver 0111
  b[8] = (b[8]! & 0x3f) | 0x80; // var 10xx
  return format16(b);
}

function format16(b: Uint8Array): string {
  const h = hexOf(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

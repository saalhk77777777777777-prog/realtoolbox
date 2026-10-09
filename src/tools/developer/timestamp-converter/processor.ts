/**
 * TOOLBOX v0.1.7 — Timestamp Converter (§101.11)
 * native Date/Intl만 사용. dependency 0. 외부 API 없음. 출력은 입력의 순수함수.
 *
 * TIMEZONE POLICY (UI·에러 메시지와 일치):
 * 1. timestamp는 절대시각. 출력은 UTC ISO + KST(Asia/Seoul) + Local(브라우저 zone명 병기) 3열.
 * 2. zone 없는 날짜 입력은 사용자가 zone 셀렉터(UTC/KST/Local, 기본 UTC)로 명시. 암묵적 KST 없음.
 * 3. KST = 고정 +9 (DST 없음). Local = 로컬 wall-clock 해석으로 DST 자동 반영.
 * 4. DST 존 동작은 formatInZone(date, tz) 하나로 정의 (테스트에서 America/New_York으로 증명).
 *
 * UNIT POLICY:
 * - unit은 seconds|milliseconds|auto 중 명시. auto 규칙: 부호 제거 후 자릿수 ≤10→seconds,
 *   11~13→milliseconds, 14+→오류. 소수 포함→거부. 조용한 오변환 없음.
 */
import type { ToolError } from "../../../core/types.ts";

export type TimestampDirection = "toDate" | "toTimestamp";
export type TimestampUnit = "seconds" | "milliseconds" | "auto";
export type InputZone = "UTC" | "KST" | "local";

export interface TimestampInput {
  text: string;
  direction: TimestampDirection;
  unit: TimestampUnit;
  zone: InputZone;
}

export interface TimestampOutput {
  direction: TimestampDirection;
  /** auto 해소 후 실제 적용 단위 */
  resolvedUnit: Exclude<TimestampUnit, "auto">;
  unixSeconds: number;
  unixMilliseconds: number;
  /** 항상 UTC, ISO 8601 */
  utcIso: string;
  /** Asia/Seoul wall-clock (고정 +9) */
  kst: string;
  /** 브라우저 로컬 wall-clock */
  local: string;
  /** 브라우저 로컬 zone명 (예: Asia/Seoul) — 결과의 TZ 의존성 명시 */
  localZone: string;
}

/** 입력 문자열 상한 (timestamp/날짜 입력은 짧아야 정상) */
export const MAX_TS_INPUT = 200;
/** JS Date 표현 범위 (ms) */
const MAX_MS = 8.64e15;

export function validateTimestamp(input: unknown): ToolError | null {
  const v = input as Partial<TimestampInput> | null;
  if (
    !v ||
    typeof v.text !== "string" ||
    (v.direction !== "toDate" && v.direction !== "toTimestamp") ||
    (v.unit !== "seconds" && v.unit !== "milliseconds" && v.unit !== "auto") ||
    (v.zone !== "UTC" && v.zone !== "KST" && v.zone !== "local")
  ) {
    return {
      code: "USER_INPUT",
      what: "입력, 방향, 단위 또는 시간대가 올바르지 않습니다.",
      why: "텍스트, 변환 방향, 단위(seconds/milliseconds/auto), 시간대(UTC/KST/Local)가 필요합니다.",
      how: "변환 방향과 단위·시간대를 선택하고 값을 입력하세요.",
    };
  }
  if (v.text.trim().length === 0) {
    return {
      code: "USER_INPUT",
      what: "입력값이 비어 있습니다.",
      why: "빈 문자열은 변환할 수 없습니다.",
      how: "Unix timestamp 또는 날짜/시간을 입력하세요.",
    };
  }
  if (v.text.length > MAX_TS_INPUT) {
    return {
      code: "UNSUPPORTED",
      what: `입력값이 너무 깁니다 (최대 ${MAX_TS_INPUT}자).`,
      why: "timestamp/날짜 입력으로 볼 수 없는 길이입니다.",
      how: "값을 확인하고 다시 입력하세요.",
    };
  }
  return null;
}

export async function processTimestamp(input: TimestampInput): Promise<TimestampOutput> {
  const ms =
    input.direction === "toDate"
      ? timestampToMs(input.text, input.unit)
      : dateTextToMs(input.text, input.zone);
  const date = new Date(ms);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "local";
  return {
    direction: input.direction,
    resolvedUnit: resolveUnitForMs(input),
    unixSeconds: Math.trunc(ms / 1000),
    unixMilliseconds: ms,
    utcIso: date.toISOString(),
    kst: `${formatInZone(date, "Asia/Seoul")} (UTC+9, KST)`,
    local: formatInZone(date, localZone),
    localZone,
  };
}

function resolveUnitForMs(
  input: TimestampInput,
): Exclude<TimestampUnit, "auto"> {
  // toTimestamp 방향에서 unit은 정보 표시용이다. UI는 해당 방향에서 seconds를 보낸다.
  if (input.direction === "toTimestamp") return input.unit === "milliseconds" ? "milliseconds" : "seconds";
  if (input.unit !== "auto") return input.unit;
  const digits = input.text.trim().replace(/^[+-]/, "").length;
  return digits <= 10 ? "seconds" : "milliseconds";
}

/** timestamp 문자열 → ms. 소수·형식 오류는 거부 (조용한 변환 없음). */
function timestampToMs(text: string, unit: TimestampUnit): number {
  const t = text.trim();
  if (!/^[+-]?\d+$/.test(t)) {
    if (/^[+-]?\d*\.\d+$/.test(t) || /^\.\d+$/.test(t)) {
      throw invalid(
        "소수 timestamp는 지원하지 않습니다.",
        "정밀도(초/밀리초) 해석이 모호해집니다.",
        "정수 timestamp를 입력하세요.",
      );
    }
    throw invalid(
      "유효한 timestamp가 아닙니다.",
      "숫자(부호 허용) 형식이 아닙니다.",
      "예: 0, 1700000000, 1700000000000. 날짜는 날짜→timestamp 방향을 사용하세요.",
    );
  }
  const digits = t.replace(/^[+-]/, "").length;
  let resolved: Exclude<TimestampUnit, "auto">;
  if (unit !== "auto") {
    resolved = unit;
  } else if (digits <= 10) {
    resolved = "seconds";
  } else if (digits <= 13) {
    resolved = "milliseconds";
  } else {
    throw invalid(
      "timestamp 자릿수가 범위를 벗어났습니다.",
      `auto 규칙(≤10자리=초, 11~13자리=밀리초)으로 해석할 수 없습니다 (${digits}자리).`,
      "단위를 seconds/milliseconds로 명시하세요.",
    );
  }
  const value = Number(t);
  if (!Number.isSafeInteger(value)) {
    throw invalid(
      "timestamp가 정수 정밀도를 벗어났습니다.",
      "JavaScript 안전 정수 범위를 초과합니다.",
      "범위 내 값을 입력하세요.",
    );
  }
  const ms = resolved === "seconds" ? value * 1000 : value;
  assertMsRange(ms);
  return ms;
}

/** 날짜 문자열 → ms. zone 없는 형식은 선택된 zone의 wall-clock로 해석. */
function dateTextToMs(text: string, zone: InputZone): number {
  const t = text.trim();
  if (/^[+-]?\d+$/.test(t)) {
    throw invalid(
      "숫자만 입력되었습니다.",
      "날짜→timestamp 방향에서는 숫자(timestamp)를 해석하지 않습니다 (단위 모호).",
      "timestamp→날짜 방향을 사용하거나 ISO 날짜를 입력하세요.",
    );
  }
  // (a) offset/Z 포함 ISO → 절대시각 그대로
  if (/[zZ]$/.test(t) || /[+-]\d{2}:?\d{2}$/.test(t)) {
    const ms = Date.parse(t);
    if (Number.isNaN(ms)) throw invalidDate(t);
    assertMsRange(ms);
    return ms;
  }
  // (b) YYYY-MM-DD[ HH:mm[:ss]] → zone wall-clock
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(t);
  if (!m) throw invalidDate(t);
  const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4], m[5], m[6]].map((x) =>
    x === undefined ? 0 : Number(x),
  );
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 60) throw invalidDate(t);
  let ms: number;
  if (zone === "UTC") {
    ms = Date.UTC(y, mo - 1, d, h, mi, s);
  } else if (zone === "KST") {
    ms = Date.UTC(y, mo - 1, d, h, mi, s) - 9 * 3600_000; // KST 고정 +9, DST 없음
  } else {
    ms = new Date(y, mo - 1, d, h, mi, s).getTime(); // 로컬 해석, DST 자동 반영
  }
  if (Number.isNaN(ms)) throw invalidDate(t);
  // 존재하지 않는 날짜(예: 2024-02-30) 검출 — 왕복 검증
  const check = zone === "local" ? new Date(ms) : new Date(ms + (zone === "KST" ? 9 * 3600_000 : 0));
  const parts = zone === "local" ? localParts(check) : utcParts(check);
  if (parts.y !== y || parts.mo !== mo || parts.d !== d || parts.h !== h || parts.mi !== mi || parts.s !== s) {
    throw invalidDate(t);
  }
  assertMsRange(ms);
  return ms;
}

function utcParts(d: Date): { y: number; mo: number; d: number; h: number; mi: number; s: number } {
  return {
    y: d.getUTCFullYear(),
    mo: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: d.getUTCSeconds(),
  };
}

function localParts(d: Date): { y: number; mo: number; d: number; h: number; mi: number; s: number } {
  return {
    y: d.getFullYear(),
    mo: d.getMonth() + 1,
    d: d.getDate(),
    h: d.getHours(),
    mi: d.getMinutes(),
    s: d.getSeconds(),
  };
}

/**
 * 특정 timeZone의 wall-clock을 "YYYY-MM-DD HH:mm:ss"로.
 * DST 존도 Intl이 자동 반영하므로 이 함수가 DST 동작의 단일 정의다.
 */
export function formatInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? "??";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

function assertMsRange(ms: number): void {
  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_MS) {
    throw invalid(
      "JS Date 표현 범위를 벗어났습니다.",
      "±8.64e15ms(±275,760년) 범위를 초과합니다.",
      "범위 내 값을 입력하세요.",
    );
  }
}

function invalidDate(t: string): never {
  throw invalid(
    "날짜/시간을 해석할 수 없습니다.",
    `"${t.length > 40 ? `${t.slice(0, 40)}…` : t}" 형식을 지원하지 않습니다.`,
    "ISO 8601(예: 2024-05-01T12:00:00+09:00) 또는 YYYY-MM-DD[ HH:mm:ss] 형식을 사용하세요.",
  );
}

function invalid(what: string, why: string, how: string): { code: "FILE_INVALID"; what: string; why: string; how: string } {
  return { code: "FILE_INVALID", what, why, how };
}

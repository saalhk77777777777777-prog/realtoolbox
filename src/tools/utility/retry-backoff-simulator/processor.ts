/** TOOLBOX v0.15.0 — Retry Backoff Simulator processor. */
import type { ToolError } from "../../../core/types.ts";
export function validate(input: unknown): ToolError | null {
  const v = input as { retries?: unknown; initialDelay?: unknown; multiplier?: unknown; maxDelay?: unknown } | null;
  const retries = Number(v?.retries), initialDelay = Number(v?.initialDelay), multiplier = Number(v?.multiplier), maxDelay = Number(v?.maxDelay);
  if (!v || !Number.isInteger(retries) || retries < 0 || retries > 20) return { code: "USER_INPUT", what: "재시도 횟수는 0~20이어야 합니다.", why: "너무 큰 일정 생성을 방지합니다.", how: "0에서 20 사이의 정수를 입력하세요." };
  if (![initialDelay, multiplier, maxDelay].every(Number.isFinite) || initialDelay < 0 || initialDelay > 86400000 || multiplier < 1 || multiplier > 10 || maxDelay < 0 || maxDelay > 86400000)
    return { code: "USER_INPUT", what: "백오프 설정을 확인하세요.", why: "대기 시간은 0~24시간, 배율은 1~10이어야 합니다.", how: "유효한 숫자를 입력하세요." };
  return null;
}
export function process(input: unknown): unknown {
  const e = validate(input); if (e) throw Error(e.what + " " + e.how);
  const v = input as { retries: number; initialDelay: number; multiplier: number; maxDelay: number };
  const schedule = Array.from({ length: v.retries }, (_, index) => {
    const raw = v.initialDelay * (v.multiplier ** index);
    const delayMs = Math.min(v.maxDelay, raw);
    return { retry: index + 1, delayMs: Math.round(delayMs), delaySeconds: Math.round(delayMs) / 1000 };
  });
  const totalWaitMs = schedule.reduce((sum, item) => sum + item.delayMs, 0);
  return { retries: v.retries, schedule, totalWaitMs, totalWaitSeconds: totalWaitMs / 1000, totalWaitMinutes: totalWaitMs / 60000, note: "네트워크 요청 실행 시간과 jitter는 포함하지 않은 이론적 대기 일정입니다." };
}

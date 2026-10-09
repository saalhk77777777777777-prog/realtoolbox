/**
 * TOOLBOX v0.8.1 — Regex Tester
 * 표준 RegExp만 사용. dependency 0. 서버 전송 없음.
 *
 * REDoS POLICY (§112.17, §113.23):
 * - 패턴 500자, 텍스트 10만자, 결과 최대 1000매치에서 절단+truncated 표시.
 * - JS 메인 스레드는 선점 중단 불가 → 상한+절단으로 방어.
 * - 브라우저에서는 Worker를 750ms 후 종료해 메인 스레드 정지를 방지.
 * - 중첩 반복 및 반복되는 alternation 패턴은 실행 전 보수적으로 차단.
 * - eval/Function 사용 없음. 패턴을 코드로 실행하지 않음.
 */
import type { ToolError } from "../../../core/types.ts";

export interface RegexInput {
  pattern: string;
  flags: string;
  text: string;
}

export interface RegexMatch {
  index: number;
  match: string;
  groups: (string | undefined)[];
  namedGroups: Record<string, string>;
}

export interface RegexOutput {
  matchCount: number;
  truncated: boolean;
  matches: RegexMatch[];
  pattern: string;
  flags: string;
}

/** 상한 정책 */
export const MAX_PATTERN_CHARS = 500;
export const MAX_TEXT_CHARS = 100_000;
export const MAX_MATCHES = 1000;

/** 중첩 반복과 반복 alternation의 전형적인 ReDoS 패턴을 보수적으로 차단한다. */
export function isPotentiallyCatastrophicPattern(pattern: string): boolean {
  const stack: Array<{ hasQuantifier: boolean; hasAlternation: boolean }> = [];
  let escaped = false;
  let inCharacterClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (inCharacterClass) {
      if (ch === "]") inCharacterClass = false;
      continue;
    }
    if (ch === "[") { inCharacterClass = true; continue; }
    if (ch === "(") { stack.push({ hasQuantifier: false, hasAlternation: false }); continue; }
    if (ch === "|") {
      if (stack.length) stack[stack.length - 1].hasAlternation = true;
      continue;
    }
    if (ch === ")") {
      const group = stack.pop();
      if (!group) continue;
      const next = pattern[i + 1] ?? "";
      const quantified = next === "+" || next === "*" ||
        (next === "{" && /^\{\d+(?:,\d*)?\}/.test(pattern.slice(i + 1)));
      if (quantified && (group.hasQuantifier || group.hasAlternation)) return true;
      if (stack.length) {
        const parent = stack[stack.length - 1];
        parent.hasQuantifier ||= group.hasQuantifier;
        parent.hasAlternation ||= group.hasAlternation;
      }
      continue;
    }
    const braceQuantifier = ch === "{" && /^\{\d+(?:,\d*)?\}/.test(pattern.slice(i));
    if (ch === "+" || ch === "*" || (ch === "?" && pattern[i - 1] !== "(") || braceQuantifier) {
      if (stack.length) stack[stack.length - 1].hasQuantifier = true;
    }
  }
  return false;
}
const ALLOWED_FLAGS = new Set(["g", "i", "m", "s", "u", "y"]);

export function validateRegex(input: unknown): ToolError | null {
  const v = input as Partial<RegexInput> | null;
  if (!v || typeof v.pattern !== "string" || typeof v.flags !== "string" || typeof v.text !== "string") {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "패턴, 플래그, 테스트 텍스트 문자열이 필요합니다.",
      how: "정규식 패턴과 플래그, 테스트할 텍스트를 입력하세요.",
    };
  }
  if (v.pattern.length === 0) {
    return {
      code: "USER_INPUT",
      what: "정규식 패턴이 비어 있습니다.",
      why: "빈 패턴은 테스트할 수 없습니다.",
      how: "정규식 패턴을 입력하세요.",
    };
  }
  if (v.pattern.length > MAX_PATTERN_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `패턴이 너무 깁니다 (최대 ${MAX_PATTERN_CHARS}자).`,
      why: `현재 ${v.pattern.length}자가 입력되었습니다.`,
      how: "패턴을 줄이거나 간단한 형태로 입력하세요.",
    };
  }
  if (v.text.length > MAX_TEXT_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `테스트 텍스트가 너무 깁니다 (최대 ${MAX_TEXT_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "텍스트를 나누어 여러 번 테스트하세요.",
    };
  }
  for (const f of v.flags) {
    if (!ALLOWED_FLAGS.has(f)) {
      return {
        code: "USER_INPUT",
        what: `지원하지 않는 플래그입니다: ${f}`,
        why: "허용 플래그: g, i, m, s, u, y",
        how: "g, i, m, s, u, y 중에서 선택하세요.",
      };
    }
  }
  // 중복 플래그 거부
  const seen = new Set<string>();
  for (const f of v.flags) {
    if (seen.has(f)) {
      return {
        code: "USER_INPUT",
        what: `중복된 플래그입니다: ${f}`,
        why: "같은 플래그를 여러 번 사용할 수 없습니다.",
        how: "플래그를 한 번씩만 입력하세요.",
      };
    }
    seen.add(f);
  }
  return null;
}

export const REGEX_TIMEOUT_MS = 750;

export async function processRegex(input: RegexInput): Promise<RegexOutput> {
  if (typeof Worker === "undefined") {
    if (typeof window !== "undefined") {
      throw {
        code: "UNSUPPORTED",
        what: "안전한 정규식 실행 환경을 사용할 수 없습니다.",
        why: "브라우저 Worker를 만들 수 없어 메인 스레드 실행을 생략했습니다.",
        how: "Worker를 지원하는 최신 브라우저에서 다시 시도하세요.",
      };
    }
    return processRegexInline(input);
  }

  return new Promise<RegexOutput>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./regexWorker.ts", import.meta.url), { type: "module" });
    } catch {
      reject({
        code: "UNSUPPORTED",
        what: "안전한 정규식 실행 환경을 시작하지 못했습니다.",
        why: "Worker를 시작할 수 없습니다.",
        how: "브라우저 설정을 확인한 뒤 다시 시도하세요.",
      });
      return;
    }

    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      action();
    };
    const timer = setTimeout(() => finish(() => reject({
      code: "UNSUPPORTED",
      what: "정규식 실행 시간이 초과되었습니다.",
      why: "안전 제한 시간 " + REGEX_TIMEOUT_MS + "ms를 넘어서 실행을 중단했습니다.",
      how: "패턴을 단순화하거나 테스트 텍스트를 줄이세요.",
    })), REGEX_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<{ ok: true; output: RegexOutput } | { ok: false; error: unknown }>) => {
      const reply = event.data;
      if (reply.ok) finish(() => resolve(reply.output));
      else finish(() => reject(reply.error));
    };
    worker.onerror = () => finish(() => reject({
      code: "FILE_INVALID",
      what: "정규식 작업을 완료하지 못했습니다.",
      why: "격리된 실행 Worker에서 오류가 발생했습니다.",
      how: "패턴과 플래그를 확인하고 다시 시도하세요.",
    }));
    try {
      worker.postMessage(input);
    } catch {
      finish(() => reject({
        code: "USER_INPUT",
        what: "정규식 입력을 Worker로 전달하지 못했습니다.",
        why: "입력 데이터를 복제할 수 없습니다.",
        how: "패턴과 텍스트를 확인하세요.",
      }));
    }
  });
}

export async function processRegexInline(input: RegexInput): Promise<RegexOutput> {
  let re: RegExp;
  try {
    re = new RegExp(input.pattern, input.flags);
  } catch (e) {
    throw {
      code: "FILE_INVALID",
      what: "정규식 패턴이 유효하지 않습니다.",
      why: e instanceof Error ? e.message : String(e),
      how: "괄호·이스케이프·플래그 조합을 확인하세요.",
    };
  }
  if (isPotentiallyCatastrophicPattern(input.pattern)) {
    return { matchCount: 0, truncated: true, matches: [], pattern: input.pattern, flags: input.flags };
  }

  const matches: RegexMatch[] = [];
  let truncated = false;
  if (re.global) {
    // matchAll 사용 (g 플래시 필수)
    let count = 0;
    for (const m of re[Symbol.matchAll](input.text)) {
      if (count >= MAX_MATCHES) {
        truncated = true;
        break;
      }
      matches.push(toMatch(m, count));
      count++;
    }
  } else {
    const m = re.exec(input.text);
    if (m) {
      matches.push(toMatch(m, 0));
    }
  }
  return {
    matchCount: matches.length,
    truncated,
    matches,
    pattern: input.pattern,
    flags: input.flags,
  };
}

function toMatch(m: RegExpExecArray | RegExpMatchArray, index: number): RegexMatch {
  const groups: (string | undefined)[] = [];
  for (let i = 1; i < m.length; i++) {
    groups.push(m[i]);
  }
  const namedGroups: Record<string, string> = {};
  if (m.groups) {
    for (const [k, v] of Object.entries(m.groups)) {
      if (v !== undefined) namedGroups[k] = v;
    }
  }
  return {
    index: m.index ?? 0,
    match: m[0],
    groups,
    namedGroups,
  };
}

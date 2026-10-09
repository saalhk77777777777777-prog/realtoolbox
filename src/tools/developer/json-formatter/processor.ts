/**
 * TOOLBOX v0.2.1 — JSON Formatter / Validator (§101.1, §101.2)
 * JSON.parse / JSON.stringify 기반. dependency 0. eval/Function 사용 금지.
 * 출력은 입력의 순수함수. invalid 입력은 성공 결과를 반환하지 않는다.
 *
 * POLICY (UI·FAQ와 일치):
 * - Validator = 문법 검사 (valid/invalid + 오류 위치). Formatter = pretty/minify 출력.
 * - 중복 key: JSON.parse는 last-wins. 문자열 인식 스캐너로 검출되면 warning으로 보고.
 *   배열 내 객체의 중복은 부모 경로로 보고한다 (limitation).
 * - 숫자 정밀도: 임의 정밀도를 주장하지 않는다. 16자리 이상 숫자 토큰은 warning.
 *   본 도구는 parse → serialize 기반이며 byte-for-byte 보존 도구가 아니다.
 * - 오류 위치: 엔진 메시지의 "at position N"을 line/column으로 변환. 없으면 null.
 */
import type { ToolError } from "../../../core/types.ts";

export type JsonMode = "pretty" | "minify" | "validate";
export type JsonIndent = 2 | 4 | "tab";

export interface JsonInput {
  text: string;
  mode: JsonMode;
  indent: JsonIndent;
}

export interface JsonWarning {
  type: "duplicate-key" | "precision";
  message: string;
  path?: string;
}

export interface JsonOutput {
  valid: true;
  mode: JsonMode;
  /** validate 모드에서는 "" (결과 텍스트 미생성). pretty/minify는 변환 텍스트. */
  formattedText: string;
  warnings: JsonWarning[];
  characters: number;
  maxDepth: number;
}

export interface JsonErrorDetail {
  line: number | null;
  column: number | null;
  message: string;
}

/** v0.2.1 safe mode 상한 — 기존 텍스트 도구와 동일 기준 (§50) */
export const MAX_JSON_CHARS = 1_000_000;

export function validateJson(input: unknown): ToolError | null {
  const v = input as Partial<JsonInput> | null;
  if (
    !v ||
    typeof v.text !== "string" ||
    (v.mode !== "pretty" && v.mode !== "minify" && v.mode !== "validate") ||
    (v.indent !== 2 && v.indent !== 4 && v.indent !== "tab")
  ) {
    return {
      code: "USER_INPUT",
      what: "입력, 모드 또는 들여쓰기가 올바르지 않습니다.",
      why: "텍스트, pretty/minify/validate 모드, 2/4/tab 들여쓰기가 필요합니다.",
      how: "JSON을 입력하고 모드를 선택하세요.",
    };
  }
  if (v.text.trim().length === 0) {
    return {
      code: "USER_INPUT",
      what: "JSON 입력이 비어 있습니다.",
      why: "빈 문자열은 검사할 수 없습니다.",
      how: "검사할 JSON을 입력하세요.",
    };
  }
  if (v.text.length > MAX_JSON_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `입력이 너무 깁니다 (최대 ${MAX_JSON_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "JSON을 나누어 여러 번 검사하세요.",
    };
  }
  return null;
}

export async function processJson(input: JsonInput): Promise<JsonOutput> {
  let value: unknown;
  try {
    value = JSON.parse(input.text);
  } catch (e) {
    throw jsonParseError(input.text, e);
  }
  const findings = scanJson(input.text);
  const warnings: JsonWarning[] = [
    ...findings.duplicates.map((d) => ({
      type: "duplicate-key" as const,
      message: `중복 key "${d.key}" — JSON.parse는 마지막 값을 사용합니다 (last-wins).`,
      path: d.path,
    })),
    ...findings.bigNumbers.map((n) => ({
      type: "precision" as const,
      message: `큰 숫자 "${truncate(n, 40)}" — JavaScript Number 정밀도를 벗어날 수 있어 값이 변형될 수 있습니다.`,
    })),
  ];
  const indent = input.indent === "tab" ? "\t" : input.indent;
  const formattedText =
    input.mode === "pretty"
      ? JSON.stringify(value, null, indent)
      : input.mode === "minify"
        ? JSON.stringify(value)
        : "";
  return {
    valid: true,
    mode: input.mode,
    formattedText,
    warnings,
    characters: input.text.length,
    maxDepth: findings.maxDepth,
  };
}

function jsonParseError(text: string, e: unknown): ToolError {
  const raw = e instanceof Error ? e.message : String(e);
  const detail = locateError(text, raw);
  const where =
    detail.line !== null ? ` (줄 ${detail.line}, 열 ${detail.column})` : "";
  return {
    code: "FILE_INVALID",
    what: `유효한 JSON이 아닙니다${where}.`,
    why: raw,
    how: "trailing comma·주석·작은따옴표·NaN·Infinity·undefined는 JSON이 아닙니다. 쌍따옴표와 쉼표 위치를 확인하세요.",
  };
}

/**
 * 엔진 오류 메시지의 "at position N"을 line/column으로 변환.
 * 위치 정보가 없으면 {line: null, column: null} (엔진별 메시지 차이 limitation).
 */
export function locateError(text: string, message: string): JsonErrorDetail {
  const m = /at position (\d+)/.exec(message);
  if (!m) return { line: null, column: null, message };
  const pos = Math.min(Number(m[1]), text.length);
  let line = 1;
  let column = 1;
  for (let i = 0; i < pos; i++) {
    if (text[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column, message };
}

export interface DuplicateFinding {
  key: string;
  path: string;
}

interface ScanResult {
  duplicates: DuplicateFinding[];
  bigNumbers: string[];
  maxDepth: number;
}

/**
 * 문자열 인식 단일 패스 스캐너. valid JSON을 전제로 하며 어떤 경우에도 throw하지 않는다.
 * - object key 중복 검출 (path는 rootからの key 경로, 배열 내부는 부모 경로)
 * - 16자리 이상 숫자 토큰 검출 (정밀도 경고용)
 * - 최대 중첩 깊이
 */
export function scanJson(text: string): ScanResult {
  const duplicates: DuplicateFinding[] = [];
  const bigNumbers: string[] = [];
  let maxDepth = 0;
  try {
    interface Frame {
      type: "obj" | "arr";
      keys: Set<string>;
      path: string[];
    }
    const stack: Frame[] = [];
    let pendingPath: string[] | null = null;
    let i = 0;
    const n = text.length;
    const skipWs = (): void => {
      while (i < n && /\s/.test(text[i]!)) i++;
    };
    const readString = (): string | null => {
      // text[i] === '"' 전제. JSON.parse와 동일한 키 비교를 위해 escape를 디코드한다.
      const SIMPLE: Record<string, string> = {
        '"': '"',
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
      };
      let out = "";
      i++; // opening quote
      while (i < n) {
        const c = text[i]!;
        if (c === '"') {
          i++;
          return out;
        }
        if (c === "\\") {
          const esc = text[i + 1];
          if (esc === undefined) return null;
          if (esc === "u") {
            const hex = text.slice(i + 2, i + 6);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
            out += String.fromCharCode(Number.parseInt(hex, 16));
            i += 6;
          } else if (esc in SIMPLE) {
            out += SIMPLE[esc]!;
            i += 2;
          } else {
            return null;
          }
          continue;
        }
        if (c === "\n" || c === "\r") return null;
        out += c;
        i++;
      }
      return null;
    };
    const top = (): Frame | undefined => stack[stack.length - 1];
    while (i < n) {
      skipWs();
      if (i >= n) break;
      const c = text[i]!;
      if (c === "{") {
        stack.push({ type: "obj", keys: new Set(), path: pendingPath ?? top()?.path ?? [] });
        pendingPath = null;
        maxDepth = Math.max(maxDepth, stack.length);
        i++;
      } else if (c === "[") {
        stack.push({ type: "arr", keys: new Set(), path: pendingPath ?? top()?.path ?? [] });
        pendingPath = null;
        maxDepth = Math.max(maxDepth, stack.length);
        i++;
      } else if (c === "}" || c === "]") {
        stack.pop();
        pendingPath = null;
        i++;
      } else if (c === '"') {
        const str = readString();
        if (str === null) return { duplicates, bigNumbers, maxDepth };
        skipWs();
        const frame = top();
        if (text[i] === ":" && frame?.type === "obj") {
          if (frame.keys.has(str)) {
            duplicates.push({ key: str, path: [...frame.path, str].join(".") || str });
          } else {
            frame.keys.add(str);
          }
          pendingPath = [...frame.path, str];
          i++; // colon
        } else {
          pendingPath = null;
        }
      } else if (c === "-" || (c >= "0" && c <= "9")) {
        const m = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
        if (!m) {
          i++;
          continue;
        }
        const token = m[0];
        const digits = token.replace(/^[+-]/, "").replace(".", "").split(/[eE]/)[0]!.length;
        if (digits >= 16) bigNumbers.push(token);
        i += token.length;
        pendingPath = null;
      } else {
        // true/false/null, comma, colon 등 — 값 위치 추적 불필요
        pendingPath = null;
        i++;
      }
    }
  } catch {
    // 스캐너는 절대 throw하지 않는다 — findings 반환
  }
  return { duplicates, bigNumbers, maxDepth };
}

function truncate(s: string, len: number): string {
  return s.length > len ? `${s.slice(0, len)}…` : s;
}

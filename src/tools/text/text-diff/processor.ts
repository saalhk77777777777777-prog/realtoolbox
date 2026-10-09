/**
 * TOOLBOX v0.6.6 — Text Diff
 * 두 텍스트를 줄 단위로 비교합니다. dependency 0. 서버 전송 없음.
 * 짧은 텍스트는 character/word diff, 긴 텍스트는 line diff를 우선합니다.
 */
import type { ToolError } from "../../../core/types.ts";

export interface DiffInput {
  left: string;
  right: string;
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export interface DiffOutput {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

export const MAX_DIFF_CHARS = 1_000_000;

export function validateDiff(input: unknown): ToolError | null {
  const v = input as Partial<DiffInput> | null;
  if (!v || typeof v.left !== "string" || typeof v.right !== "string") {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "좌우 텍스트 문자열이 필요합니다.",
      how: "비교할 두 텍스트를 입력하세요.",
    };
  }
  if (v.left.length === 0 && v.right.length === 0) {
    return {
      code: "USER_INPUT",
      what: "두 텍스트가 모두 비어 있습니다.",
      why: "비교할 내용이 없습니다.",
      how: "적어도 하나의 텍스트에 내용을 입력하세요.",
    };
  }
  if (v.left.length > MAX_DIFF_CHARS || v.right.length > MAX_DIFF_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `텍스트가 너무 깁니다 (최대 ${MAX_DIFF_CHARS.toLocaleString()}자).`,
      why: `좌 ${v.left.length.toLocaleString()}자, 우 ${v.right.length.toLocaleString()}자입니다.`,
      how: "텍스트를 나누어 여러 번 비교하세요.",
    };
  }
  return null;
}

const LCS_LINE_LIMIT = 3000;

export async function processDiff(input: DiffInput): Promise<DiffOutput> {
  const leftLines = splitLines(input.left);
  const rightLines = splitLines(input.right);

  if (leftLines.length > LCS_LINE_LIMIT || rightLines.length > LCS_LINE_LIMIT) {
    // ponytail: 줄 수가 크면 O(n*m) LCS 대신 위치별 비교로 폴백 — 정확한 LCS가 필요하면 diff-match-patch 도입.
    return positionalDiff(leftLines, rightLines);
  }

  const lines: DiffLine[] = [];
  const n = leftLines.length;
  const m = rightLines.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = leftLines[i] === rightLines[j]
        ? dp[i + 1]![j + 1]! + 1
        : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (leftLines[i] === rightLines[j]) {
      lines.push({ type: "unchanged", text: leftLines[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      lines.push({ type: "removed", text: leftLines[i]! });
      i++;
    } else {
      lines.push({ type: "added", text: rightLines[j]! });
      j++;
    }
  }
  while (i < n) lines.push({ type: "removed", text: leftLines[i++]! });
  while (j < m) lines.push({ type: "added", text: rightLines[j++]! });

  return summarize(lines);
}

function splitLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function positionalDiff(leftLines: string[], rightLines: string[]): DiffOutput {
  const lines: DiffLine[] = [];
  const maxLen = Math.max(leftLines.length, rightLines.length);
  for (let k = 0; k < maxLen; k++) {
    const l = leftLines[k];
    const r = rightLines[k];
    if (l === r) {
      lines.push({ type: "unchanged", text: l! });
    } else {
      if (l !== undefined) lines.push({ type: "removed", text: l });
      if (r !== undefined) lines.push({ type: "added", text: r });
    }
  }
  return summarize(lines);
}

function summarize(lines: DiffLine[]): DiffOutput {
  return {
    lines,
    addedCount: lines.filter((l) => l.type === "added").length,
    removedCount: lines.filter((l) => l.type === "removed").length,
    unchangedCount: lines.filter((l) => l.type === "unchanged").length,
  };
}

/** TOOLBOX v0.18.0 — Git Diff Analyzer processor. */
import type { ToolError } from "../../../core/types.ts";

export interface DiffFileSummary { path: string; oldPath?: string; status: "added" | "deleted" | "renamed" | "modified" | "unknown"; additions: number; deletions: number; binary: boolean; hunks: number; }
export interface DiffAnalysis { files: DiffFileSummary[]; totalFiles: number; additions: number; deletions: number; binaryFiles: number; hunkCount: number; inputBytes: number; }
const MAX_CHARS = 2_000_000;

export function validate(input: unknown): ToolError | null {
  if (typeof input !== "string" || !input.trim()) return { code: "USER_INPUT", what: "Git diff를 입력하세요.", why: "분석할 패치 텍스트가 비어 있습니다.", how: "git diff 또는 git show 명령의 출력을 붙여 넣으세요." };
  if (input.length > MAX_CHARS) return { code: "USER_INPUT", what: "입력이 너무 큽니다.", why: "최대 2,000,000자까지 처리합니다.", how: "diff를 파일별로 나누어 분석하세요." };
  if (!/^diff --git /m.test(input) && !/^@@ .* @@/m.test(input) && !/^\+\+\+ /m.test(input)) return { code: "USER_INPUT", what: "Git unified diff 형식이 아닙니다.", why: "파일 헤더나 hunk 헤더를 찾지 못했습니다.", how: "git diff 또는 git show 출력인지 확인하세요." };
  return null;
}
function pathValue(raw: string): string { const value = raw.trim(); if (value.startsWith('"') && value.endsWith('"')) { try { return JSON.parse(value) as string; } catch { return value.slice(1, -1); } } return value; }
function stripPrefix(value: string, prefix: string): string { return value.startsWith(prefix) ? value.slice(prefix.length) : value; }

export function process(input: unknown): DiffAnalysis {
  const issue = validate(input); if (issue) throw Error(issue.what + " " + issue.how);
  const source = input as string; const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const files: DiffFileSummary[] = []; let current: DiffFileSummary | null = null; let inHunk = false; let oldLeft = 0; let newLeft = 0;
  const ensure = (): DiffFileSummary => { if (!current) { current = { path: "(unknown file)", status: "unknown", additions: 0, deletions: 0, binary: false, hunks: 0 }; files.push(current); } return current; };
  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git (.+) (.+)$/); current = null; inHunk = false;
      if (match) { const oldPath = stripPrefix(pathValue(match[1]), "a/"); const newPath = stripPrefix(pathValue(match[2]), "b/"); current = { path: newPath, oldPath: oldPath !== newPath ? oldPath : undefined, status: "modified", additions: 0, deletions: 0, binary: false, hunks: 0 }; files.push(current); }
      continue;
    }
    if (line.startsWith("rename from ")) { const f = ensure(); f.oldPath = pathValue(line.slice(12)); f.status = "renamed"; continue; }
    if (line.startsWith("rename to ")) { const f = ensure(); f.path = pathValue(line.slice(10)); f.status = "renamed"; continue; }
    if (line.startsWith("new file mode ")) { ensure().status = "added"; continue; }
    if (line.startsWith("deleted file mode ")) { ensure().status = "deleted"; continue; }
    if (line.startsWith("--- ")) { if (line.slice(4).trim() === "/dev/null") ensure().status = "added"; else { const f = ensure(); const old = stripPrefix(pathValue(line.slice(4)), "a/"); if (old !== f.path) f.oldPath = old; } inHunk = false; continue; }
    if (line.startsWith("+++ ")) { const f = ensure(); const value = pathValue(line.slice(4)); if (value === "/dev/null") f.status = "deleted"; else if (f.path === "(unknown file)") f.path = stripPrefix(value, "b/"); inHunk = false; continue; }
    if (line.startsWith("Binary files ") || line.startsWith("GIT binary patch")) { ensure().binary = true; inHunk = false; continue; }
    if (line.startsWith("@@")) { const f = ensure(); const m = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/); oldLeft = m ? Number(m[2] ?? 1) : 0; newLeft = m ? Number(m[4] ?? 1) : 0; f.hunks++; inHunk = true; continue; }
    if (!inHunk || line.startsWith("\\ No newline at end of file")) continue;
    const f = ensure();
    if (line.startsWith("+") && !line.startsWith("+++")) { f.additions++; newLeft = Math.max(0, newLeft - 1); }
    else if (line.startsWith("-") && !line.startsWith("---")) { f.deletions++; oldLeft = Math.max(0, oldLeft - 1); }
    else if (line.startsWith(" ")) { oldLeft = Math.max(0, oldLeft - 1); newLeft = Math.max(0, newLeft - 1); }
    if (oldLeft === 0 && newLeft === 0) inHunk = false;
  }
  return { files, totalFiles: files.length, additions: files.reduce((s, f) => s + f.additions, 0), deletions: files.reduce((s, f) => s + f.deletions, 0), binaryFiles: files.filter((f) => f.binary).length, hunkCount: files.reduce((s, f) => s + f.hunks, 0), inputBytes: new TextEncoder().encode(source).byteLength };
}

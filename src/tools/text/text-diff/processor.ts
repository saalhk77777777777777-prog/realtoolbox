/** TOOLBOX v0.14.95 — Text Diff processor. */
export const MAX_DIFF_CHARS = 1_000_000;
type DiffInput = { left: string; right: string };
type DiffLine = { type: "added" | "removed" | "unchanged"; text: string };
export function validateDiff(input: unknown): { code: "USER_INPUT" | "UNSUPPORTED"; what: string; why: string; how: string } | null {
  if (!input || typeof input !== "object") return { code: "USER_INPUT", what: "Text required", why: "Missing input", how: "Enter both texts." };
  const v = input as Partial<DiffInput>;
  if (typeof v.left !== "string" || typeof v.right !== "string") return { code: "USER_INPUT", what: "Text required", why: "Both values must be strings", how: "Enter both texts." };
  if (!v.left.length && !v.right.length) return { code: "USER_INPUT", what: "Text required", why: "Both texts are empty", how: "Enter text on at least one side." };
  if (v.left.length > MAX_DIFF_CHARS || v.right.length > MAX_DIFF_CHARS) return { code: "UNSUPPORTED", what: "Text too large", why: "Limit is 1,000,000 characters per side", how: "Use shorter text." };
  return null;
}
export function processDiff(input: DiffInput): { lines: DiffLine[]; addedCount: number; removedCount: number; unchangedCount: number } {
  const error = validateDiff(input);
  if (error) throw new Error(error.what + ": " + error.how);
  const a = input.left ? input.left.replace(/\r\n?/g, "\n").split("\n") : [];
  const b = input.right ? input.right.replace(/\r\n?/g, "\n").split("\n") : [];
  const lines: DiffLine[] = [];
  const push = (type: DiffLine["type"], text: string) => lines.push({ type, text });
  if ((a.length + 1) * (b.length + 1) > 1_000_000) {
    let prefix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) { push("unchanged", a[prefix]!); prefix++; }
    let suffix = 0;
    while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
    for (let i = prefix; i < a.length - suffix; i++) push("removed", a[i]!);
    for (let i = prefix; i < b.length - suffix; i++) push("added", b[i]!);
    for (let i = suffix; i > 0; i--) push("unchanged", a[a.length - i]!);
  } else {
    const dp = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { push("unchanged", a[i]!); i++; j++; }
      else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) push("removed", a[i++]!);
      else push("added", b[j++]!);
    }
    while (i < a.length) push("removed", a[i++]!);
    while (j < b.length) push("added", b[j++]!);
  }
  return { lines, addedCount: lines.filter(x => x.type === "added").length, removedCount: lines.filter(x => x.type === "removed").length, unchangedCount: lines.filter(x => x.type === "unchanged").length };
}
export function validate(input: unknown) { return validateDiff(input); }
export async function process(input: unknown): Promise<unknown> { return processDiff(input as DiffInput); }
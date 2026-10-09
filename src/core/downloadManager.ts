/**
 * TOOLBOX v0.1.0 — Download Manager (§72, §113.24)
 * deterministic filename, MIME 일치, sanitize, Object URL cleanup.
 */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "download";
  const clean = base.replace(/[<>:"|?*\u0000-\u001F]/g, "_").trim();
  return clean.length > 0 ? clean.slice(0, 180) : "download";
}

export function buildFilename(toolSlug: string, original: string, ext: string): string {
  const dot = original.lastIndexOf(".");
  const stem = (dot >= 0 ? original.slice(0, dot) : original || "result").slice(0, 80);
  return sanitizeFilename(`${toolSlug}-${stem}.${ext.replace(/^\./, "")}`);
}

export function downloadText(filename: string, text: string, mime = "text/plain"): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  downloadBlob(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeFilename(filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // 다운로드 개시 후 revoke (브라우저가 스트림을 잡기 전 revoke 방지용 지연)
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}

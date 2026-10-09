/**
 * TOOLBOX v0.1.0 — Analytics abstraction (§47)
 * 파일명/내용/토큰/개인정보 수집 금지. 최소 이벤트만.
 */
export type AnalyticsEvent =
  | "page_view"
  | "tool_open"
  | "file_selected"
  | "processing_started"
  | "processing_completed"
  | "processing_failed"
  | "download"
  | "search"
  | "search_result_click"
  | "related_tool_click";

const FORBIDDEN_KEYS = ["fileName", "fileContent", "token", "password", "apiKey"];

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  for (const k of FORBIDDEN_KEYS) {
    if (k in props) {
      if (typeof console !== "undefined") {
        console.warn(`[analytics] blocked PII key: ${k}`);
      }
      return;
    }
  }
  // v0.1.0: 실제 전송 없이 console.debug + dataLayer 스텁 (향후 provider 연결)
  if (typeof console !== "undefined" && import.meta.env?.DEV) {
    console.debug(`[analytics] ${event}`, props);
  }
}

/**
 * TOOLBOX v0.1.0 — Capability Detector (§51)
 * 기능별 capability detection. 없으면 대체/비활성화/서버fallback 중 선택 (v0.1.0은 비활성화 + 안내).
 */
export interface Capabilities {
  file: boolean;
  canvas: boolean;
  offscreenCanvas: boolean;
  worker: boolean;
  crypto: boolean;
  clipboard: boolean;
}

export function checkCapabilities(): Capabilities {
  const g = globalThis as Record<string, unknown>;
  return {
    file: typeof File !== "undefined" && typeof Blob !== "undefined",
    canvas:
      typeof document !== "undefined" &&
      typeof document.createElement === "function" &&
      (() => {
        try {
          const c = document.createElement("canvas");
          return typeof c.getContext === "function";
        } catch {
          return false;
        }
      })(),
    offscreenCanvas: typeof g["OffscreenCanvas"] !== "undefined",
    worker: typeof g["Worker"] !== "undefined",
    crypto:
      typeof g["crypto"] !== "undefined" &&
      typeof (g["crypto"] as Crypto)?.getRandomValues === "function",
    clipboard:
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard !== "undefined",
  };
}

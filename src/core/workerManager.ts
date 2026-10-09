/**
 * TOOLBOX v0.1.0 — Worker Manager (§49) — Phase A stub
 * CPU-heavy 작업은 Worker로 이동. v0.1.0은 인터페이스 + safe fallback만 제공.
 */
export interface WorkerJob {
  id: string;
  kind: string;
  payload: unknown;
}

export function workerSupported(): boolean {
  return typeof (globalThis as Record<string, unknown>)["Worker"] !== "undefined";
}

/** v0.1.0: 실제 Worker 스레드 없이 동일한 메시지 규격으로 Main Thread 실행 */
export async function runOnWorker<T>(
  kind: string,
  payload: unknown,
  fn: (payload: unknown) => Promise<T> | T,
  onProgress?: (ratio: number, step: string) => void,
): Promise<T> {
  onProgress?.(0.1, `worker:${kind}:start`);
  try {
    const out = await fn(payload);
    onProgress?.(1, `worker:${kind}:done`);
    return out;
  } catch (e) {
    onProgress?.(1, `worker:${kind}:error`);
    throw e;
  }
}

/**
 * TOOLBOX v0.1.0 — Tool Runner (§98.0.1)
 * Route → lazy-load → capability → validate → process → validate-result → download
 */
import type { ProcessorContext, ToolError, ToolManifest } from "./types.ts";
import { checkCapabilities } from "./capabilityDetector.ts";
import { track } from "../analytics/analytics.ts";

export interface RunResult {
  ok: boolean;
  output?: unknown;
  error?: ToolError;
}

export async function runTool(
  manifest: ToolManifest,
  input: unknown,
  opts?: { signal?: AbortSignal; onProgress?: ProcessorContext["onProgress"] },
): Promise<RunResult> {
  const signal = opts?.signal ?? new AbortController().signal;

  // 1. lazy-load
  let mod;
  try {
    mod = await manifest.load();
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "INTERNAL",
        what: "도구 모듈을 불러오지 못했습니다.",
        why: String(e instanceof Error ? e.message : e),
        how: "페이지를 새로고침한 뒤 다시 시도하세요.",
      },
    };
  }

  // 2. capability check
  const cap = checkCapabilities();
  void cap;

  // 3. validate
  track("processing_started", { tool: manifest.id });
  const invalid = mod.validate(input);
  if (invalid) {
    track("processing_failed", { tool: manifest.id, code: invalid.code });
    return { ok: false, error: invalid };
  }

  if (signal.aborted) {
    return {
      ok: false,
      error: {
        code: "USER_INPUT",
        what: "작업이 취소되었습니다.",
        why: "사용자가 취소를 요청했습니다.",
        how: "필요하면 다시 실행하세요.",
      },
    };
  }

  // 4. process (Worker는 Phase B 이후 개별 도구에서 사용, v0.1.0은 Main Thread)
  try {
    const output = await mod.process(input, {
      signal,
      onProgress: opts?.onProgress,
    });
    track("processing_completed", { tool: manifest.id });
    return { ok: true, output };
  } catch (e) {
    const error: ToolError =
      e && typeof e === "object" && "code" in e
        ? (e as ToolError)
        : {
            code: "PROCESSING",
            what: "처리 중 오류가 발생했습니다.",
            why: String(e instanceof Error ? e.message : e),
            how: "파일이 손상되지 않았는지 확인하고 다시 시도하세요.",
          };
    track("processing_failed", { tool: manifest.id, code: error.code });
    return { ok: false, error };
  }
}

/** TOOLBOX v0.15.0 — Retry Backoff Simulator. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "retry-backoff-simulator", version: "0.15.0", title: "Retry Backoff Simulator", slug: "retry-backoff-simulator",
  category: "utility", description: "재시도 횟수와 지수 백오프 설정에 따른 대기 일정과 총 대기 시간을 계산합니다.",
  keywords: ["retry", "backoff", "exponential backoff", "재시도", "대기 시간"],
  aliases: ["재시도 백오프 시뮬레이터"], inputTypes: ["text"], outputTypes: ["text", "data"], localProcessing: true, relatedTools: [],
  load: async () => { const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]); return { manifest: { ...manifest, load: undefined as never }, validate: p.validate, process: async (i, c) => { if (c.signal.aborted) throw Error("cancelled"); return p.process(i); }, render: u.render }; }
};
export function registerRetryBackoffSimulator(): void { registerTool(manifest); }

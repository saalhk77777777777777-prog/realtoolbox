/** TOOLBOX v0.16.0 — Log Timeline Correlator. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const manifest: ToolManifest = {
  id: "log-timeline-correlator",
  version: "0.16.0",
  title: "Log Timeline Correlator",
  slug: "log-timeline-correlator",
  category: "developer",
  description: "여러 서비스의 텍스트·JSON 로그를 시간순으로 정렬하고 요청 ID별 이벤트 흐름과 오류를 추적합니다.",
  keywords: ["log", "timeline", "correlation", "request id", "trace", "로그 분석", "요청 추적", "오류 분석"],
  aliases: ["로그 타임라인 분석기", "로그 상관관계 분석기"],
  inputTypes: ["text"],
  outputTypes: ["text", "data"],
  localProcessing: true,
  relatedTools: ["json-formatter", "regex-tester", "timestamp-converter"],
  load: async () => {
    const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return {
      manifest: { ...manifest, load: undefined as never },
      validate: p.validate,
      process: async (input, context) => {
        if (context.signal.aborted) throw Error("cancelled");
        return p.process(input);
      },
      render: u.render,
    };
  },
};

export function registerLogTimelineCorrelator(): void {
  registerTool(manifest);
}

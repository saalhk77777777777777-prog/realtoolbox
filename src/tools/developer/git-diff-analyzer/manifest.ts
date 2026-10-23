/** TOOLBOX v0.18.0 — Git Diff Analyzer manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const manifest: ToolManifest = {
  id: "git-diff-analyzer", version: "0.18.0", title: "Git Diff Analyzer", slug: "git-diff-analyzer", category: "developer",
  description: "Unified Git diff에서 파일별 추가·삭제 줄과 변경 요약을 분석합니다.",
  keywords: ["git diff", "diff analyzer", "patch", "code review", "변경 분석", "코드 리뷰"],
  aliases: ["Git 변경 분석기", "Diff 분석기", "패치 통계"], inputTypes: ["text"], outputTypes: ["text", "data"], localProcessing: true,
  relatedTools: ["git-commit-message-builder", "text-diff", "log-timeline-correlator"],
  load: async () => {
    const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validate,
      process: async (input, context) => { if (context.signal.aborted) throw Error("cancelled"); return p.process(input); }, render: u.render };
  },
};
export function registerGitDiffAnalyzer(): void { registerTool(manifest); }

/**
 * TOOLBOX v0.11.0 — Regex Tester manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 * Worker 미사용(상한+절단 방어) — v0.3.0에서 Worker 타임아웃 예정.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const regexManifest: ToolManifest = {
  id: "regex-tester",
  version: "0.13.3",
  title: "Regex Tester — 정규식 매칭·그룹 확인",
  slug: "regex-tester",
  category: "developer",
  description:
    "정규식 패턴과 플래그를 브라우저에서 테스트하고 캡처 그룹을 확인합니다. 결과는 상한 내에서만 표시됩니다.",
  keywords: ["regex", "정규식", "regex tester", "정규식 테스트", "pattern match", "capture group"],
  aliases: ["regex", "정규식", "regex tester", "정규식 테스트", "패턴 매칭"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["json-formatter", "url-parser", "jwt-decoder"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...regexManifest, load: undefined as never },
      validate: processor.validateRegex,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processRegex(input as never);
      },
      render: ui.renderRegex,
    };
  },};

export function registerRegex(): void {
  registerTool(regexManifest);
}

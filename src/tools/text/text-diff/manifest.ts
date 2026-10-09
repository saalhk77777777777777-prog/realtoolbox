/**
 * TOOLBOX v0.11.0 — Text Diff manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const diffManifest: ToolManifest = {
  id: "text-diff",
  version: "0.13.3",
  title: "Text Diff — 텍스트 비교",
  slug: "text-diff",
  category: "text",
  description:
    "두 텍스트를 줄 단위로 비교합니다. 추가/제거/변경된 줄을 표시합니다.",
  keywords: ["text diff", "텍스트 비교", "diff", "compare", "비교"],
  aliases: ["텍스트 비교", "text diff", "diff", "텍스트 차이"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["case-converter", "whitespace-cleaner", "slug-generator"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...diffManifest, load: undefined as never },
      validate: processor.validateDiff,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processDiff(input as never);
      },
      render: ui.renderDiff,
    };
  },};

export function registerDiff(): void {
  registerTool(diffManifest);
}

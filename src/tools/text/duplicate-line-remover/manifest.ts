/**
 * TOOLBOX v0.11.0 — Duplicate Line Remover manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const duplicateManifest: ToolManifest = {
  id: "duplicate-line-remover",
  version: "0.13.3",
  title: "Duplicate Line Remover — 중복 줄 제거",
  slug: "duplicate-line-remover",
  category: "text",
  description:
    "텍스트의 중복 줄을 제거합니다. 첫 항목 또는 마지막 항목 유지 선택 가능.",
  keywords: ["duplicate line", "중복 줄", "중복 제거", "dedup", "text"],
  aliases: ["중복 줄 제거", "duplicate line remover", "중복 제거", "dedup lines"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["case-converter", "whitespace-cleaner", "line-sorter"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...duplicateManifest, load: undefined as never },
      validate: processor.validateDuplicate,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processDuplicate(input as never);
      },
      render: ui.renderDuplicate,
    };
  },};

export function registerDuplicate(): void {
  registerTool(duplicateManifest);
}

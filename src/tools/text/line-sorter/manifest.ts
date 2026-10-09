/**
 * TOOLBOX v0.11.0 — Line Sorter manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const lineSortManifest: ToolManifest = {
  id: "line-sorter",
  version: "0.13.3",
  title: "Line Sorter — 줄 정렬",
  slug: "line-sorter",
  category: "text",
  description:
    "텍스트 줄을 정렬합니다. 문자열, 숫자, 길이, 대소문자 무시 모드 지원.",
  keywords: ["line sorter", "줄 정렬", "sort lines", "정렬", "text sort"],
  aliases: ["줄 정렬", "line sorter", "텍스트 정렬", "sort lines"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["case-converter", "whitespace-cleaner", "duplicate-line-remover"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...lineSortManifest, load: undefined as never },
      validate: processor.validateLineSort,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processLineSort(input as never);
      },
      render: ui.renderLineSort,
    };
  },};

export function registerLineSort(): void {
  registerTool(lineSortManifest);
}

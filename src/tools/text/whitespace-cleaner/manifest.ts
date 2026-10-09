/**
 * TOOLBOX v0.11.0 — Whitespace Cleaner manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const whitespaceManifest: ToolManifest = {
  id: "whitespace-cleaner",
  version: "0.13.3",
  title: "Whitespace Cleaner — 공백 정리",
  slug: "whitespace-cleaner",
  category: "text",
  description:
    "텍스트의 공백을 정리합니다. trim, 다중 공백 제거, 빈 줄 제거, 탭 정규화, 개행 정규화.",
  keywords: ["whitespace", "공백", "trim", "clean", "정리", "text"],
  aliases: ["공백 정리", "whitespace cleaner", "텍스트 정리", "공백 제거"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["case-converter", "line-sorter", "slug-generator"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...whitespaceManifest, load: undefined as never },
      validate: processor.validateWhitespace,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processWhitespace(input as never);
      },
      render: ui.renderWhitespace,
    };
  },};

export function registerWhitespace(): void {
  registerTool(whitespaceManifest);
}

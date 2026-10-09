/**
 * TOOLBOX v0.11.0 — Case Converter manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const caseManifest: ToolManifest = {
  id: "case-converter",
  version: "0.13.3",
  title: "Case Converter — 대소문자 변환",
  slug: "case-converter",
  category: "text",
  description:
    "텍스트의 대소문자를 변환합니다. lower, upper, title, camelCase, PascalCase, snake_case, kebab-case 지원.",
  keywords: ["case converter", "대소문자", "camel case", "snake case", "kebab case", "text transform"],
  aliases: ["대소문자 변환", "case converter", "camel case", "snake case", "kebab case"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["whitespace-cleaner", "line-sorter", "slug-generator"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...caseManifest, load: undefined as never },
      validate: processor.validateCase,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processCase(input as never);
      },
      render: ui.renderCase,
    };
  },};

export function registerCase(): void {
  registerTool(caseManifest);
}

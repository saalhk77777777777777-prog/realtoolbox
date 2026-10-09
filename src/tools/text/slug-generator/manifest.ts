/**
 * TOOLBOX v0.11.0 — Slug Generator manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const slugManifest: ToolManifest = {
  id: "slug-generator",
  version: "0.13.3",
  title: "Slug Generator — URL 친화적 텍스트 변환",
  slug: "slug-generator",
  category: "text",
  description:
    "텍스트를 URL 친화적 slug로 변환합니다. Unicode 정규화, 구분자 선택, 소문자 변환 지원.",
  keywords: ["slug", "slug generator", "url", "텍스트 변환", "unicode"],
  aliases: ["slug", "slug generator", "url 생성", "텍스트 변환"],
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
      manifest: { ...slugManifest, load: undefined as never },
      validate: processor.validateSlug,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processSlug(input as never);
      },
      render: ui.renderSlug,
    };
  },};

export function registerSlug(): void {
  registerTool(slugManifest);
}

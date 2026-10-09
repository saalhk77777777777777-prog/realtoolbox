/**
 * TOOLBOX v0.11.0 — Text Counter manifest + registration
 * 기존 Registry/Runner/Search/Routing 계약을 그대로 재사용한다.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const textCounterManifest: ToolManifest = {
  id: "text-counter",
  version: "0.13.3",
  title: "Text Counter — 글자 수 세기",
  slug: "text-counter",
  category: "text",
  description:
    "브라우저에서 글자·단어·줄·문단·UTF-8 바이트를 계산합니다. 입력한 텍스트는 서버로 전송되지 않습니다.",
  keywords: ["text counter", "글자수", "글자 수 세기", "word count", "char count", "자소 세기"],
  aliases: ["글자 수 세기", "text counter", "글자수세기", "word counter"],
  inputTypes: ["text"],
  outputTypes: ["text-stats-json"],
  localProcessing: true,
  relatedTools: ["case-converter", "whitespace-cleaner", "slug-generator"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...textCounterManifest, load: undefined as never },
      validate: processor.validateTextCounter,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processTextCounter(input as never);
      },
      render: ui.renderTextCounter,
    };
  },};

export function registerTextCounter(): void {
  registerTool(textCounterManifest);
}

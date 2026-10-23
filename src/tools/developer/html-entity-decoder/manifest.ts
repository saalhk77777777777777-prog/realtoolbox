/** TOOLBOX v0.14.96 — HTML Entity Decoder. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const htmlEntityDecoderManifest: ToolManifest = {
  id: "html-entity-decoder", version: "0.14.96",
  title: "HTML Entity Decoder — HTML 엔티티 디코더",
  slug: "html-entity-decoder", category: "developer",
  description: "HTML 엔티티와 숫자 문자 참조를 일반 문자로 변환합니다.",
  keywords: ["html entity decoder", "HTML 엔티티", "문자 참조", "디코딩"],
  aliases: ["HTML Entity Decoder", "HTML 엔티티 디코더"],
  inputTypes: ["text"], outputTypes: ["text", "data"], localProcessing: true,
  relatedTools: ["html-entity", "html-to-text"],
  load: async () => {
    const [processor, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...htmlEntityDecoderManifest, load: undefined as never },
      validate: processor.validate,
      process: async (input: unknown, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return processor.process(input); },
      render: ui.render };
  }
};
export function registerHtmlEntityDecoder(): void { registerTool(htmlEntityDecoderManifest); }

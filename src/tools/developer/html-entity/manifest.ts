/**
 * TOOLBOX v0.11.0 — HTML Entity Encoder / Decoder manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 * 전체 HTML5 entity 지원을 주장하지 않는다 — 지원 범위는 processor와 동일.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const entityManifest: ToolManifest = {
  id: "html-entity",
  version: "0.13.3",
  title: "HTML Entity Encoder & Decoder — 특수문자 변환",
  slug: "html-entity",
  category: "developer",
  description:
    "HTML 핵심 문자 5종과 nbsp·수치 참조를 텍스트로 변환합니다. HTML을 실행하지 않으며 서버로 전송되지 않습니다.",
  keywords: ["html entity", "html 엔티티", "entity encode", "entity decode", "특수문자 변환", "&amp;", "character reference"],
  aliases: ["html 엔티티", "html entity", "entity 인코딩", "entity 디코딩", "특수문자 변환"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["url-encoder", "base64", "json-formatter"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...entityManifest, load: undefined as never },
      validate: processor.validateEntity,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processEntity(input as never);
      },
      render: ui.renderEntity,
    };
  },};

export function registerEntity(): void {
  registerTool(entityManifest);
}

/**
 * TOOLBOX v0.11.0 — UUID Generator manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const uuidManifest: ToolManifest = {
  id: "uuid-generator",
  version: "0.13.3",
  title: "UUID Generator — 안전한 고유 ID 생성",
  slug: "uuid-generator",
  category: "developer",
  description:
    "Web Crypto 기반 v4/v7 UUID를 브라우저에서 생성합니다. 서버로 전송·저장되지 않습니다.",
  keywords: ["uuid", "uuid generator", "uuid v4", "uuid v7", "고유 id", "guid", "식별자 생성"],
  aliases: ["uuid", "uuid 생성", "uuid generator", "guid", "고유아이디"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["hash-generator", "timestamp-converter", "json-formatter"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...uuidManifest, load: undefined as never },
      validate: processor.validateUuid,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processUuid(input as never);
      },
      render: ui.renderUuid,
    };
  },};

export function registerUuid(): void {
  registerTool(uuidManifest);
}

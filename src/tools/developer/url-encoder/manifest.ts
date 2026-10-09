/**
 * TOOLBOX v0.11.0 — URL Encoder/Decoder manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const urlCoderManifest: ToolManifest = {
  id: "url-encoder",
  version: "0.13.3",
  title: "URL Encoder/Decoder — URL 인코딩·디코딩",
  slug: "url-encoder",
  category: "developer",
  description:
    "쿼리값 인코딩(encodeURIComponent)과 전체 URL 인코딩(encodeURI)을 구분해 변환합니다. 서버로 전송되지 않습니다.",
  keywords: ["url", "url encode", "url decode", "url 인코딩", "url 디코딩", "percent encoding", "퍼센트 인코딩"],
  aliases: ["url 인코딩", "url 디코딩", "url encoder", "url decoder", "url encode decode"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["base64", "jwt-decoder", "regex-tester"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...urlCoderManifest, load: undefined as never },
      validate: processor.validateUrlCoder,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processUrlCoder(input as never);
      },
      render: ui.renderUrlCoder,
    };
  },};

export function registerUrlCoder(): void {
  registerTool(urlCoderManifest);
}

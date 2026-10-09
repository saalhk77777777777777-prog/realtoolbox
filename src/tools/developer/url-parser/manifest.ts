/**
 * TOOLBOX v0.11.0 — URL Parser manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 * 파싱 전용임을 명시 — fetch·이동·단축을 주장하지 않는다.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const urlParserManifest: ToolManifest = {
  id: "url-parser",
  version: "0.13.3",
  title: "URL Parser — 주소 구조·파라미터 분해",
  slug: "url-parser",
  category: "developer",
  description:
    "URL을 접속 없이 브라우저 표준 API로 분해합니다. 상대 URL·실행 scheme은 지원하지 않으며 서버로 전송되지 않습니다.",
  keywords: ["url parser", "url 분해", "url 구조", "query parameter", "쿼리 파라미터", "url 분석"],
  aliases: ["url 분해", "url parser", "url 분석", "url 구조", "쿼리 파라미터 확인"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["url-encoder", "jwt-decoder", "json-formatter"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...urlParserManifest, load: undefined as never },
      validate: processor.validateUrlParser,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processUrlParser(input as never);
      },
      render: ui.renderUrlParser,
    };
  },};

export function registerUrlParser(): void {
  registerTool(urlParserManifest);
}

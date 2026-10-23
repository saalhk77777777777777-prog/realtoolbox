/** TOOLBOX v0.17.0 — cURL Request Builder manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const manifest: ToolManifest = {
  id: "curl-request-builder",
  version: "0.17.0",
  title: "cURL Request Builder",
  slug: "curl-request-builder",
  category: "developer",
  description: "HTTP 요청을 구성하고 cURL 명령어와 JavaScript fetch 코드로 변환합니다.",
  keywords: ["curl", "http request", "fetch", "api", "REST", "요청 생성", "API 테스트", "헤더"],
  aliases: ["cURL 요청 생성기", "HTTP 요청 빌더", "API 요청 작성기"],
  inputTypes: ["text"],
  outputTypes: ["text", "data"],
  localProcessing: true,
  relatedTools: ["url-parser", "json-formatter", "query-string-builder"],
  load: async () => {
    const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return {
      manifest: { ...manifest, load: undefined as never },
      validate: p.validate,
      process: async (input, context) => {
        if (context.signal.aborted) throw Error("cancelled");
        return p.process(input);
      },
      render: u.render,
    };
  },
};

export function registerCurlRequestBuilder(): void {
  registerTool(manifest);
}

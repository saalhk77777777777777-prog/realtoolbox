/**
 * TOOLBOX v0.11.0 — JSON Formatter / Validator manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const jsonManifest: ToolManifest = {
  id: "json-formatter",
  version: "0.13.3",
  title: "JSON Formatter & Validator — JSON 정리·검증",
  slug: "json-formatter",
  category: "developer",
  description:
    "JSON 문법을 검사하고 pretty/minify로 정리합니다. 오류 위치와 중복 key·정밀도 경고를 표시하며 서버로 전송되지 않습니다.",
  keywords: ["json", "json formatter", "json validator", "json 정리", "json 검증", "pretty print", "minify"],
  aliases: ["json 정리", "json 검증", "json formatter", "json validator", "json pretty", "json minify"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["json-diff", "jwt-decoder", "base64"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...jsonManifest, load: undefined as never },
      validate: processor.validateJson,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processJson(input as never);
      },
      render: ui.renderJson,
    };
  },};

export function registerJson(): void {
  registerTool(jsonManifest);
}

/**
 * TOOLBOX v0.11.0 — Timestamp Converter manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const timestampManifest: ToolManifest = {
  id: "timestamp-converter",
  version: "0.13.3",
  title: "Timestamp Converter — Unix 시간 변환",
  slug: "timestamp-converter",
  category: "developer",
  description:
    "Unix timestamp(초/밀리초)와 날짜/시간을 UTC·KST·로컬 시간대로 변환합니다. 서버로 전송되지 않습니다.",
  keywords: ["timestamp", "unix time", "유닉스 시간", "epoch", "날짜 변환", "iso 8601"],
  aliases: ["timestamp", "타임스탬프", "유닉스시간", "unix timestamp", "epoch converter"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["base64", "url-encoder", "jwt-decoder"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...timestampManifest, load: undefined as never },
      validate: processor.validateTimestamp,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processTimestamp(input as never);
      },
      render: ui.renderTimestamp,
    };
  },};

export function registerTimestamp(): void {
  registerTool(timestampManifest);
}

/**
 * TOOLBOX v0.11.0 — Base64 Tool manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const base64Manifest: ToolManifest = {
  id: "base64",
  version: "0.13.3",
  title: "Base64 Encoder/Decoder — Base64 인코딩·디코딩",
  slug: "base64",
  category: "developer",
  description:
    "텍스트를 Base64로 인코딩하거나 Base64를 텍스트로 디코딩합니다. UTF-8 한글·이모지를 지원하며 서버로 전송되지 않습니다.",
  keywords: ["base64", "베이스64", "인코딩", "디코딩", "encode", "decode"],
  aliases: ["base64", "베이스64", "base64 인코딩", "base64 디코딩", "base64 encode decode"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["url-encoder", "hash-generator", "jwt-decoder"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...base64Manifest, load: undefined as never },
      validate: processor.validateBase64,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processBase64(input as never);
      },
      render: ui.renderBase64,
    };
  },};

export function registerBase64(): void {
  registerTool(base64Manifest);
}

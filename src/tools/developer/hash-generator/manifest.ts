/**
 * TOOLBOX v0.11.0 — Hash Generator manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const hashManifest: ToolManifest = {
  id: "hash-generator",
  version: "0.13.3",
  title: "Hash Generator — SHA 해시 생성",
  slug: "hash-generator",
  category: "developer",
  description:
    "텍스트의 SHA-256/SHA-384/SHA-512 해시를 브라우저에서 생성합니다. 서버로 전송되지 않습니다.",
  keywords: ["hash", "해시", "sha256", "sha-256", "sha512", "sha-384", "checksum", "체크섬"],
  aliases: ["해시", "hash", "sha", "sha256", "해시 생성", "hash generator"],
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
      manifest: { ...hashManifest, load: undefined as never },
      validate: processor.validateHash,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processHash(input as never);
      },
      render: ui.renderHash,
    };
  },};

export function registerHash(): void {
  registerTool(hashManifest);
}

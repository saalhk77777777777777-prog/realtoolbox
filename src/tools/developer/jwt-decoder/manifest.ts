/**
 * TOOLBOX v0.11.0 — JWT Decoder manifest + registration
 * Registry/Runner/Search/Routing 계약 재사용. 기존 도구 무수정.
 * 디코딩 전용임을 명시 — 검증·인증을 주장하지 않는다.
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const jwtManifest: ToolManifest = {
  id: "jwt-decoder",
  version: "0.13.3",
  title: "JWT Decoder — 토큰 구조·만료 확인 (서명 미검증)",
  slug: "jwt-decoder",
  category: "developer",
  description:
    "JWT를 서버 전송 없이 디코딩해 Header·Payload·만료 시각을 확인합니다. 서명 검증은 하지 않습니다.",
  keywords: ["jwt", "jwt decoder", "jwt 디코딩", "토큰 확인", "json web token", "만료 확인"],
  aliases: ["jwt", "jwt 디코딩", "jwt decoder", "토큰 디코딩", "jwt 확인"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["base64", "json-formatter", "url-parser"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...jwtManifest, load: undefined as never },
      validate: processor.validateJwt,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processJwt(input as never);
      },
      render: ui.renderJwt,
    };
  },};

export function registerJwt(): void {
  registerTool(jwtManifest);
}

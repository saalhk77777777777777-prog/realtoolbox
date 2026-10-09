/**
 * TOOLBOX v0.11.0 — Color Extractor manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const colorManifest: ToolManifest = {
  id: "color-extractor",
  version: "0.13.3",
  title: "Color Extractor — 이미지 색상 추출",
  slug: "color-extractor",
  category: "image",
  description:
    "이미지에서 주요 색상을 추출합니다. HEX/RGB/HSL 변환, 서버 전송 없음.",
  keywords: ["color extractor", "색상 추출", "palette", "팔레트", "color picker", "색상 추출"],
  aliases: ["색상 추출", "color extractor", "이미지 색상", "컬러 팔레트"],
  inputTypes: ["file"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["image-compressor", "image-resizer", "image-converter"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...colorManifest, load: undefined as never },
      validate: processor.validateColor,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processColor(input as never);
      },
      render: ui.renderColor,
    };
  },};

export function registerColor(): void {
  registerTool(colorManifest);
}

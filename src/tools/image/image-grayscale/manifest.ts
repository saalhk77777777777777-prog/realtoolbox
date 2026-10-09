/** TOOLBOX v0.14.0 — image-grayscale */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const manifest: ToolManifest = {
  id: "image-grayscale", version: "0.14.0", title: "Image Grayscale — 흑백 변환", slug: "image-grayscale", category: "image",
  description: "Image Grayscale을 브라우저에서 로컬 처리합니다.",
  keywords: ["image-grayscale", "image", "이미지"], aliases: ["Image Grayscale", "이미지"],
  inputTypes: ["file"], outputTypes: ["file", "text"], localProcessing: true,
  relatedTools: ["image-compressor", "image-converter", "image-resizer"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...manifest, load: undefined as never },
      validate: processor.validate,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.process(input as never);
      },
      render: ui.render,
    };
  },
};

export function register(): void { registerTool(manifest); }

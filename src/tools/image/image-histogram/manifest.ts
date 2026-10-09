/** TOOLBOX v0.14.0 — image-histogram */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const manifest: ToolManifest = {
  id: "image-histogram", version: "0.14.0", title: "Image Histogram — 이미지 히스토그램", slug: "image-histogram", category: "image",
  description: "Image Histogram을 브라우저에서 로컬 처리합니다.",
  keywords: ["image-histogram", "image", "이미지"], aliases: ["Image Histogram", "이미지"],
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

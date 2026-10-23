/** TOOLBOX v0.21.0 — JSON Patch Builder manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "json-patch-builder", version: "0.21.0", title: "JSON Patch Builder", slug: "json-patch-builder", category: "developer",
  description: "두 JSON 문서를 비교해 RFC 6902 JSON Patch 작업 목록을 생성합니다.",
  keywords: ["JSON Patch", "RFC 6902", "JSON diff", "JSON 비교", "API patch", "JSON 변경사항"],
  aliases: ["JSON 패치 생성기", "JSON 변경사항 생성기", "JSON Patch 빌더"], inputTypes: ["text"], outputTypes: ["text", "data"], localProcessing: true,
  relatedTools: ["json-diff", "json-formatter", "json-path-finder"],
  load: async () => {
    const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validate,
      process: async (input, context) => { if (context.signal.aborted) throw Error("cancelled"); return p.process(input); }, render: u.render };
  },
};
export function registerJsonPatchBuilder(): void { registerTool(manifest); }

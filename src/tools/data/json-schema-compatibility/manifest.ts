/** TOOLBOX v0.15.0 — JSON Schema Compatibility Checker. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "json-schema-compatibility", version: "0.15.0", title: "JSON Schema Compatibility Checker",
  slug: "json-schema-compatibility", category: "data",
  description: "두 JSON Schema를 비교해 필드·타입·필수 조건의 호환성 문제를 찾습니다.",
  keywords: ["JSON Schema", "schema diff", "호환성", "스키마 비교"],
  aliases: ["JSON 스키마 호환성 검사기"], inputTypes: ["text"], outputTypes: ["text", "data"],
  localProcessing: true, relatedTools: [],
  load: async () => { const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]); return { manifest: { ...manifest, load: undefined as never }, validate: p.validate, process: async (i, c) => { if (c.signal.aborted) throw Error("cancelled"); return p.process(i); }, render: u.render }; }
};
export function registerJsonSchemaCompatibility(): void { registerTool(manifest); }

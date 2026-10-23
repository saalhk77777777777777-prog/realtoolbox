/** TOOLBOX v0.15.0 — Bit Field Inspector. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "bit-field-inspector", version: "0.15.0", title: "Bit Field Inspector", slug: "bit-field-inspector",
  category: "developer", description: "정수의 비트 표현과 설정된 비트 위치, 마스크 값을 분석합니다.",
  keywords: ["bit field", "bitmask", "binary", "비트 필드", "비트 마스크"],
  aliases: ["비트 필드 해석기"], inputTypes: ["text"], outputTypes: ["text", "data"], localProcessing: true, relatedTools: [],
  load: async () => { const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]); return { manifest: { ...manifest, load: undefined as never }, validate: p.validate, process: async (i, c) => { if (c.signal.aborted) throw Error("cancelled"); return p.process(i); }, render: u.render }; }
};
export function registerBitFieldInspector(): void { registerTool(manifest); }

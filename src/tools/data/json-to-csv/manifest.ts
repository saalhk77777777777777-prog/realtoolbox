/**
 * TOOLBOX v0.11.0 — JSON → CSV 변환기 manifest
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const jsontocsvManifest: ToolManifest = {
  id: "json-to-csv",
  version: "0.13.3",
  title: "JSON → CSV 변환기",
  slug: "json-to-csv",
  category: "data",
  description: "JSON 배열을 CSV로 변환합니다. 중첩 값은 JSON 문자열로 보존하며 브라우저에서 처리합니다.",
  keywords: ["json", "csv", "convert", "export", "변환"],
  aliases: ["JSON CSV", "json csv 변환"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: [],
  load: async () => {
    const [processor, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...jsontocsvManifest, load: undefined as never }, validate: processor.validate, process: async (input: unknown, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return processor.process(input as never); }, render: ui.render };
  },
};

export function registerJsonToCsv(): void { registerTool(jsontocsvManifest); }

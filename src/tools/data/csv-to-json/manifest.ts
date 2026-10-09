/**
 * TOOLBOX v0.11.0 — CSV → JSON 변환기 manifest
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const csvtojsonManifest: ToolManifest = {
  id: "csv-to-json",
  version: "0.13.3",
  title: "CSV → JSON 변환기",
  slug: "csv-to-json",
  category: "data",
  description: "첫 행을 컬럼명으로 사용해 CSV를 JSON 배열로 변환합니다. 따옴표와 쉼표가 포함된 필드를 지원합니다.",
  keywords: ["csv", "json", "convert", "import", "변환"],
  aliases: ["CSV JSON", "csv json 변환"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: [],
  load: async () => {
    const [processor, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...csvtojsonManifest, load: undefined as never }, validate: processor.validate, process: async (input: unknown, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return processor.process(input as never); }, render: ui.render };
  },
};

export function registerCsvToJson(): void { registerTool(csvtojsonManifest); }

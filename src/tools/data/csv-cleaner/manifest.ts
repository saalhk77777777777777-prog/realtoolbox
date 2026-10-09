/**
 * TOOLBOX v0.11.0 — CSV Cleaner manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const csvManifest: ToolManifest = {
  id: "csv-cleaner",
  version: "0.13.3",
  title: "CSV Cleaner — CSV 정리·중복 제거",
  slug: "csv-cleaner",
  category: "data",
  description:
    "CSV의 빈 행·중복 행·공백을 진단하고 선택적으로 정리합니다. 서버로 전송되지 않습니다.",
  keywords: ["csv", "csv cleaner", "csv 정리", "중복 제거", "빈 행", "공백 제거"],
  aliases: ["csv 정리", "csv cleaner", "csv 중복 제거", "csv 빈 행"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: ["json-formatter", "text-counter", "regex-tester"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...csvManifest, load: undefined as never },
      validate: processor.validateCsv,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processCsv(input as never);
      },
      render: ui.renderCsv,
    };
  },};

export function registerCsv(): void {
  registerTool(csvManifest);
}

/**
 * TOOLBOX v0.11.0 — CSV→Chart manifest + registration
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const chartManifest: ToolManifest = {
  id: "csv-chart",
  version: "0.13.3",
  title: "CSV → Chart — 데이터 시각화",
  slug: "csv-chart",
  category: "data",
  description:
    "CSV 데이터를 bar/line/pie 차트로 시각화합니다. 서버로 전송되지 않습니다.",
  keywords: ["csv chart", "csv 차트", "데이터 시각화", "bar chart", "line chart", "pie chart"],
  aliases: ["csv 차트", "csv chart", "데이터 시각화", "차트 만들기"],
  inputTypes: ["text"],
  outputTypes: ["image"],
  localProcessing: true,
  relatedTools: ["csv-cleaner", "json-formatter", "text-counter"],
  load: async () => {
    const [processor, ui] = await Promise.all([
      import("./processor.ts"),
      import("./ui.ts"),
    ]);
    return {
      manifest: { ...chartManifest, load: undefined as never },
      validate: processor.validateChart,
      process: async (input: unknown, ctx) => {
        if (ctx.signal.aborted) throw new Error("cancelled");
        return processor.processChart(input as never);
      },
      render: ui.renderChartUi,
    };
  },};

export function registerChart(): void {
  registerTool(chartManifest);
}

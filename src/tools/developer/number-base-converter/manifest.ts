/**
 * TOOLBOX v0.11.0 — Number Base Converter — 진법 변환 manifest
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const numberbaseconverterManifest: ToolManifest = {
  id: "number-base-converter",
  version: "0.13.3",
  title: "Number Base Converter — 진법 변환",
  slug: "number-base-converter",
  category: "developer",
  description: "2진수, 8진수, 10진수, 16진수 사이의 숫자를 안전하게 변환합니다.",
  keywords: ["binary", "hex", "decimal", "octal", "진법", "2진수", "16진수"],
  aliases: ["진법 변환", "2진수 변환", "hex 변환"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: [],
  load: async () => {
    const [processor, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...numberbaseconverterManifest, load: undefined as never }, validate: processor.validate, process: async (input: unknown, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return processor.process(input as never); }, render: ui.render };
  },
};

export function registerNumberBaseConverter(): void { registerTool(numberbaseconverterManifest); }

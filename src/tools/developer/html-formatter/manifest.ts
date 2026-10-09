/**
 * TOOLBOX v0.11.0 — HTML Formatter — HTML 정리 manifest
 */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";

export const htmlformatterManifest: ToolManifest = {
  id: "html-formatter",
  version: "0.13.3",
  title: "HTML Formatter — HTML 정리",
  slug: "html-formatter",
  category: "developer",
  description: "HTML을 읽기 쉽게 들여쓰기해 정리합니다. 브라우저에서 입력 내용을 로컬 처리합니다.",
  keywords: ["html", "formatter", "pretty", "indent", "markup", "정리"],
  aliases: ["HTML 정리", "html pretty", "HTML formatter"],
  inputTypes: ["text"],
  outputTypes: ["text"],
  localProcessing: true,
  relatedTools: [],
  load: async () => {
    const [processor, ui] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...htmlformatterManifest, load: undefined as never }, validate: processor.validate, process: async (input: unknown, ctx) => { if (ctx.signal.aborted) throw new Error("cancelled"); return processor.process(input as never); }, render: ui.render };
  },
};

export function registerHtmlFormatter(): void { registerTool(htmlformatterManifest); }

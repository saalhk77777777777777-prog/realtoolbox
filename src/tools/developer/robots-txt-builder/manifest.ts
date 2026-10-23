/** TOOLBOX v0.20.0 — robots.txt Builder manifest. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "robots-txt-builder", version: "0.20.0", title: "robots.txt Builder", slug: "robots-txt-builder", category: "developer",
  description: "검색 로봇용 robots.txt 규칙을 생성하고 경로·사이트맵 설정을 검사합니다.",
  keywords: ["robots.txt", "SEO", "crawler", "search engine", "sitemap", "검색엔진", "크롤링", "검색 로봇"],
  aliases: ["로봇 텍스트 생성기", "robots.txt 생성기", "검색엔진 크롤링 설정"], inputTypes: ["text"], outputTypes: ["text", "data"], localProcessing: true,
  relatedTools: ["url-list-validator", "nginx-config-generator", "http-header-formatter"],
  load: async () => {
    const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validate,
      process: async (input, context) => { if (context.signal.aborted) throw Error("cancelled"); return p.process(input); }, render: u.render };
  },
};
export function registerRobotsTxtBuilder(): void { registerTool(manifest); }

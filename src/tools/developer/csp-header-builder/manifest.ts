/** TOOLBOX v0.19.0 — Content Security Policy Header Builder. */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "csp-header-builder", version: "0.19.0", title: "CSP Header Builder", slug: "csp-header-builder", category: "developer",
  description: "Content-Security-Policy 헤더를 만들고 위험한 정책 설정을 점검합니다.",
  keywords: ["CSP", "Content-Security-Policy", "security headers", "XSS", "web security", "콘텐츠 보안 정책", "보안 헤더"],
  aliases: ["콘텐츠 보안 정책 생성기", "CSP 생성기", "CSP 헤더 빌더"], inputTypes: ["text"], outputTypes: ["text", "data"], localProcessing: true,
  relatedTools: ["http-header-formatter", "html-escape-converter", "url-list-validator"],
  load: async () => {
    const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validate,
      process: async (input, context) => { if (context.signal.aborted) throw Error("cancelled"); return p.process(input); }, render: u.render };
  },
};
export function registerCspHeaderBuilder(): void { registerTool(manifest); }

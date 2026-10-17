/** TOOLBOX v0.14.79 — APK Editor manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const manifest: ToolManifest = {
  id: "apk-editor", version: "0.14.79", title: "APK 편집기", slug: "apk-editor",
  category: "file",
  description: "APK 아이콘·이미지 미리보기, APK 리소스 교체, ZIP 기반 Unity/OBB 아카이브 탐색을 브라우저에서 처리합니다. 서버 업로드 없음.",
  keywords: ["apk 편집기", "apk 분석", "android apk", "manifest", "dex 분석", "앱 리소스 편집", "unity asset", "obb 압축 해제", "apk icon preview"],
  aliases: ["APK Editor", "APK 분석기", "안드로이드 APK 편집"],
  inputTypes: ["file"], outputTypes: ["analysis", "file"], localProcessing: true,
  relatedTools: ["zip-inspector", "file-checksum"],
  load: async () => {
    const [p, u] = await Promise.all([import("./processor.ts"), import("./ui.ts")]);
    return { manifest: { ...manifest, load: undefined as never }, validate: p.validate,
      process: async (input, ctx) => { if (ctx.signal.aborted) throw new Error("작업이 취소되었습니다."); return p.process(input as { file: File }); },
      render: u.render };
  },
};
export function registerApkEditor(): void { registerTool(manifest); }
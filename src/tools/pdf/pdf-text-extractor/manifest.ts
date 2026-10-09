/** TOOLBOX v0.14.1 — PDF Text Extractor manifest */
import type { ToolManifest } from "../../../core/types.ts";
import { registerTool } from "../../../core/toolRegistry.ts";
export const pdfTextManifest: ToolManifest = {
  id:"pdf-text-extractor", version:"0.14.1", title:"PDF Text Extractor — PDF 텍스트 추출", slug:"pdf-text-extractor", category:"pdf",
  description:"PDF의 실제 텍스트 레이어를 페이지별로 추출합니다. 브라우저에서 처리됩니다.", keywords:["pdf text","pdf 텍스트","텍스트 추출","pdf extractor"], aliases:["pdf 텍스트 추출","PDF 글자 추출"], inputTypes:["file"], outputTypes:["text"], localProcessing:true, relatedTools:["pdf-metadata","pdf-to-image"],
  load: async () => { const [processor,ui]=await Promise.all([import("./processor.ts"),import("./ui.ts")]); return { manifest:{...pdfTextManifest,load:undefined as never}, validate:processor.validatePdfText, process:async (input:unknown)=>processor.processPdfText(input as never), render:ui.renderPdfText }; }
};
export function registerPdfText(): void { registerTool(pdfTextManifest); }

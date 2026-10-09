/** TOOLBOX v0.14.1 — PDF Text Extractor UI */
import { getTool } from "../../../core/toolRegistry.ts";
import { runTool } from "../../../core/toolRunner.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import type { PdfTextOutput } from "./processor.ts";
export function renderPdfText(mount: HTMLElement): void {
  mount.innerHTML=`<div class="card"><div class="dropzone"><p><strong>PDF를 선택하세요</strong></p><p class="muted">텍스트는 브라우저에서만 추출됩니다.</p><input id="pt-file" type="file" accept="application/pdf" aria-label="PDF 선택"></div></div><div class="stickybar"><button id="pt-run">텍스트 추출</button><button id="pt-clear" class="secondary">지우기</button></div><div id="pt-status" class="muted">대기 중</div><div id="pt-out"></div>`;
  const fileInput=mount.querySelector<HTMLInputElement>("#pt-file")!; const status=mount.querySelector<HTMLElement>("#pt-status")!; const out=mount.querySelector<HTMLElement>("#pt-out")!; let file:File|null=null;
  fileInput.onchange=()=>{file=fileInput.files?.[0]??null; status.textContent=file?"입력 준비":"대기 중"};
  mount.querySelector("#pt-clear")!.addEventListener("click",()=>{file=null;fileInput.value="";out.innerHTML="";status.textContent="대기 중"});
  mount.querySelector("#pt-run")!.addEventListener("click",async()=>{out.innerHTML=""; if(!file){status.textContent="실패 — PDF를 선택하세요";return;} const tool=getTool("pdf-text-extractor"); if(!tool)return; status.textContent="처리 중…"; const res=await runTool(tool,{file}); if(!res.ok){status.textContent="실패";const e=document.createElement("div");e.className="error";e.textContent=toUserMessage(res.error!);out.appendChild(e);return;} const r=res.output as PdfTextOutput; status.textContent=`완료 — ${r.pageCount}페이지 · ${r.characterCount}자`; const pre=document.createElement("pre");pre.className="result";pre.textContent=r.text||"(추출된 텍스트 없음)";out.appendChild(pre); const b=document.createElement("button");b.textContent="TXT 저장";b.onclick=()=>downloadText("extracted.txt",r.text,"text/plain;charset=utf-8");out.appendChild(b);});
}

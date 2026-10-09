/** TOOLBOX 0.14.9 — File Entropy Analyzer — 파일 엔트로피 UI */
import {runTool} from "../../../core/toolRunner.ts";
import {getTool} from "../../../core/toolRegistry.ts";
import {toUserMessage} from "../../../core/errorMapper.ts";
export function render(mount:HTMLElement):void{
 mount.innerHTML=`<div class="card"><input id="fi" type="file" ><button id="run">검사</button><button id="clear" class="secondary">지우기</button></div><div id="status" class="muted">대기 중</div><div id="out"></div>`;
 const fi=mount.querySelector<HTMLInputElement>("#fi")!,out=mount.querySelector<HTMLElement>("#out")!,status=mount.querySelector<HTMLElement>("#status")!;
 mount.querySelector("#clear")!.addEventListener("click",()=>{fi.value="";out.innerHTML="";status.textContent="대기 중";});
 mount.querySelector("#run")!.addEventListener("click",async()=>{const tool=getTool("file-entropy-analyzer");if(!tool)return;status.textContent="처리 중…";out.innerHTML="";const r=await runTool(tool,{file:fi.files?.[0],files:[...(fi.files||[])]} as never);if(!r.ok){status.textContent="실패";const safeErrorNode=document.createElement("div");safeErrorNode.className="error";safeErrorNode.textContent=toUserMessage(r.error!);out.replaceChildren(safeErrorNode);return;}status.textContent="완료";const pre=document.createElement("pre");pre.textContent=JSON.stringify(r.output,null,2);out.appendChild(pre);});
}

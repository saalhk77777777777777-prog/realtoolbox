/** TOOLBOX v0.11.0 — Markdown Table Generator UI */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";

export function render(mount: HTMLElement): void {
  mount.innerHTML = '<div class="card"><label>구분자<select id="mt-del"><option value="\t">탭</option><option value=",">쉼표</option><option value="|">파이프</option><option value=";">세미콜론</option></select></label><label>데이터<textarea id="mt-in" rows="10" placeholder="이름\t나이\n철수\t15"></textarea></label><button id="mt-run">표 생성</button></div><div id="mt-status" class="muted" role="status">대기 중</div><div id="mt-out"></div>';
  const input = mount.querySelector<HTMLTextAreaElement>("#mt-in")!;
  const delimiter = mount.querySelector<HTMLSelectElement>("#mt-del")!;
  const output = mount.querySelector("#mt-out")!;
  const status = mount.querySelector("#mt-status")!;
  mount.querySelector("#mt-run")!.addEventListener("click", async () => {
    const tool = getTool("markdown-table-generator");
    if (!tool) return;
    const result = await runTool(tool, { text: input.value, delimiter: delimiter.value });
    if (!result.ok) {
      status.textContent = "실패";
      const safeErrorNode=document.createElement("div");safeErrorNode.className="error";safeErrorNode.textContent=toUserMessage(result.error!);output.replaceChildren(safeErrorNode);
      return;
    }
    const area = document.createElement("textarea");
    area.rows = 12;
    area.readOnly = true;
    area.value = (result.output as { markdown: string }).markdown;
    status.textContent = "완료";
    output.innerHTML = "<h2>Markdown</h2>";
    output.appendChild(area);
  });
}

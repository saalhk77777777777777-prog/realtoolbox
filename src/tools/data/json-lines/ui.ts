/** TOOLBOX v0.14.50 — JSON Lines UI (safe DOM output) */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";

export function render(mount: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.innerHTML = '<section class="tool-panel"><label for="jl-in">JSON / JSONL 입력<textarea id="jl-in" rows="12" style="width:100%;padding:12px" placeholder="JSON 배열 또는 JSONL을 입력하세요"></textarea></label><p><label for="jl-dir">변환 방향 <select id="jl-dir"><option value="array-to-lines">JSON 배열 → JSONL</option><option value="lines-to-array">JSONL → JSON 배열</option></select></label></p><button id="jl-run" type="button">변환</button> <button id="jl-clear" class="secondary" type="button">지우기</button><div id="jl-out" aria-live="polite"></div></section>';
  mount.replaceChildren(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#jl-in")!;
  const direction = wrap.querySelector<HTMLSelectElement>("#jl-dir")!;
  const output = wrap.querySelector<HTMLElement>("#jl-out")!;

  wrap.querySelector<HTMLButtonElement>("#jl-clear")!.addEventListener("click", () => {
    input.value = "";
    output.replaceChildren();
    input.focus();
  });

  wrap.querySelector<HTMLButtonElement>("#jl-run")!.addEventListener("click", async () => {
    const result = await runTool(getTool("json-lines")!, {
      text: input.value,
      direction: direction.value,
    });
    output.replaceChildren();
    if (!result.ok) {
      const error = document.createElement("div");
      error.className = "error";
      error.textContent = toUserMessage(result.error!);
      output.append(error);
      return;
    }

    const resultData = result.output as { text: string };
    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.rows = 12;
    textarea.style.width = "100%";
    textarea.value = resultData.text;
    const card = document.createElement("div");
    card.className = "result";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "복사";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        copy.textContent = "복사 완료";
      } catch {
        copy.textContent = "복사 실패";
      }
    });
    card.append(textarea, copy);
    output.append(card);
  });
}

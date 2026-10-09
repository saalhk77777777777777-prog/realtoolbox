/** TOOLBOX v0.14.49 — Line Numberer UI (XSS-safe output rendering) */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";

export function render(mount: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.innerHTML = '<section class="tool-panel"><label for="ln-in">텍스트<textarea id="ln-in" rows="12" style="width:100%;padding:12px" placeholder="첫 번째 줄&#10;두 번째 줄"></textarea></label><p><label><input id="ln-remove" type="checkbox"> 기존 줄 번호 제거</label></p><div class="tool-actions"><button id="ln-run" type="button">변환</button><button id="ln-clear" class="secondary" type="button">지우기</button></div><div id="ln-out" aria-live="polite"></div></section>';
  mount.replaceChildren(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#ln-in")!;
  const remove = wrap.querySelector<HTMLInputElement>("#ln-remove")!;
  const output = wrap.querySelector<HTMLElement>("#ln-out")!;

  wrap.querySelector<HTMLButtonElement>("#ln-clear")!.addEventListener("click", () => {
    input.value = "";
    output.replaceChildren();
    input.focus();
  });

  wrap.querySelector<HTMLButtonElement>("#ln-run")!.addEventListener("click", async () => {
    const result = await runTool(getTool("line-numberer")!, { text: input.value, remove: remove.checked });
    output.replaceChildren();
    if (!result.ok) {
      const error = document.createElement("p");
      error.className = "error";
      error.textContent = toUserMessage(result.error!);
      output.append(error);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.rows = 12;
    textarea.style.width = "100%";
    // Security: input text is rendered as a textarea value, never interpreted as HTML.
    textarea.value = (result.output as { text: string }).text;
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
    const card = document.createElement("div");
    card.className = "result";
    card.append(textarea, copy);
    output.append(card);
  });
}

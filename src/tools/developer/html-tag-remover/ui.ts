/** TOOLBOX v0.14.50 — HTML Tag Remover UI (safe DOM output) */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";

export function render(mount: HTMLElement): void {
  mount.innerHTML = '<section class="tool-panel"><label for="htr-in">HTML / 텍스트 입력<textarea id="htr-in" rows="10" style="width:100%;padding:12px" placeholder="입력…"></textarea></label><div class="tool-actions"><button id="htr-run" type="button">태그 제거</button><button id="htr-clear" class="secondary" type="button">지우기</button></div><div id="htr-out" aria-live="polite"></div></section>';
  const input = mount.querySelector<HTMLTextAreaElement>("#htr-in")!;
  const output = mount.querySelector<HTMLElement>("#htr-out")!;

  mount.querySelector<HTMLButtonElement>("#htr-clear")!.addEventListener("click", () => {
    input.value = "";
    output.replaceChildren();
    input.focus();
  });

  mount.querySelector<HTMLButtonElement>("#htr-run")!.addEventListener("click", async () => {
    const result = await runTool(getTool("html-tag-remover")!, { text: input.value });
    output.replaceChildren();
    if (!result.ok) {
      const error = document.createElement("div");
      error.className = "error";
      error.textContent = toUserMessage(result.error!);
      output.append(error);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.rows = 10;
    textarea.style.width = "100%";
    textarea.value = (result.output as { text: string }).text;
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

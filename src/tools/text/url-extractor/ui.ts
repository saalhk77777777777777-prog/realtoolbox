/** TOOLBOX v0.14.52 — url-extractor UI (safe DOM output) */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";

export function render(mount: HTMLElement): void {
  mount.innerHTML = '<section class="tool-panel"><label for="safe-in">입력<textarea id="safe-in" rows="10" style="width:100%;padding:12px" placeholder="입력…"></textarea></label><div class="tool-actions"><button id="safe-run" type="button">URL 추출</button><button id="safe-clear" class="secondary" type="button">지우기</button></div><div id="safe-out" aria-live="polite"></div></section>';
  const input = mount.querySelector<HTMLTextAreaElement>("#safe-in")!;
  const output = mount.querySelector<HTMLElement>("#safe-out")!;
  mount.querySelector<HTMLButtonElement>("#safe-clear")!.addEventListener("click", () => {
    input.value = "";
    output.replaceChildren();
    input.focus();
  });
  mount.querySelector<HTMLButtonElement>("#safe-run")!.addEventListener("click", async () => {
    const result = await runTool(getTool("url-extractor")!, { text: input.value });
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
    output.append(textarea);
  });
}

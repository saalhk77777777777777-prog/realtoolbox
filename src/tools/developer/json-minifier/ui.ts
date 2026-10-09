/** TOOLBOX v0.14.48 — JSON Minifier UI (XSS-safe output rendering) */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";

export function render(mount: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.innerHTML = '<section class="tool-panel"><label for="jm-in">JSON 입력<textarea id="jm-in" rows="12" style="width:100%;padding:12px" placeholder="JSON을 입력하세요"></textarea></label><div class="tool-actions"><button id="jm-run" type="button">압축</button><button id="jm-clear" class="secondary" type="button">지우기</button></div><div id="jm-out" aria-live="polite"></div></section>';
  mount.replaceChildren(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#jm-in")!;
  const output = wrap.querySelector<HTMLElement>("#jm-out")!;

  wrap.querySelector<HTMLButtonElement>("#jm-clear")!.addEventListener("click", () => {
    input.value = "";
    output.replaceChildren();
    input.focus();
  });

  wrap.querySelector<HTMLButtonElement>("#jm-run")!.addEventListener("click", async () => {
    const result = await runTool(getTool("json-minifier")!, { text: input.value });
    output.replaceChildren();
    if (!result.ok) {
      const error = document.createElement("p");
      error.className = "error";
      error.textContent = toUserMessage(result.error!);
      output.append(error);
      return;
    }

    const data = result.output as { json: string; saved: number };
    const card = document.createElement("div");
    card.className = "result";
    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.rows = 8;
    textarea.style.width = "100%";
    // Security: never parse user-controlled JSON as HTML.
    textarea.value = data.json;

    const info = document.createElement("p");
    info.textContent = "약 " + data.saved.toLocaleString() + "자 절약";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "복사";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(data.json);
        copy.textContent = "복사 완료";
      } catch {
        copy.textContent = "복사 실패";
      }
    });
    card.append(textarea, info, copy);
    output.append(card);
  });
}

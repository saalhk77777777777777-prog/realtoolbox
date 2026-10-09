/**
 * TOOLBOX v0.6.6 — Text Diff UI
 * 기존 UI 계약 준수. 좌우 텍스트 입력 + 비교 결과.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { DiffInput, DiffOutput } from "./processor.ts";

export function renderDiff(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="grid two">
        <div>
          <p><label for="df-left"><strong>좌측 텍스트</strong></label></p>
          <textarea id="df-left" rows="8" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="원본 텍스트…" aria-label="좌측 텍스트"></textarea>
        </div>
        <div>
          <p><label for="df-right"><strong>우측 텍스트</strong></label></p>
          <textarea id="df-right" rows="8" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="비교할 텍스트…" aria-label="우측 텍스트"></textarea>
        </div>
      </div>
    </div>
    <div class="stickybar">
      <button id="run" type="button">비교하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>좌우에 비교할 텍스트를 입력합니다.</li>
        <li>비교하기를 누르면 줄 단위 차이가 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>어떤 단위로 비교하나요?</strong> 줄 단위입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const leftInput = wrap.querySelector<HTMLTextAreaElement>("#df-left")!;
  const rightInput = wrap.querySelector<HTMLTextAreaElement>("#df-right")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  const syncStatus = (): void => {
    setStatus(leftInput.value.length === 0 && rightInput.value.length === 0 ? "대기 중 (idle)" : "입력 준비 (input-ready)");
  };
  leftInput.addEventListener("input", syncStatus);
  rightInput.addEventListener("input", syncStatus);
  clearBtn.addEventListener("click", () => {
    leftInput.value = "";
    rightInput.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    leftInput.focus();
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("text-diff");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: DiffInput = { left: leftInput.value, right: rightInput.value };
    setStatus("처리 중 (processing)…");
    const res = await runTool(manifest, data);
    if (!res.ok) {
      setStatus("실패 (failed)");
      const d = document.createElement("div");
      d.className = "error";
      d.textContent = toUserMessage(res.error!);
      out.appendChild(d);
      return;
    }
    const r = res.output as DiffOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = `비교 결과 — +${r.addedCount} / -${r.removedCount} / ${r.unchangedCount} 동일`;
    card.appendChild(h);

    const list = document.createElement("div");
    for (const line of r.lines) {
      const div = document.createElement("div");
      const prefix = line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  ";
      div.textContent = prefix + line.text;
      if (line.type === "added") div.style.color = "var(--ok)";
      else if (line.type === "removed") div.style.color = "var(--danger)";
      div.style.fontFamily = "monospace";
      div.style.whiteSpace = "pre-wrap";
      list.appendChild(div);
    }
    card.appendChild(list);

    const btns = document.createElement("p");
    const cp = document.createElement("button");
    cp.type = "button";
    cp.textContent = "복사";
    const dl = document.createElement("button");
    dl.type = "button";
    dl.className = "secondary";
    dl.textContent = ".txt 내려받기";
    btns.appendChild(cp);
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: Case Converter · Whitespace Cleaner · Slug Generator";
    card.appendChild(next);

    const text = r.lines.map((l) => (l.type === "added" ? "+ " : l.type === "removed" ? "- " : "  ") + l.text).join("\n");
    cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    dl.addEventListener("click", () => {
      track("download", { tool: "text-diff" });
      downloadText("diff.txt", text, "text/plain");
    });
  });
}

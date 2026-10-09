/**
 * TOOLBOX v0.6.1 — Case Converter UI
 * 기존 UI 계약 준수. 텍스트 입력 + 모드 선택 + 결과.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { CaseInput, CaseOutput } from "./processor.ts";

export function renderCase(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <p><label for="case-input"><strong>텍스트 입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="case-input" rows="6" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="변환할 텍스트…" aria-label="변환할 텍스트"></textarea>
      <p style="margin-top:8px;">
        <label for="case-mode">변환 모드</label>
        <select id="case-mode">
          <option value="lower" selected>소문자 (lowercase)</option>
          <option value="upper">대문자 (UPPERCASE)</option>
          <option value="title">Title Case</option>
          <option value="camel">camelCase</option>
          <option value="pascal">PascalCase</option>
          <option value="snake">snake_case</option>
          <option value="kebab">kebab-case</option>
        </select>
      </p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">변환하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>텍스트를 입력합니다.</li>
        <li>변환 모드를 선택합니다.</li>
        <li>변환하기를 누르고 결과를 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>지원 모드는?</strong> lower, upper, title, camelCase, PascalCase, snake_case, kebab-case입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#case-input")!;
  const modeSel = wrap.querySelector<HTMLSelectElement>("#case-mode")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  input.addEventListener("input", () => {
    setStatus(input.value.length === 0 ? "대기 중 (idle)" : "입력 준비 (input-ready)");
  });
  clearBtn.addEventListener("click", () => {
    input.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    input.focus();
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("case-converter");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: CaseInput = { text: input.value, mode: modeSel.value as CaseInput["mode"] };
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
    const r = res.output as CaseOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = `결과 — ${r.mode}`;
    card.appendChild(h);

    const pre = document.createElement("textarea");
    pre.rows = 6;
    pre.readOnly = true;
    pre.style.width = "100%";
    pre.style.fontSize = "16px";
    pre.setAttribute("aria-label", "변환 결과");
    pre.value = r.result;
    card.appendChild(pre);

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
    next.textContent = "다음 작업: Whitespace Cleaner · Line Sorter · Slug Generator";
    card.appendChild(next);

    cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(r.result);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    dl.addEventListener("click", () => {
      track("download", { tool: "case-converter" });
      downloadText(`case-${r.mode}.txt`, r.result, "text/plain");
    });
  });
}

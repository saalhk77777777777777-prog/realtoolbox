/**
 * TOOLBOX v0.6.5 — Slug Generator UI
 * 기존 UI 계약 준수. 텍스트 입력 + 옵션 + 결과.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { SlugInput, SlugOutput } from "./processor.ts";

export function renderSlug(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <p><label for="sg-input"><strong>텍스트 입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="sg-input" rows="4" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="변환할 텍스트…" aria-label="변환할 텍스트"></textarea>
      <p style="margin-top:8px;">
        <label for="sg-sep">구분자</label>
        <select id="sg-sep" aria-label="구분자" style="padding:8px;">
          <option value="-" selected>-</option>
          <option value="_">_</option>
        </select>
        <label><input type="checkbox" id="sg-lower" checked /> 소문자로 변환</label>
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
        <li>구분자와 소문자 변환 여부를 선택합니다.</li>
        <li>변환하기를 누르고 결과를 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>Unicode 문자는 어떻게 처리되나요?</strong> 정규화되어 ASCII로 변환됩니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#sg-input")!;
  const sepInput = wrap.querySelector<HTMLSelectElement>("#sg-sep")!;
  const lowerChk = wrap.querySelector<HTMLInputElement>("#sg-lower")!;
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
    const manifest = getTool("slug-generator");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: SlugInput = {
      text: input.value,
      separator: sepInput.value,
      lowercase: lowerChk.checked,
    };
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
    const r = res.output as SlugOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "결과";
    card.appendChild(h);

    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `원본 ${r.originalLength.toLocaleString()}자 → slug ${r.slugLength.toLocaleString()}자`;
    card.appendChild(info);

    const pre = document.createElement("textarea");
    pre.rows = 3;
    pre.readOnly = true;
    pre.style.width = "100%";
    pre.style.fontSize = "16px";
    pre.setAttribute("aria-label", "생성된 slug");
    pre.value = r.slug;
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
    next.textContent = "다음 작업: Case Converter · Whitespace Cleaner · Duplicate Line Remover";
    card.appendChild(next);

    cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(r.slug);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    dl.addEventListener("click", () => {
      track("download", { tool: "slug-generator" });
      downloadText("slug.txt", r.slug, "text/plain");
    });
  });
}

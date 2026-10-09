/**
 * TOOLBOX v0.3.1 — CSV Cleaner UI
 * 기존 UI 계약 준수. 결과는 textarea.value + textContent로만 표시.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { CsvInput, CsvOutput } from "./processor.ts";
import { toCsv } from "./processor.ts";

export function renderCsv(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <p><label for="csv-input"><strong>CSV 입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="csv-input" rows="8" style="width:100%;padding:12px;font-size:14px;font-family:monospace;border:1px solid var(--border);border-radius:var(--radius);" placeholder="name,age,city&#10;Alice,30,Seoul&#10;Bob,25,Busan" aria-label="CSV 입력"></textarea>
      <p style="margin-top:8px;">
        <label for="csv-delimiter">구분자</label>
        <select id="csv-delimiter">
          <option value="," selected>쉼표 (,)</option>
          <option value="\t">탭 (\\t)</option>
        </select>
      </p>
      <p>
        <label><input type="checkbox" id="csv-remove-empty" checked /> 빈 행 제거</label><br />
        <label><input type="checkbox" id="csv-remove-dup" checked /> 중복 행 제거</label><br />
        <label><input type="checkbox" id="csv-trim" checked /> 공백 제거</label>
      </p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">분석하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>CSV 텍스트를 입력합니다.</li>
        <li>구분자와 정리 옵션을 선택합니다.</li>
        <li>분석하기를 누르면 진단 결과와 정리된 미리보기가 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>CSV란?</strong> Comma-Separated Values의 약자로, 표 형식 데이터를 텍스트로 저장하는 형식입니다.</li>
        <li><strong>빈 행이란?</strong> 데이터가 없는 행입니다. 보통 제거하는 것이 안전합니다.</li>
        <li><strong>중복 행이란?</strong> 완전히 동일한 데이터가 여러 번 있는 경우입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#csv-input")!;
  const delimiterSel = wrap.querySelector<HTMLSelectElement>("#csv-delimiter")!;
  const removeEmpty = wrap.querySelector<HTMLInputElement>("#csv-remove-empty")!;
  const removeDup = wrap.querySelector<HTMLInputElement>("#csv-remove-dup")!;
  const trim = wrap.querySelector<HTMLInputElement>("#csv-trim")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  input.addEventListener("input", () => {
    setStatus(input.value.trim().length === 0 ? "대기 중 (idle)" : "입력 준비 (input-ready)");
  });
  clearBtn.addEventListener("click", () => {
    input.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    input.focus();
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("csv-cleaner");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: CsvInput = {
      text: input.value,
      delimiter: delimiterSel.value as "," | "\t",
      removeEmptyRows: removeEmpty.checked,
      removeDuplicateRows: removeDup.checked,
      trimWhitespace: trim.checked,
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
    const r = res.output as CsvOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = `결과 — ${r.cleanedRowCount}행 (원본 ${r.originalRowCount}행)`;
    card.appendChild(h);

    if (r.diagnostics.length > 0) {
      const warn = document.createElement("div");
      warn.className = "card";
      warn.style.background = "#fffbeb";
      warn.style.borderColor = "#fde68a";
      const wh = document.createElement("h3");
      wh.textContent = `진단 (${r.diagnostics.length}건)`;
      const ul = document.createElement("ul");
      for (const d of r.diagnostics) {
        const li = document.createElement("li");
        li.textContent = `[${d.type}] ${d.message}`;
        ul.appendChild(li);
      }
      warn.appendChild(wh);
      warn.appendChild(ul);
      card.appendChild(warn);
    }

    const pre = document.createElement("textarea");
    pre.rows = 8;
    pre.readOnly = true;
    pre.style.width = "100%";
    pre.style.fontFamily = "monospace";
    pre.style.fontSize = "14px";
    pre.setAttribute("aria-label", "정리된 CSV 미리보기");
    pre.value = toCsv(r.headers, r.rows, data.delimiter);
    card.appendChild(pre);

    const btns = document.createElement("p");
    const cp = document.createElement("button");
    cp.type = "button";
    cp.textContent = "복사";
    const dl = document.createElement("button");
    dl.type = "button";
    dl.className = "secondary";
    dl.textContent = ".csv 내려받기";
    btns.appendChild(cp);
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: JSON Formatter · Text Counter · Regex Tester";
    card.appendChild(next);

    cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.value);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    dl.addEventListener("click", () => {
      track("download", { tool: "csv-cleaner" });
      downloadText("cleaned.csv", pre.value, "text/csv");
    });
  });
}

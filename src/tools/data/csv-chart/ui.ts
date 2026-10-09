/**
 * TOOLBOX v0.3.2 — CSV→Chart UI
 * 기존 UI 계약 준수. Canvas 기반 차트 렌더링.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { ChartInput, ChartOutput } from "./processor.ts";
import { renderChart } from "./processor.ts";

export function renderChartUi(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <p><label for="chart-input"><strong>CSV 입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="chart-input" rows="6" style="width:100%;padding:12px;font-size:14px;font-family:monospace;border:1px solid var(--border);border-radius:var(--radius);" placeholder="name,value&#10;Alice,30&#10;Bob,25" aria-label="CSV 입력"></textarea>
      <p style="margin-top:8px;">
        <label for="chart-x">X축 열</label>
        <input type="text" id="chart-x" placeholder="name" aria-label="X축 열" />
        <label for="chart-y">Y축 열</label>
        <input type="text" id="chart-y" placeholder="value" aria-label="Y축 열" />
      </p>
      <p>
        <label for="chart-type">차트 타입</label>
        <select id="chart-type">
          <option value="bar" selected>막대 (bar)</option>
          <option value="line">선 (line)</option>
          <option value="pie">원형 (pie)</option>
        </select>
      </p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">차트 생성</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>CSV를 입력합니다.</li>
        <li>X축/Y축 열 이름과 차트 타입을 선택합니다.</li>
        <li>차트 생성을 누르면 차트가 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>지원 차트 타입은?</strong> bar, line, pie입니다. scatter/area는 향후 버전에서 지원합니다.</li>
        <li><strong>Y축 값이 숫자가 아니면?</strong> 오류로 처리됩니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#chart-input")!;
  const xInput = wrap.querySelector<HTMLInputElement>("#chart-x")!;
  const yInput = wrap.querySelector<HTMLInputElement>("#chart-y")!;
  const typeSel = wrap.querySelector<HTMLSelectElement>("#chart-type")!;
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
    const manifest = getTool("csv-chart");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: ChartInput = {
      text: input.value,
      xColumn: xInput.value.trim(),
      yColumn: yInput.value.trim(),
      chartType: typeSel.value as ChartInput["chartType"],
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
    const r = res.output as ChartOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = `차트 — ${r.chartType} (${r.rowCount}개 데이터)`;
    card.appendChild(h);

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.maxWidth = "100%";
    canvas.style.border = "1px solid var(--border)";
    canvas.setAttribute("aria-label", "생성된 차트");
    card.appendChild(canvas);
    renderChart(canvas, r);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "PNG 내려받기";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: CSV Cleaner · JSON Formatter · Text Counter";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "csv-chart" });
      const link = document.createElement("a");
      link.download = `chart-${r.chartType}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  });
}

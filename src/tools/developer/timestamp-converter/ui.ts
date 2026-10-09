/**
 * TOOLBOX v0.1.7 — Timestamp Converter UI
 * 기존 UI 계약 준수: 방향/단위/시간대 선택, stickybar 실행/지우기,
 * role=status 상태 전이, result/error 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 * 시간대 의존성은 출력에 zone명 병기로 명시한다.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type {
  TimestampDirection,
  TimestampInput,
  TimestampOutput,
  TimestampUnit,
  InputZone,
} from "./processor.ts";

export function renderTimestamp(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "local";

  wrap.innerHTML = `
    <div class="card">
      <div role="radiogroup" aria-label="변환 방향">
        <label><input type="radio" name="tsdir" value="toDate" checked /> Timestamp → 날짜</label>
        <label><input type="radio" name="tsdir" value="toTimestamp" /> 날짜 → Timestamp</label>
      </div>
      <div role="radiogroup" aria-label="timestamp 단위" id="unitrow" style="margin-top:8px;">
        <label><input type="radio" name="tsunit" value="seconds" checked /> 초(seconds)</label>
        <label><input type="radio" name="tsunit" value="milliseconds" /> 밀리초(milliseconds)</label>
        <label><input type="radio" name="tsunit" value="auto" /> 자동 <span class="muted">(≤10자리=초, 11~13자리=밀리초)</span></label>
      </div>
      <div style="margin-top:8px;">
        <label for="tszone">날짜 입력 시간대 <span class="muted">(zone 없는 입력에만 적용, 기본 UTC)</span></label><br />
        <select id="tszone">
          <option value="UTC" selected>UTC</option>
          <option value="KST">KST (Asia/Seoul, UTC+9)</option>
          <option value="local">브라우저 로컬 (${escapeHtml(browserZone)})</option>
        </select>
      </div>
      <p style="margin-top:12px;"><label for="ts-input"><strong>입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="ts-input" rows="4" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="예: 1700000000 · 2024-05-01T12:00:00+09:00 · 2024-05-01 12:00" aria-label="timestamp 또는 날짜 입력"></textarea>
      <p><button id="now" type="button" class="secondary">현재 시간 입력</button> <span class="muted">브라우저 시계 기준</span></p>
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
        <li>방향을 고릅니다. timestamp→날짜에서는 단위(초/밀리초/자동)를, 날짜→timestamp에서는 입력의 시간대를 고릅니다.</li>
        <li>값을 입력하고 변환하기를 누릅니다. 결과는 UTC·KST·로컬 3열로 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다. 현재 시간 버튼은 브라우저 시계를 사용합니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>결과가 사이트마다 달라요.</strong> 시간대 해석이 다르기 때문입니다. 이 도구는 UTC·KST·로컬(${escapeHtml(browserZone)})을 함께 보여주므로 기준을 확인할 수 있습니다.</li>
        <li><strong>10자리와 13자리를 어떻게 구분하나요?</strong> 자동 모드는 ≤10자리=초, 11~13자리=밀리초 규칙을 사용합니다. 확실하지 않으면 단위를 직접 선택하세요.</li>
        <li><strong>소수 timestamp는요?</strong> 정밀도 모호로 지원하지 않습니다. 정수만 입력하세요.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#ts-input")!;
  const zoneSel = wrap.querySelector<HTMLSelectElement>("#tszone")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const nowBtn = wrap.querySelector<HTMLButtonElement>("#now")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;
  const unitRow = wrap.querySelector<HTMLDivElement>("#unitrow")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };
  const direction = (): TimestampDirection =>
    wrap.querySelector<HTMLInputElement>('input[name="tsdir"]:checked')!.value as TimestampDirection;
  const unit = (): TimestampUnit =>
    wrap.querySelector<HTMLInputElement>('input[name="tsunit"]:checked')!.value as TimestampUnit;
  const zone = (): InputZone => zoneSel.value as InputZone;

  const syncUnitRow = (): void => {
    unitRow.style.opacity = direction() === "toDate" ? "1" : "0.4";
  };
  wrap.querySelectorAll<HTMLInputElement>('input[name="tsdir"]').forEach((r) => {
    r.addEventListener("change", () => {
      syncUnitRow();
      if (input.value.length > 0) setStatus("입력 준비 (input-ready)");
    });
  });
  syncUnitRow();

  input.addEventListener("input", () => {
    setStatus(input.value.trim().length === 0 ? "대기 중 (idle)" : "입력 준비 (input-ready)");
  });
  nowBtn.addEventListener("click", () => {
    input.value = direction() === "toDate" ? String(Date.now()) : new Date().toISOString();
    setStatus("입력 준비 (input-ready)");
    input.focus();
  });
  clearBtn.addEventListener("click", () => {
    input.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    input.focus();
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("timestamp-converter");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: TimestampInput = {
      text: input.value,
      direction: direction(),
      unit: direction() === "toDate" ? unit() : "seconds",
      zone: zone(),
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
    const r = res.output as TimestampOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과</h2>
      <table><thead><tr><th>항목</th><th>값</th></tr></thead><tbody>
        <tr><td>Unix 초</td><td>${r.unixSeconds.toLocaleString()}</td></tr>
        <tr><td>Unix 밀리초</td><td>${r.unixMilliseconds.toLocaleString()}</td></tr>
        <tr><td>UTC (ISO 8601)</td><td>${escapeHtml(r.utcIso)}</td></tr>
        <tr><td>KST</td><td>${escapeHtml(r.kst)}</td></tr>
        <tr><td>로컬 (${escapeHtml(r.localZone)})</td><td>${escapeHtml(r.local)}</td></tr>
      </tbody></table>
      <p class="muted">적용 단위: ${r.resolvedUnit === "seconds" ? "초" : "밀리초"} · 로컬 열은 브라우저 시간대에 따라 달라집니다.</p>
      <p>
        <button type="button" id="cp">결과 복사</button>
        <button type="button" id="dl" class="secondary">.txt 내려받기</button>
      </p>
      <p class="muted">다음 작업: Base64 · URL Encoder · JWT Decoder</p>
    `;
    out.appendChild(card);
    const summary = `unix=${r.unixSeconds} (${r.unixMilliseconds}ms), UTC=${r.utcIso}, KST=${r.kst}, local(${r.localZone})=${r.local}`;
    card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(summary);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      track("download", { tool: "timestamp-converter" });
      downloadText("timestamp-result.txt", summary, "text/plain");
    });
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

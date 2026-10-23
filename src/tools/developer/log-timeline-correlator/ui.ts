/** TOOLBOX v0.16.0 — Log Timeline Correlator UI. */
import { process as analyze, validate, type LogEvent, type LogLevel } from "./processor.ts";

const rank: Record<LogLevel, number> = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5 };
const escapeHtml = (value: unknown): string => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const iso = (value: number | null): string => value === null ? "시간 미인식" : new Date(value).toISOString();
const csvCell = (value: unknown): string => '"' + String(value ?? "").replace(/"/g, '""') + '"';

export function render(mount: HTMLElement): void {
  mount.innerHTML = `
    <style>
      .log-tool label{display:flex;flex-direction:column;gap:6px;margin:12px 0;color:var(--muted,#a8b5ce)}
      .log-tool input,.log-tool textarea,.log-tool select{box-sizing:border-box;width:100%;padding:10px;border:1px solid var(--line,#34445f);border-radius:9px;background:var(--surface,#091324);color:inherit;font:inherit}
      .log-tool textarea{font:12px/1.5 ui-monospace,Consolas,monospace;resize:vertical}
      .log-tool .tool-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
      .log-tool .tool-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:10px;margin:18px 0}
      .log-tool .tool-stats>div{display:flex;flex-direction:column;gap:3px;padding:12px;border:1px solid var(--line,#34445f);border-radius:10px;background:var(--surface,#091324)}
      .log-tool .tool-stats b{font-size:22px}.log-tool .tool-stats span,.log-tool h3 small{font-size:12px;color:var(--muted,#a8b5ce)}
      .log-tool .table-wrap{overflow:auto;margin:12px 0 20px}
      .log-tool table{width:100%;border-collapse:collapse;font-size:13px}
      .log-tool th,.log-tool td{padding:9px;border-bottom:1px solid var(--line,#34445f);text-align:left;vertical-align:top}
      .log-tool th{white-space:nowrap;color:var(--muted,#a8b5ce)}
      .log-tool .log-message{min-width:220px;white-space:pre-wrap;overflow-wrap:anywhere}
      .log-tool .log-level{display:inline-block;padding:2px 7px;border-radius:99px;font-size:11px;font-weight:800}
      .log-tool .log-level.error{background:#4a202b;color:#fca5a5}.log-tool .log-level.warning{background:#493b16;color:#fcd34d}.log-tool .log-level.normal{background:#153b2b;color:#86efac}
    </style>
    <section class="tool-panel log-tool">
      <h2>로그 입력</h2>
      <label>로그 파일 여러 개 선택<input id="log-files" type="file" accept=".log,.txt,.json,.jsonl,.ndjson,text/plain,application/json" multiple></label>
      <label>로그 원문<textarea id="log-input" rows="12" spellcheck="false" placeholder="2026-10-23T09:00:00.100Z ERROR api request_id=abc123 timeout"></textarea></label>
      <p class="muted">JSONL과 일반 텍스트 로그를 지원합니다. 여러 파일은 파일 이름으로 구분해 분석합니다. 파일은 브라우저 안에서 처리됩니다.</p>
      <div class="tool-row">
        <label>최소 등급<select id="log-min-level"><option value="TRACE">TRACE</option><option value="DEBUG">DEBUG</option><option value="INFO" selected>INFO</option><option value="WARN">WARN</option><option value="ERROR">ERROR</option><option value="FATAL">FATAL</option></select></label>
        <label>요청 ID 필터<input id="log-id-filter" placeholder="예: abc123"></label>
      </div>
      <button id="log-analyze" type="button">타임라인 분석</button>
      <button id="log-export" type="button" class="secondary" disabled>CSV 내보내기</button>
      <div id="log-results" aria-live="polite"><p class="muted">로그를 입력한 다음 분석을 시작하세요.</p></div>
    </section>`;

  const input = mount.querySelector<HTMLTextAreaElement>("#log-input")!;
  const results = mount.querySelector<HTMLDivElement>("#log-results")!;
  const fileInput = mount.querySelector<HTMLInputElement>("#log-files")!;
  const analyzeButton = mount.querySelector<HTMLButtonElement>("#log-analyze")!;
  const exportButton = mount.querySelector<HTMLButtonElement>("#log-export")!;
  const minLevel = mount.querySelector<HTMLSelectElement>("#log-min-level")!;
  const idFilter = mount.querySelector<HTMLInputElement>("#log-id-filter")!;
  let lastEvents: LogEvent[] = [];

  fileInput.addEventListener("change", async () => {
    const chunks: string[] = [];
    for (const file of Array.from(fileInput.files ?? [])) {
      chunks.push(`--- SOURCE: ${file.name} ---\n${await file.text()}`);
    }
    if (chunks.length) input.value = chunks.join("\n");
  });

  analyzeButton.addEventListener("click", () => {
    const error = validate({ logs: input.value });
    if (error) {
      results.innerHTML = `<p class="error">${escapeHtml(error.what)} ${escapeHtml(error.how)}</p>`;
      exportButton.disabled = true;
      lastEvents = [];
      return;
    }

    try {
      const analysis = analyze({ logs: input.value });
      const threshold = rank[minLevel.value as LogLevel] ?? 2;
      const idNeedle = idFilter.value.trim().toLowerCase();
      const visible = analysis.events.filter((event) =>
        rank[event.level] >= threshold && (!idNeedle || event.requestId.toLowerCase().includes(idNeedle)),
      );
      lastEvents = visible;

      const eventRows = visible.slice(0, 1000).map((event) => {
        const severity = rank[event.level] >= 4 ? "error" : rank[event.level] === 3 ? "warning" : "normal";
        return `<tr><td>${escapeHtml(iso(event.timestamp))}</td><td><span class="log-level ${severity}">${escapeHtml(event.level)}</span></td><td>${escapeHtml(event.source)}:${event.line}</td><td>${escapeHtml(event.requestId || "—")}</td><td class="log-message">${escapeHtml(event.message)}</td></tr>`;
      }).join("");

      const requestRows = analysis.requests.slice(0, 200).map((request) =>
        `<tr><td>${escapeHtml(request.requestId)}</td><td>${request.eventCount}</td><td>${escapeHtml(iso(request.firstTimestamp))}</td><td>${escapeHtml(iso(request.lastTimestamp))}</td><td>${request.durationMs === null ? "—" : (request.durationMs / 1000).toFixed(3) + " s"}</td><td>${request.errorCount}</td></tr>`,
      ).join("");

      results.innerHTML = `
        <div class="tool-stats">
          <div><b>${analysis.totalEvents}</b><span>전체 이벤트</span></div>
          <div><b>${analysis.errorCount}</b><span>오류 이벤트</span></div>
          <div><b>${analysis.warningCount}</b><span>경고 이벤트</span></div>
          <div><b>${analysis.uniqueRequestIds}</b><span>고유 요청 ID</span></div>
          <div><b>${analysis.timestampMissing}</b><span>시간 미인식</span></div>
        </div>
        <h3>통합 타임라인 <small>(필터 결과 ${visible.length}개, 최대 1,000개 표시)</small></h3>
        <div class="table-wrap"><table><thead><tr><th>시간</th><th>등급</th><th>소스:줄</th><th>요청 ID</th><th>메시지</th></tr></thead><tbody>${eventRows || '<tr><td colspan="5">현재 필터에 맞는 이벤트가 없습니다.</td></tr>'}</tbody></table></div>
        <h3>요청 ID별 요약 <small>(최대 200개)</small></h3>
        <div class="table-wrap"><table><thead><tr><th>요청 ID</th><th>이벤트 수</th><th>첫 이벤트</th><th>마지막 이벤트</th><th>경과 시간</th><th>오류 수</th></tr></thead><tbody>${requestRows || '<tr><td colspan="6">요청 ID를 인식하지 못했습니다.</td></tr>'}</tbody></table></div>
        <p class="muted">시간 형식이 인식되지 않은 항목은 타임라인 끝에 표시됩니다. 요청별 경과 시간은 인식된 타임스탬프만으로 계산합니다.</p>`;
      exportButton.disabled = visible.length === 0;
    } catch (error) {
      results.innerHTML = `<p class="error">${escapeHtml(error instanceof Error ? error.message : error)}</p>`;
      exportButton.disabled = true;
      lastEvents = [];
    }
  });

  exportButton.addEventListener("click", () => {
    const rows = [["timestamp_iso", "level", "request_id", "source", "line", "message"], ...lastEvents.map((event) => [
      event.timestamp === null ? "" : new Date(event.timestamp).toISOString(),
      event.level, event.requestId, event.source, event.line, event.message,
    ])];
    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "toolbox-log-timeline-v0.16.0.csv";
    link.click();
    URL.revokeObjectURL(url);
  });
}
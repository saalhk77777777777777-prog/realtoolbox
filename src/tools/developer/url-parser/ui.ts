/**
 * TOOLBOX v0.2.4 — URL Parser UI
 * 기존 UI 계약 준수: stickybar 분석/지우기, role=status 상태 전이,
 * result/error 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 * 결과는 DOM + textContent로만 표시한다. 사용자 입력을 링크로 만들지 않으며
 * innerHTML/insertAdjacentHTML/location 할당을 사용하지 않는다.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { UrlParserInput, UrlParserOutput } from "./processor.ts";

const ROWS: Array<{ label: string; get: (r: UrlParserOutput) => string }> = [
  { label: "원문 입력", get: (r) => r.input },
  { label: "정규화 href", get: (r) => r.href },
  { label: "protocol", get: (r) => r.protocol },
  { label: "username", get: (r) => r.username },
  { label: "password", get: (r) => r.passwordMasked },
  { label: "host", get: (r) => r.host },
  { label: "hostname", get: (r) => r.hostname },
  { label: "port", get: (r) => r.port },
  { label: "pathname", get: (r) => r.pathname },
  { label: "search", get: (r) => r.search },
  { label: "hash", get: (r) => r.hash },
  { label: "origin", get: (r) => r.origin },
];

export function renderUrlParser(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <p><label for="up-input"><strong>URL 입력</strong> <span class="muted">(absolute URL만, 접속하지 않음)</span></label></p>
      <input type="text" id="up-input" style="font-family:monospace;" placeholder="https://example.com/path?foo=bar#section" aria-label="분석할 URL 입력" spellcheck="false" />
      <p class="muted">상대 경로(<code>/path</code>)와 <code>javascript:</code> 등은 지원하지 않습니다.</p>
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
        <li>https://로 시작하는 전체 주소를 입력합니다.</li>
        <li>분석하기를 누르면 구조와 query 파라미터가 표로 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 URL을 서버로 보내지 않고 접속도 하지 않습니다. URL·query·hash는 사용 통계에 기록되지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>URL Parser란?</strong> 주소를 접속 없이 구조(protocol/host/path/query 등)로 분해해 보여주는 도구입니다.</li>
        <li><strong>URL은 어떤 부분으로 구성되는가?</strong> protocol·host·port·pathname·search(query)·hash가 대표적이며 결과 표에서 확인할 수 있습니다.</li>
        <li><strong>URL Parser와 URL Encoder의 차이는?</strong> Parser는 구조를 분해하고, Encoder는 문자를 percent-encoding으로 변환합니다. Parser는 입력을 다시 인코딩하지 않습니다.</li>
        <li><strong>상대 URL을 지원하는가?</strong> 아닙니다. base 없이는 해석할 수 없어 absolute URL만 받습니다.</li>
        <li><strong>query parameter란?</strong> <code>?</code> 뒤의 <code>key=value</code> 목록입니다. 순서·중복·빈 값을 그대로 보여줍니다.</li>
        <li><strong>같은 파라미터가 여러 번 나오면?</strong> 제거·정렬하지 않고 나온 순서대로 모두 표시합니다.</li>
        <li><strong>URL에 비밀번호가 있어도 안전한가?</strong> 분석 자체는 로컬에서 끝나지만, URL 속 비밀번호는 어디에 붙여넣어도 위험합니다. 결과에서 비밀번호는 마스킹됩니다.</li>
        <li><strong>입력 URL이 서버로 전송되는가?</strong> 아니요. 파싱·표시 모두 브라우저 내부에서 끝나며 통계에도 URL이 포함되지 않습니다.</li>
        <li><strong><code>javascript:</code> URL을 실행하는가?</strong> 절대 아닙니다. 실행 scheme은 분석 대상에서 제외되며, 결과에 클릭 가능한 링크를 만들지 않습니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLInputElement>("#up-input")!;
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
    const manifest = getTool("url-parser");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: UrlParserInput = { text: input.value };
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
    const r = res.output as UrlParserOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "결과 — VALID";
    card.appendChild(h);

    if (r.hasCredentials) {
      const warn = document.createElement("div");
      warn.className = "error";
      warn.textContent =
        "경고: URL에 사용자 이름/비밀번호가 포함되어 있습니다. 민감할 수 있으니 공유·저장하지 마세요. 비밀번호는 마스킹됩니다.";
      card.appendChild(warn);
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    for (const t of ["항목", "값"]) {
      const th = document.createElement("th");
      th.textContent = t;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (const row of ROWS) {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = row.label;
      const td = document.createElement("td");
      td.textContent = row.get(r) === "" ? "(비어 있음)" : row.get(r);
      td.style.overflowWrap = "anywhere";
      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    card.appendChild(table);

    const qh = document.createElement("h3");
    qh.textContent = `Query Parameters (${r.searchParams.length})`;
    card.appendChild(qh);
    if (r.searchParams.length === 0) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "query parameter가 없습니다.";
      card.appendChild(p);
    } else {
      const qt = document.createElement("table");
      const qhead = document.createElement("thead");
      const qr = document.createElement("tr");
      for (const t of ["key", "value"]) {
        const th = document.createElement("th");
        th.textContent = t;
        qr.appendChild(th);
      }
      qhead.appendChild(qr);
      qt.appendChild(qhead);
      const qbody = document.createElement("tbody");
      for (const p of r.searchParams) {
        const tr = document.createElement("tr");
        const k = document.createElement("td");
        k.textContent = p.key === "" ? "(빈 key)" : p.key;
        k.style.overflowWrap = "anywhere";
        const v = document.createElement("td");
        v.textContent = p.value === "" ? "(빈 값)" : p.value;
        v.style.overflowWrap = "anywhere";
        tr.appendChild(k);
        tr.appendChild(v);
        qbody.appendChild(tr);
      }
      qt.appendChild(qbody);
      card.appendChild(qt);
    }

    const note = document.createElement("p");
    note.className = "muted";
    note.textContent =
      "href는 표준 정규화가 적용된 값으로 원문과 다를 수 있습니다. query 값은 표준 디코딩(+는 공백)으로 표시됩니다.";
    card.appendChild(note);

    const btns = document.createElement("p");
    const cp = document.createElement("button");
    cp.type = "button";
    cp.textContent = "결과 복사";
    const dl = document.createElement("button");
    dl.type = "button";
    dl.className = "secondary";
    dl.textContent = ".txt 내려받기";
    btns.appendChild(cp);
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: URL Encoder · JWT Decoder · JSON Formatter";
    card.appendChild(next);

    const summary = [
      `input=${r.input}`,
      `href=${r.href}`,
      ...ROWS.slice(2).map((row) => `${row.label}=${row.get(r)}`),
      ...r.searchParams.map((p) => `param: ${p.key}=${p.value}`),
    ].join("\n");
    cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(summary);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    dl.addEventListener("click", () => {
      // URL 원문은 analytics에 포함하지 않는다
      track("download", { tool: "url-parser" });
      downloadText("url-parse-result.txt", summary, "text/plain");
    });
  });
}

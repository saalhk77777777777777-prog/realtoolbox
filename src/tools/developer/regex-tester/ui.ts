/**
 * TOOLBOX v0.2.6 — Regex Tester UI
 * 기존 UI 계약 준수: 패턴/플래그/텍스트 입력, stickybar 테스트/지우기,
 * role=status 상태 전이, result/error 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 * 결과는 textarea.value + textContent로만 표시한다.
 * 브라우저 Worker에서 실행하며 750ms 타임아웃 시 Worker를 종료한다.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { RegexInput, RegexOutput } from "./processor.ts";
import { MAX_PATTERN_CHARS, MAX_TEXT_CHARS, MAX_MATCHES, isPotentiallyCatastrophicPattern } from "./processor.ts";

export function renderRegex(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <p><label for="rx-pattern"><strong>정규식 패턴</strong> <span class="muted">(최대 ${MAX_PATTERN_CHARS}자)</span></label></p>
      <input type="text" id="rx-pattern" style="font-family:monospace;" placeholder="예: (?<year>\\d{4})-(?<month>\\d{2})" aria-label="정규식 패턴" spellcheck="false" />
      <p style="margin-top:8px;"><label><strong>플래그</strong> <span class="muted">(g, i, m, s, u, y — 중복 불가)</span></label></p>
      <input type="text" id="rx-flags" style="font-family:monospace;" placeholder="예: g" aria-label="정규식 플래그" spellcheck="false" />
      <p style="margin-top:8px;"><label for="rx-text"><strong>테스트 텍스트</strong> <span class="muted">(최대 ${MAX_TEXT_CHARS.toLocaleString()}자)</span></label></p>
      <textarea id="rx-text" rows="6" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="테스트할 텍스트…" aria-label="테스트 텍스트"></textarea>
      <p class="muted">결과는 최대 ${MAX_MATCHES}개까지 표시됩니다. 더 많으면 절단됩니다.</p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">테스트</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>정규식 패턴과 플래그를 입력합니다.</li>
        <li>테스트할 텍스트를 입력하고 테스트를 누릅니다.</li>
        <li>매칭 결과와 캡처 그룹을 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>정규식이 실행되지 않아요.</strong> 패턴이 유효하지 않을 수 있습니다. 오류 메시지를 확인하세요.</li>
        <li><strong>결과가 ${MAX_MATCHES}개에서 잘려요.</strong> 상한입니다. 텍스트를 나누어 테스트하세요.</li>
        <li><strong>catastrophic backtracking이란?</strong> 특정 패턴이 입력에 따라 지수 시간이 걸리는 현상입니다. 위험 패턴 휴리스틱과 750ms Worker 타임아웃으로 UI 정지를 방지합니다.</li>
        <li><strong><code>g</code> 플래그가 없으면?</strong> 첫 매치만 표시합니다.</li>
        <li><strong><code>u</code> 플래그와 이모지?</strong> <code>u</code> 플래그를 사용하면 이모지를 올바르게 처리합니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const patternInput = wrap.querySelector<HTMLInputElement>("#rx-pattern")!;
  const flagsInput = wrap.querySelector<HTMLInputElement>("#rx-flags")!;
  const textInput = wrap.querySelector<HTMLTextAreaElement>("#rx-text")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  const syncStatus = (): void => {
    const hasInput = patternInput.value.length > 0 && textInput.value.length > 0;
    setStatus(hasInput ? "입력 준비 (input-ready)" : "대기 중 (idle)");
  };
  patternInput.addEventListener("input", syncStatus);
  flagsInput.addEventListener("input", syncStatus);
  textInput.addEventListener("input", syncStatus);
  clearBtn.addEventListener("click", () => {
    patternInput.value = "";
    flagsInput.value = "";
    textInput.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    patternInput.focus();
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("regex-tester");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: RegexInput = {
      pattern: patternInput.value,
      flags: flagsInput.value,
      text: textInput.value,
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
    const r = res.output as RegexOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = `결과 — ${r.matchCount}개 매치${r.truncated ? ` (절단됨, 상한 ${MAX_MATCHES})` : ""}`;
    card.appendChild(h);

    if (r.matchCount === 0) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = isPotentiallyCatastrophicPattern(r.pattern)
        ? "안전 보호: 실행 시간이 폭증할 수 있는 패턴이라 실행을 건너뛰었습니다."
        : "매치가 없습니다.";
      card.appendChild(p);
    } else {
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const hr = document.createElement("tr");
      for (const t of ["#", "위치", "매치", "그룹", "네임드 그룹"]) {
        const th = document.createElement("th");
        th.textContent = t;
        hr.appendChild(th);
      }
      thead.appendChild(hr);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      r.matches.forEach((m, i) => {
        const tr = document.createElement("tr");
        const idx = document.createElement("td");
        idx.textContent = String(i);
        const pos = document.createElement("td");
        pos.textContent = String(m.index);
        const match = document.createElement("td");
        match.textContent = m.match;
        match.style.overflowWrap = "anywhere";
        const groups = document.createElement("td");
        groups.textContent = m.groups.length > 0 ? m.groups.map((g) => g ?? "∅").join(", ") : "—";
        const named = document.createElement("td");
        named.textContent =
          Object.keys(m.namedGroups).length > 0
            ? Object.entries(m.namedGroups)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ")
            : "—";
        tr.appendChild(idx);
        tr.appendChild(pos);
        tr.appendChild(match);
        tr.appendChild(groups);
        tr.appendChild(named);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      card.appendChild(table);
    }

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
    next.textContent = "다음 작업: JSON Formatter · URL Parser · JWT Decoder";
    card.appendChild(next);

    const summary = [
      `pattern: /${r.pattern}/${r.flags}`,
      `matches: ${r.matchCount}${r.truncated ? " (truncated)" : ""}`,
      ...r.matches.map(
        (m, i) =>
          `[${i}] index=${m.index} match="${m.match}" groups=[${m.groups.map((g) => g ?? "∅").join(", ")}] named={${Object.entries(m.namedGroups).map(([k, v]) => `${k}=${v}`).join(", ")}}`,
      ),
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
      track("download", { tool: "regex-tester" });
      downloadText("regex-result.txt", summary, "text/plain");
    });
  });
}

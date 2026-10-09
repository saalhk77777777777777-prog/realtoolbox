/**
 * TOOLBOX v0.2.1 — JSON Formatter / Validator UI
 * 기존 UI 계약 준수: 모드+들여쓰기 선택, stickybar 검사/지우기,
 * role=status 상태 전이, result/error/warning 패널, 복사·다운로드,
 * 사용법·개인정보·FAQ. 결과는 textarea.value로만 표시 (innerHTML에 사용자 데이터 삽입 금지).
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { JsonIndent, JsonInput, JsonMode, JsonOutput } from "./processor.ts";

export function renderJson(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div role="radiogroup" aria-label="변환 모드">
        <label><input type="radio" name="jsonmode" value="pretty" checked /> Pretty Print</label>
        <label><input type="radio" name="jsonmode" value="minify" /> Minify</label>
        <label><input type="radio" name="jsonmode" value="validate" /> Validate only</label>
      </div>
      <div style="margin-top:8px;">
        <label for="json-indent">들여쓰기 <span class="muted">(Pretty 모드)</span></label>
        <select id="json-indent">
          <option value="2" selected>2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <p style="margin-top:12px;"><label for="json-input"><strong>JSON 입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="json-input" rows="10" style="width:100%;padding:12px;font-size:14px;font-family:monospace;border:1px solid var(--border);border-radius:var(--radius);" placeholder='예: {"name": "TOOLBOX", "tools": ["json"]}' aria-label="JSON 입력" spellcheck="false"></textarea>
    </div>
    <div class="stickybar">
      <button id="run" type="button">검사하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>JSON을 붙여넣고 Pretty/Minify/Validate 중 하나를 고릅니다.</li>
        <li>검사하기를 누르면 문법 오류는 위치와 함께, 정상 입력은 결과와 함께 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다. <code>eval</code>을 사용하지 않고 표준 JSON 파서로만 처리합니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>JSON Formatter란?</strong> 읽기 어려운 한 줄 JSON을 들여쓰기 형태로 정리하는 도구입니다.</li>
        <li><strong>Validate와 Formatter의 차이는?</strong> Validate는 문법이 맞는지만 판단하고, Formatter는 정리된 텍스트까지 만듭니다. 문법이 틀리면 둘 다 성공 결과를 내지 않습니다.</li>
        <li><strong>왜 invalid인가요?</strong> trailing comma·주석·작은따옴표·<code>NaN</code>·<code>Infinity</code>·<code>undefined</code>는 JSON이 아닙니다. 오류 메시지의 줄·열을 확인하세요.</li>
        <li><strong>큰 숫자가 변할 수 있나요?</strong> 예. 16자리 이상 정수는 JavaScript Number 정밀도를 벗어나 값이 바뀔 수 있습니다. 본 도구는 parse → serialize 방식이라 원문을 바이트 단위로 보존하지 않으며, 의심 숫자는 경고로 표시합니다.</li>
        <li><strong>주석을 넣을 수 있나요?</strong> 표준 JSON은 주석을 허용하지 않습니다. 주석이 필요하면 JSONC 지원 도구를 사용하세요.</li>
        <li><strong>중복 key는 어떻게 되나요?</strong> 마지막 값이 남습니다(last-wins). 감지되면 경고로 알려드립니다.</li>
        <li><strong>입력 데이터가 서버로 전송되나요?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#json-input")!;
  const indentSel = wrap.querySelector<HTMLSelectElement>("#json-indent")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };
  const mode = (): JsonMode =>
    wrap.querySelector<HTMLInputElement>('input[name="jsonmode"]:checked')!.value as JsonMode;
  const indent = (): JsonIndent => {
    const v = indentSel.value;
    return v === "tab" ? "tab" : v === "4" ? 4 : 2;
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
    const manifest = getTool("json-formatter");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: JsonInput = { text: input.value, mode: mode(), indent: indent() };
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
    const r = res.output as JsonOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과 — VALID${r.mode === "validate" ? " (텍스트 미생성)" : ""}</h2>
      <p class="muted">입력 ${r.characters.toLocaleString()}자 · 최대 깊이 ${r.maxDepth}</p>
      ${r.mode === "validate" ? "" : '<textarea id="json-out" rows="12" readonly style="width:100%;padding:12px;font-size:14px;font-family:monospace;" aria-label="정리된 JSON" spellcheck="false"></textarea>'}
      <p>
        ${r.mode === "validate" ? "" : '<button type="button" id="cp">결과 복사</button>'}
        ${r.mode === "validate" ? "" : '<button type="button" id="dl" class="secondary">.json 내려받기</button>'}
      </p>
      <p class="muted">다음 작업: JSON Diff · JWT Decoder · Base64</p>
    `;
    out.appendChild(card);
    // 경고는 DOM + textContent로만 주입 (사용자 입력 파생 문자열이 innerHTML에 닿지 않음)
    if (r.warnings.length > 0) {
      const wcard = document.createElement("div");
      wcard.className = "card";
      const h = document.createElement("h3");
      h.textContent = `주의 (${r.warnings.length})`;
      const ul = document.createElement("ul");
      for (const w of r.warnings) {
        const li = document.createElement("li");
        li.textContent = w.path ? `[${w.type}] ${w.message} @ ${w.path}` : `[${w.type}] ${w.message}`;
        ul.appendChild(li);
      }
      wcard.appendChild(h);
      wcard.appendChild(ul);
      card.appendChild(wcard);
    }
    if (r.mode !== "validate") {
      const ta = card.querySelector<HTMLTextAreaElement>("#json-out")!;
      ta.value = r.formattedText;
      card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(r.formattedText);
          setStatus("완료 (completed) — 복사됨");
        } catch {
          setStatus("실패 (failed) — 클립보드 접근 불가");
        }
      });
      card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
        track("download", { tool: "json-formatter" });
        downloadText("formatted.json", r.formattedText, "application/json");
      });
    }
  });
}

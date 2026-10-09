/**
 * TOOLBOX v0.2.3 — HTML Entity Encoder / Decoder UI
 * 기존 UI 계약 준수: 방향 선택, stickybar 실행/지우기, role=status 상태 전이,
 * result/error/warning 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 * 사용자 입력·결과는 textarea.value + textContent로만 취급한다.
 * innerHTML/insertAdjacentHTML/DOMParser를 사용하지 않는다.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { EntityDirection, EntityInput, EntityOutput } from "./processor.ts";

export function renderEntity(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div role="radiogroup" aria-label="변환 방향">
        <label><input type="radio" name="entdir" value="encode" checked /> 인코딩 (문자 → entity)</label>
        <label><input type="radio" name="entdir" value="decode" /> 디코딩 (entity → 문자)</label>
      </div>
      <p style="margin-top:12px;"><label for="ent-input"><strong>입력</strong> <span class="muted">(브라우저에서만 처리, HTML로 실행되지 않음)</span></label></p>
      <textarea id="ent-input" rows="6" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="예: <div>Hello & &quot;world&quot;</div>" aria-label="변환할 텍스트 입력"></textarea>
      <p class="muted">지원: <code>&amp; &lt; &gt; &quot; &#39;</code> + <code>&amp;nbsp;</code> + 수치 참조(<code>&amp;#65;</code> <code>&amp;#x41;</code>). 그 외 named entity는 변환하지 않습니다.</p>
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
        <li>인코딩/디코딩을 고릅니다.</li>
        <li>텍스트를 입력하고 변환하기를 누릅니다.</li>
        <li>결과를 복사하거나 내려받습니다. 지원하지 않는 entity는 경고와 함께 그대로 둡니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다. 입력과 결과는 텍스트로만 다루며 HTML로 실행되지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>HTML Entity란?</strong> HTML에서 특별한 의미를 가지는 문자를 안전하게 표기하는 방법입니다 (예: <code>&amp;lt;</code>).</li>
        <li><strong>Encoder와 Decoder의 차이는?</strong> Encoder는 문자→entity, Decoder는 entity→문자 방향입니다.</li>
        <li><strong><code>&amp;amp;</code>, <code>&amp;lt;</code>, <code>&amp;gt;</code>는 무엇인가?</strong> 각각 <code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code> 문자를 나타내는 entity입니다.</li>
        <li><strong>숫자 character reference란?</strong> 문자를 Unicode 번호로 표기하는 방식입니다 (<code>&amp;#65;</code>=A, <code>&amp;#x41;</code>=A).</li>
        <li><strong>모든 HTML5 entity를 지원하는가?</strong> 아닙니다. 핵심 5종+nbsp+수치 참조만 지원하고, 나머지는 변환하지 않고 경고합니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
        <li><strong>이 도구가 HTML을 실행하는가?</strong> 절대 아닙니다. <code>&lt;script&gt;</code>를 입력해도 텍스트로만 표시되고 실행되지 않습니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#ent-input")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };
  const direction = (): EntityDirection =>
    wrap.querySelector<HTMLInputElement>('input[name="entdir"]:checked')!.value as EntityDirection;

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
    const manifest = getTool("html-entity");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: EntityInput = { text: input.value, direction: direction() };
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
    const r = res.output as EntityOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과</h2>
      <textarea id="ent-out" rows="6" readonly style="width:100%;padding:12px;font-size:16px;" aria-label="변환 결과"></textarea>
      <p class="muted">변경 ${r.changed ? "있음" : "없음"}${
        r.warnings.length > 0 ? ` · 주의 ${r.warnings.length}건 (아래 참조)` : ""
      }</p>
      <p>
        <button type="button" id="cp">결과 복사</button>
        <button type="button" id="dl" class="secondary">.txt 내려받기</button>
      </p>
      <p class="muted">다음 작업: URL Encoder · Base64 · JSON Formatter</p>
    `;
    out.appendChild(card);
    // 결과·경고는 value/textContent로만 주입
    card.querySelector<HTMLTextAreaElement>("#ent-out")!.value = r.result;
    if (r.warnings.length > 0) {
      const wcard = document.createElement("div");
      wcard.className = "card";
      const h = document.createElement("h3");
      h.textContent = `주의 (${r.warnings.length})`;
      const ul = document.createElement("ul");
      for (const w of r.warnings) {
        const li = document.createElement("li");
        li.textContent = `[${w.type}] ${w.message}`;
        ul.appendChild(li);
      }
      wcard.appendChild(h);
      wcard.appendChild(ul);
      card.appendChild(wcard);
    }
    card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(r.result);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      track("download", { tool: "html-entity" });
      downloadText(`html-entity-${r.direction}.txt`, r.result, "text/plain");
    });
  });
}

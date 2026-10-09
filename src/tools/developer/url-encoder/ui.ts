/**
 * TOOLBOX v0.1.5 — URL Encoder/Decoder UI
 * 기존 UI 계약 준수: 모드+범위 선택, stickybar 실행/지우기/Swap,
 * role=status 상태 전이, result/error 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { UrlCoderInput, UrlCoderOutput, UrlMode, UrlScope } from "./processor.ts";

export function renderUrlCoder(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div role="radiogroup" aria-label="변환 모드">
        <label><input type="radio" name="urlmode" value="encode" checked /> 인코딩</label>
        <label><input type="radio" name="urlmode" value="decode" /> 디코딩</label>
      </div>
      <div role="radiogroup" aria-label="인코딩 범위" style="margin-top:8px;">
        <label><input type="radio" name="urlscope" value="component" checked /> 컴포넌트 <span class="muted">(쿼리값 등 조각용 · encodeURIComponent)</span></label><br />
        <label><input type="radio" name="urlscope" value="fullUrl" /> 전체 URL <span class="muted">(구조 유지 · encodeURI)</span></label>
      </div>
      <p style="margin-top:12px;"><label for="url-input"><strong>입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="url-input" rows="6" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="인코딩할 텍스트/URL 또는 디코딩할 percent-encoding…" aria-label="URL 입력"></textarea>
    </div>
    <div class="stickybar">
      <button id="run" type="button">변환하기</button>
      <button id="swap" type="button" class="secondary">Swap (입출력 교체)</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>인코딩/디코딩과 범위(컴포넌트/전체 URL)를 선택합니다.</li>
        <li>쿼리값 같은 조각은 컴포넌트, 주소 전체는 전체 URL을 고르세요.</li>
        <li>변환하기를 누르고 결과를 복사하거나 내려받습니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다. 브라우저 내장 URL API로만 변환합니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>컴포넌트와 전체 URL의 차이는?</strong> 컴포넌트는 <code>&amp; = ? # +</code>까지 이스케이프하고, 전체 URL은 주소 구조 문자를 유지합니다.</li>
        <li><strong>디코딩이 실패해요.</strong> 단독 <code>%</code>나 <code>%2G</code> 같은 깨진 percent-encoding이 원인입니다. 실패 시 원문을 돌려주지 않고 오류를 표시합니다.</li>
        <li><strong><code>+</code>는 공백인가요?</strong> 이 도구에서는 아닙니다. <code>+</code>는 percent-encoding이 아니라 form-encoding 규칙이므로 문자 그대로 처리합니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#url-input")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const swapBtn = wrap.querySelector<HTMLButtonElement>("#swap")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };
  const mode = (): UrlMode =>
    wrap.querySelector<HTMLInputElement>('input[name="urlmode"]:checked')!.value as UrlMode;
  const scope = (): UrlScope =>
    wrap.querySelector<HTMLInputElement>('input[name="urlscope"]:checked')!.value as UrlScope;
  let lastOutput = "";

  input.addEventListener("input", () => {
    setStatus(input.value.length === 0 ? "대기 중 (idle)" : "입력 준비 (input-ready)");
  });
  clearBtn.addEventListener("click", () => {
    input.value = "";
    lastOutput = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    input.focus();
  });
  swapBtn.addEventListener("click", () => {
    if (!lastOutput) return;
    input.value = lastOutput;
    const next = mode() === "encode" ? "decode" : "encode";
    wrap
      .querySelectorAll<HTMLInputElement>('input[name="urlmode"]')
      .forEach((r) => {
        r.checked = r.value === next;
      });
    out.innerHTML = "";
    setStatus("입력 준비 (input-ready) — Swap됨");
    track("download", { tool: "url-encoder-swap" });
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("url-encoder");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: UrlCoderInput = { text: input.value, mode: mode(), scope: scope() };
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
    const r = res.output as UrlCoderOutput;
    lastOutput = r.output;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과</h2>
      <textarea id="url-out" rows="6" readonly style="width:100%;padding:12px;font-size:14px;" aria-label="변환 결과"></textarea>
      <p class="muted">API: <code>${r.api}</code> · 입력 ${r.inputLength.toLocaleString()}자 → 출력 ${r.outputBytes.toLocaleString()} bytes (UTF-8)</p>
      <p>
        <button type="button" id="cp">결과 복사</button>
        <button type="button" id="dl" class="secondary">.txt 내려받기</button>
      </p>
      <p class="muted">다음 작업: Base64 · JWT Decoder · Regex Tester</p>
    `;
    out.appendChild(card);
    card.querySelector<HTMLTextAreaElement>("#url-out")!.value = r.output;
    card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(r.output);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      track("download", { tool: "url-encoder" });
      downloadText(`url-${r.mode}-${r.scope}-result.txt`, r.output, "text/plain");
    });
  });
}

/**
 * TOOLBOX v0.1.3 — Base64 UI
 * 기존 UI 계약 준수: 모드 선택, stickybar 실행/지우기/Swap, role=status 상태 전이,
 * result/error 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 * 동기 계산이므로 가짜 progress 없음.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { Base64Input, Base64Mode, Base64Output } from "./processor.ts";

export function renderBase64(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div role="radiogroup" aria-label="변환 모드">
        <label><input type="radio" name="b64mode" value="encode" checked /> 인코딩 (Text → Base64)</label>
        <label><input type="radio" name="b64mode" value="decode" /> 디코딩 (Base64 → Text)</label>
      </div>
      <p style="margin-top:12px;"><label for="b64-input"><strong>입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="b64-input" rows="6" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="인코딩할 텍스트 또는 디코딩할 Base64…" aria-label="Base64 입력"></textarea>
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
        <li>모드를 선택합니다 (인코딩/디코딩).</li>
        <li>텍스트를 입력하고 변환하기를 누릅니다.</li>
        <li>결과를 복사하거나 .txt로 내려받습니다. Swap으로 입출력을 교체해 왕복 확인할 수 있습니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다. 모든 변환은 브라우저 내부 API로 수행됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>한글·이모지가 깨지나요?</strong> UTF-8 기준으로 처리하므로 깨지지 않습니다.</li>
        <li><strong>디코딩이 실패해요.</strong> 인코딩 결과물을 그대로 붙여넣었는지 확인하세요. URL-safe(-, _) 형식과 줄바꿈이 섞인 경우 공백은 무시되지만 -,_는 거부됩니다.</li>
        <li><strong>파일도 변환되나요?</strong> v0.1.3은 텍스트 모드만 지원합니다. 파일 모드는 향후 버전에서 input contract 확장으로 제공합니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const modeInputs = [...wrap.querySelectorAll<HTMLInputElement>('input[name="b64mode"]')];
  const input = wrap.querySelector<HTMLTextAreaElement>("#b64-input")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const swapBtn = wrap.querySelector<HTMLButtonElement>("#swap")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };
  const mode = (): Base64Mode =>
    wrap.querySelector<HTMLInputElement>('input[name="b64mode"]:checked')!.value as Base64Mode;
  let lastOutput = "";

  modeInputs.forEach((r) =>
    r.addEventListener("change", () => {
      if (input.value.length > 0) setStatus("입력 준비 (input-ready)");
    }),
  );
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
    modeInputs.forEach((r) => {
      r.checked = r.value === next;
    });
    out.innerHTML = "";
    setStatus("입력 준비 (input-ready) — Swap됨");
    track("download", { tool: "base64-swap" });
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("base64");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: Base64Input = { text: input.value, mode: mode() };
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
    const r = res.output as Base64Output;
    lastOutput = r.output;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과 (${r.mode === "encode" ? "Base64" : "텍스트"})</h2>
      <textarea id="b64-out" rows="6" readonly style="width:100%;padding:12px;font-size:14px;" aria-label="변환 결과"></textarea>
      <p class="muted">입력 ${r.inputLength.toLocaleString()}자 → 출력 ${r.outputBytes.toLocaleString()} bytes (UTF-8)</p>
      <p>
        <button type="button" id="cp">결과 복사</button>
        <button type="button" id="dl" class="secondary">.txt 내려받기</button>
      </p>
      <p class="muted">다음 작업: URL Encoder · Hash Generator · JWT Decoder</p>
    `;
    out.appendChild(card);
    card.querySelector<HTMLTextAreaElement>("#b64-out")!.value = r.output;
    card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(r.output);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      track("download", { tool: "base64" });
      downloadText(`base64-${r.mode}-result.txt`, r.output, "text/plain");
    });
  });
}

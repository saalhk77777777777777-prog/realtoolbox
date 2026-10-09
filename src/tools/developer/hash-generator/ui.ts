/**
 * TOOLBOX v0.1.9 — Hash Generator UI
 * 기존 UI 계약 준수: 알고리즘 선택(SHA-1 경고 배지), 대문자 표시 옵션,
 * stickybar 실행/지우기, role=status 상태 전이, result/error 패널,
 * 결과 전체 표시(잘라서 표시 금지), 복사·다운로드, 사용법·개인정보·FAQ.
 * 해시≠암호화, 역변환 불가를 정확히 설명한다.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { HashInput, HashOutput } from "./processor.ts";
import { SUPPORTED_ALGORITHMS, WEAK_ALGORITHMS } from "./processor.ts";

export function renderHash(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  const radios = SUPPORTED_ALGORITHMS.map(
    (a) => `
      <label>
        <input type="radio" name="halgo" value="${a}"${a === "SHA-256" ? " checked" : ""} /> ${a}
        ${(WEAK_ALGORITHMS as readonly string[]).includes(a) ? '<strong style="color:var(--danger);">[취약·호환용]</strong>' : ""}
      </label>`,
  ).join(" ");

  wrap.innerHTML = `
    <div class="card">
      <div role="radiogroup" aria-label="해시 알고리즘">${radios}</div>
      <p class="muted">SHA-1은 충돌이 발견된 취약 알고리즘입니다. 신규 용도에는 SHA-256 이상을 사용하세요. MD5는 Web Crypto 미지원으로 제공하지 않습니다.</p>
      <p style="margin-top:12px;"><label for="hash-input"><strong>입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="hash-input" rows="6" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="해시할 텍스트…" aria-label="해시 입력"></textarea>
      <p><label><input type="checkbox" id="upper" /> 대문자로 표시 <span class="muted">(표시만 다르고 값은 동일)</span></label></p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">해시 생성</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>알고리즘을 고릅니다 (기본 SHA-256).</li>
        <li>텍스트를 입력하고 해시 생성을 누릅니다.</li>
        <li>결과 hex 전체를 복사하거나 내려받습니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 입력값을 서버로 전송하지 않습니다. Web Crypto API로 브라우저 내부에서 계산합니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>해시와 암호화의 차이는?</strong> 암호화는 키로 되돌릴 수 있지만, 해시는 단방향이라 원래 입력으로 되돌릴 수 없습니다. 이 도구는 해시만 생성합니다.</li>
        <li><strong>같은 입력의 결과가 항상 같나요?</strong> 예. SHA는 결정적이라 같은 입력·알고리즘이면 같은 hex가 나옵니다.</li>
        <li><strong>SHA-1을 쓰면 안 되나요?</strong> 충돌 공격이 현실화되어 보안 용도로는 권장하지 않습니다. 기존 시스템 호환 확인용으로만 두었습니다.</li>
        <li><strong>MD5는 왜 없나요?</strong> 브라우저 표준 Web Crypto가 제공하지 않아 별도 라이브러리 없이는 낼 수 없습니다. 라이브러리 추가보다 표준 준수를 우선합니다.</li>
        <li><strong>버튼이 실패해요.</strong> <code>crypto.subtle</code>은 HTTPS/localhost 같은 secure context에서만 동작합니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#hash-input")!;
  const upper = wrap.querySelector<HTMLInputElement>("#upper")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };
  const algo = () =>
    wrap.querySelector<HTMLInputElement>('input[name="halgo"]:checked')!.value as HashInput["algorithm"];

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
    const manifest = getTool("hash-generator");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: HashInput = { text: input.value, algorithm: algo() };
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
    const r = res.output as HashOutput;
    const shown = upper.checked ? r.hex.toUpperCase() : r.hex;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과 — ${escapeHtml(r.algorithm)}</h2>
      ${r.weakWarning ? `<p class="error">경고: SHA-1은 취약합니다. 호환 확인용으로만 사용하세요.</p>` : ""}
      <textarea id="hash-out" rows="4" readonly style="width:100%;padding:12px;font-size:14px;word-break:break-all;" aria-label="해시 결과"></textarea>
      <p class="muted">hex ${r.hexLength}자 · 입력 ${r.inputBytes.toLocaleString()} bytes (UTF-8) · ${upper.checked ? "대문자 표시" : "소문자 정본"}</p>
      <p>
        <button type="button" id="cp">결과 복사</button>
        <button type="button" id="dl" class="secondary">.txt 내려받기</button>
      </p>
      <p class="muted">다음 작업: Base64 · URL Encoder · JWT Decoder</p>
    `;
    out.appendChild(card);
    card.querySelector<HTMLTextAreaElement>("#hash-out")!.value = shown;
    card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shown);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      track("download", { tool: "hash-generator" });
      downloadText(`hash-${r.algorithm.toLowerCase()}.txt`, shown, "text/plain");
    });
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

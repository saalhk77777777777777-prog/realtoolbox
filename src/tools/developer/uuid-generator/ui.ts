/**
 * TOOLBOX v0.2.2 — UUID Generator UI
 * 기존 UI 계약 준수: 버전 선택, 개수 입력, stickybar 생성/지우기,
 * role=status 상태 전이, result/error 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 * 결과는 textarea.value로만 표시. analytics에는 개수만 기록 (UUID 값 기록 금지).
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { UuidInput, UuidOutput } from "./processor.ts";
import { MAX_UUID_COUNT } from "./processor.ts";

export function renderUuid(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div role="radiogroup" aria-label="UUID 버전">
        <label><input type="radio" name="uuidver" value="v4" checked /> v4 <span class="muted">(무작위 · 기본)</span></label>
        <label><input type="radio" name="uuidver" value="v7" /> v7 <span class="muted">(시간순 · RFC 9562)</span></label>
      </div>
      <p style="margin-top:12px;"><label for="uuid-count"><strong>개수</strong> <span class="muted">(1~${MAX_UUID_COUNT})</span></label></p>
      <input type="number" id="uuid-count" value="1" min="1" max="${MAX_UUID_COUNT}" step="1" style="width:120px;padding:12px;font-size:16px;" aria-label="생성 개수" />
    </div>
    <div class="stickybar">
      <button id="run" type="button">생성하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>버전(v4/v7)과 개수를 고릅니다.</li>
        <li>생성하기를 누르고 목록을 복사하거나 내려받습니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 브라우저 Web Crypto로 생성하며 결과를 저장·전송하지 않습니다. 사용 통계에도 UUID 값은 포함되지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>UUID란?</strong> 128비트 고유 식별자를 표준 형식(8-4-4-4-12)으로 표기한 것입니다.</li>
        <li><strong>UUID v4란?</strong> 122비트를 암호학적 난수로 채운 버전입니다. version nibble이 4입니다.</li>
        <li><strong>얼마나 고유한가?</strong> v4는 2<sup>122</sup> 공간에서 무작위 추출이라 실무상 충돌이 무시될 수준입니다. 수학적 보장은 아니고 확률적 고유성입니다.</li>
        <li><strong>생성 결과가 서버로 전송되는가?</strong> 아니요. 생성·복사·다운로드 모두 브라우저 내부에서 끝납니다.</li>
        <li><strong>v4와 v7의 차이는?</strong> v4는 완전 무작위, v7은 앞 48비트에 Unix 시각(ms)이 들어가 시간순 정렬이 가능합니다. 단조 증가는 보장하지 않습니다.</li>
        <li><strong>비밀번호처럼 써도 되는가?</strong> 안 됩니다. UUID는 식별자이지 인증 수단이 아닙니다. 예측 불가능성이 보안 근거가 되지 않습니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const countInput = wrap.querySelector<HTMLInputElement>("#uuid-count")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };
  const version = () =>
    wrap.querySelector<HTMLInputElement>('input[name="uuidver"]:checked')!.value as UuidInput["version"];

  clearBtn.addEventListener("click", () => {
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("uuid-generator");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    // 소수는 truncate하지 않고 그대로 전달 — validate가 명시적으로 거부한다
    const data: UuidInput = { version: version(), count: Number(countInput.value) };
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
    const r = res.output as UuidOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과 — ${r.version.toUpperCase()} ${r.count}개</h2>
      <textarea id="uuid-out" rows="${Math.min(Math.max(r.count, 3), 12)}" readonly style="width:100%;padding:12px;font-size:14px;font-family:monospace;" aria-label="생성된 UUID 목록" spellcheck="false"></textarea>
      <p>
        <button type="button" id="cp">결과 복사</button>
        <button type="button" id="dl" class="secondary">.txt 내려받기</button>
      </p>
      <p class="muted">다음 작업: Hash Generator · Timestamp Converter · JSON Formatter</p>
    `;
    out.appendChild(card);
    const text = r.uuids.join("\n");
    card.querySelector<HTMLTextAreaElement>("#uuid-out")!.value = text;
    card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      // 개수만 기록 — UUID 값은 analytics에 포함하지 않는다
      track("download", { tool: "uuid-generator", count: r.count });
      downloadText(`uuid-${r.version}.txt`, text, "text/plain");
    });
  });
}

/**
 * TOOLBOX v0.1.1 — Text Counter UI
 * File Size Checker와 동일한 UI 계약: stickybar, role=status 상태 전이,
 * result/error 패널, 복사·JSON 내보내기, 사용법·개인정보·FAQ 섹션.
 * 처리는 동기 계산이므로 가짜 progress 애니메이션 없음.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { TextCounterInput, TextCounterOutput } from "./processor.ts";

export function renderTextCounter(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <label for="tc-input"><strong>분석할 텍스트</strong> <span class="muted">(브라우저에서만 처리, 서버 전송 없음)</span></label>
      <textarea id="tc-input" rows="8" style="width:100%;padding:12px;font-size:16px;border:1px solid var(--border);border-radius:var(--radius);" placeholder="여기에 텍스트를 붙여넣으세요…" aria-label="분석할 텍스트 입력"></textarea>
      <p class="muted" id="tc-live" role="status">0자 입력됨</p>
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
        <li>텍스트를 상자에 붙여넣거나 직접 입력합니다.</li>
        <li>분석하기를 누르면 글자·단어·줄·문단·바이트를 계산합니다.</li>
        <li>결과를 복사하거나 JSON으로 내보낼 수 있습니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 텍스트를 서버로 전송하지 않습니다. 모든 계산은 브라우저 내부에서 수행됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>업로드되나요?</strong> 아니요. 입력한 텍스트는 이 페이지를 벗어나지 않습니다.</li>
        <li><strong>단어 수가 정확한가요?</strong> 공백 기준 근사치입니다. 한국어는 띄어쓰기 방식에 따라 실제 단어 수와 다를 수 있습니다.</li>
        <li><strong>이모지는 몇 자인가요?</strong> grapheme(눈에 보이는 글자) 기준으로 셉니다. 구형 브라우저에서는 code point 기준 근사치로 표시됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#tc-input")!;
  const live = wrap.querySelector<HTMLParagraphElement>("#tc-live")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  input.addEventListener("input", () => {
    live.textContent = `${[...input.value].length.toLocaleString()}자 입력됨`;
    if (status.textContent === "대기 중 (idle)" && input.value.length > 0) {
      setStatus("입력 준비 (input-ready)");
    }
    if (input.value.length === 0) {
      setStatus("대기 중 (idle)");
    }
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    live.textContent = "0자 입력됨";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    input.focus();
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("text-counter");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: TextCounterInput = { text: input.value };
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
    const r = res.output as TextCounterOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    card.innerHTML = `
      <h2>결과</h2>
      <table><thead><tr><th>항목</th><th>값</th><th>비고</th></tr></thead><tbody>
        <tr><td>글자 수 (Unicode)</td><td>${r.characters.toLocaleString()}</td><td>code points</td></tr>
        <tr><td>글자 수 (grapheme)</td><td>${r.graphemes.toLocaleString()}</td><td>${r.graphemeEstimated ? "근사치 (Segmenter 미지원)" : "눈에 보이는 글자 기준"}</td></tr>
        <tr><td>공백 제외 글자</td><td>${r.charactersWithoutSpaces.toLocaleString()}</td><td>—</td></tr>
        <tr><td>단어 수</td><td>${r.words.toLocaleString()}</td><td>공백 분리 근사치</td></tr>
        <tr><td>줄 수</td><td>${r.lines.toLocaleString()}</td><td>—</td></tr>
        <tr><td>문단 수</td><td>${r.paragraphs.toLocaleString()}</td><td>빈 줄 구분</td></tr>
        <tr><td>UTF-8 바이트</td><td>${r.utf8Bytes.toLocaleString()}</td><td>—</td></tr>
      </tbody></table>
      <p>
        <button type="button" id="cp">결과 복사</button>
        <button type="button" id="dl" class="secondary">JSON 내보내기</button>
      </p>
      <p class="muted">다음 작업: Case Converter · Whitespace Cleaner · Slug Generator</p>
    `;
    out.appendChild(card);
    card.querySelector<HTMLButtonElement>("#cp")!.addEventListener("click", async () => {
      track("download", { tool: "text-counter" });
      const summary = `글자: ${r.characters}, 공백제외: ${r.charactersWithoutSpaces}, 단어: ${r.words}, 줄: ${r.lines}, 문단: ${r.paragraphs}, UTF-8: ${r.utf8Bytes} bytes`;
      try {
        await navigator.clipboard.writeText(summary);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    card.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      track("download", { tool: "text-counter" });
      downloadText("text-counter-result.json", JSON.stringify(r, null, 2), "application/json");
    });
  });
}

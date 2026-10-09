/**
 * TOOLBOX v0.8.0 — PDF 메타데이터 제거 UI
 * 기존 UI 계약 준수. 파일 입력 + 처리 방식 선택 + 결과.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { CompressInput, CompressOutput } from "./processor.ts";

export function renderPdfCompress(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="pc-dz" tabindex="0" role="button" aria-label="PDF를 끌어놓거나 선택하세요">
        <p><strong>PDF를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="pc-fi" accept="application/pdf" aria-label="PDF 선택" />
      </div>
      <p style="margin-top:12px;">
        <label for="pc-mode">처리 방식</label>
        <select id="pc-mode">
          <option value="keep" selected>메타데이터 유지 (내용 그대로)</option>
          <option value="strip">개인정보 제거 (작성자·주제·키워드)</option>
        </select>
      </p>
      <p class="muted">이미지 크기는 줄이지 않습니다. PDF 구조와 메타데이터만 정리하므로 파일 크기가 줄어들지 않을 수 있습니다.</p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">정리하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>PDF를 드롭하거나 선택합니다.</li>
        <li>처리 방식을 선택합니다.</li>
        <li>정리하기를 누르고 결과를 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 PDF를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>파일이 작아지나요?</strong> 사실상 줄어들지 않습니다. PDF 안의 이미지는 이미 JPEG(Flate)等方式으로 압축돼 있어 구조를 다시 써도 크기가 그대로입니다. 이 도구가 하는 일은 메타데이터 정리와 구조 정규화입니다.</li>
        <li><strong>파일이 오히려 커질 수도 있나요?</strong> 네. 이미 최적으로 압축된 PDF는 구조를 다시 쓰는 과정에서 커질 수 있습니다. 항상 원본을 보관하세요.</li>
        <li><strong>왜 선택지가 2개뿐인가요?</strong> 이전에는 경량/중간/강력 3단계가 있었지만 strong은 medium과 동작이 완전히 같아 "강력"이라는 이름만 달랐습니다. 효과가 없는 단계를 두지 않기로 하고 <strong>keep</strong>(메타데이터 유지)과 <strong>strip</strong>(개인정보 필드 제거)만 남겼습니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#pc-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#pc-fi")!;
  const modeSel = wrap.querySelector<HTMLSelectElement>("#pc-mode")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  let file: File | null = null;

  dz.addEventListener("dragover", (e) => {
    e.preventDefault();
    dz.classList.add("hover");
  });
  dz.addEventListener("dragleave", () => dz.classList.remove("hover"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("hover");
    if (e.dataTransfer?.files?.[0]) {
      file = e.dataTransfer.files[0];
      setStatus("입력 준비 (input-ready)");
    }
  });
  fi.addEventListener("change", () => {
    if (fi.files?.[0]) {
      file = fi.files[0];
      setStatus("입력 준비 (input-ready)");
    }
  });
  clearBtn.addEventListener("click", () => {
    file = null;
    fi.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("pdf-compress");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — PDF를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: CompressInput = { file, mode: modeSel.value as CompressInput["mode"] };
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
    const r = res.output as CompressOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "정리 결과";
    card.appendChild(h);

    const info = document.createElement("p");
    info.className = "muted";
    const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
    const delta = r.originalSize - r.outputSize;
    const modeLabel = r.mode === "strip" ? "메타데이터 제거" : "메타데이터 유지";
    // 재작성은 파일을 키울 수도 있다. 증가를 "감소%"로 표시하면 안 된다.
    info.textContent =
      delta > 0
        ? `원본 ${kb(r.originalSize)} → 결과 ${kb(r.outputSize)} (${(delta / 1024).toFixed(1)} KB 감소) · ${modeLabel}`
        : delta < 0
          ? `원본 ${kb(r.originalSize)} → 결과 ${kb(r.outputSize)} (${(-delta / 1024).toFixed(1)} KB 증가) · ${modeLabel} · 이 도구는 크기를 줄이지 않습니다`
          : `원본 ${kb(r.originalSize)} → 결과 ${kb(r.outputSize)} (크기 변화 없음) · ${modeLabel}`;
    card.appendChild(info);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "다운로드";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: PDF Merge · PDF Split · PDF Metadata";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "pdf-compress" });
      downloadBlob(r.fileName, r.blob);
    });
  });
}

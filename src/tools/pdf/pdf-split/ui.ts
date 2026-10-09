/**
 * TOOLBOX v0.5.3 — PDF Split UI
 * 기존 UI 계약 준수. 파일 입력 + 모드 선택 + 분할.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { SplitInput, SplitOutput } from "./processor.ts";

export function renderPdfSplit(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="sp-dz" tabindex="0" role="button" aria-label="PDF를 끌어놓거나 선택하세요">
        <p><strong>PDF를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="sp-fi" accept="application/pdf" aria-label="PDF 선택" />
      </div>
      <p style="margin-top:12px;">
        <label for="sp-mode">분할 모드</label>
        <select id="sp-mode">
          <option value="all" selected>모든 페이지</option>
          <option value="odd">홀수 페이지</option>
          <option value="even">짝수 페이지</option>
          <option value="range">범위</option>
        </select>
      </p>
      <p id="sp-range-row" style="display:none;">
        <label for="sp-start">시작 페이지</label>
        <input type="number" id="sp-start" value="1" min="1" style="width:80px;" aria-label="시작 페이지" />
        <label for="sp-end">끝 페이지</label>
        <input type="number" id="sp-end" value="1" min="1" style="width:80px;" aria-label="끝 페이지" />
      </p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">분할하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>PDF를 드롭하거나 선택합니다.</li>
        <li>분할 모드를 선택합니다.</li>
        <li>분할하기를 누르면 결과가 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 PDF를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>어떤 모드가 있나요?</strong> 모든 페이지, 홀수, 짝수, 범위입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#sp-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#sp-fi")!;
  const modeSel = wrap.querySelector<HTMLSelectElement>("#sp-mode")!;
  const rangeRow = wrap.querySelector<HTMLParagraphElement>("#sp-range-row")!;
  const startInput = wrap.querySelector<HTMLInputElement>("#sp-start")!;
  const endInput = wrap.querySelector<HTMLInputElement>("#sp-end")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  let file: File | null = null;

  modeSel.addEventListener("change", () => {
    rangeRow.style.display = modeSel.value === "range" ? "block" : "none";
  });

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
    const manifest = getTool("pdf-split");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — PDF를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: SplitInput = {
      file,
      mode: modeSel.value as SplitInput["mode"],
      rangeStart: Number(startInput.value),
      rangeEnd: Number(endInput.value),
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
    const r = res.output as SplitOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "분할 결과";
    card.appendChild(h);

    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `총 ${r.pageCount}페이지 → ${r.splitCount}개 분할`;
    card.appendChild(info);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "다운로드";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: PDF Merge · PDF 정보 제거 · PDF Metadata";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "pdf-split" });
      downloadBlob(r.fileName, r.blob);
    });
  });
}

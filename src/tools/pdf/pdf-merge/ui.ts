/**
 * TOOLBOX v0.5.2 — PDF Merge UI
 * 기존 UI 계약 준수. 파일 목록 + 순서 변경 + 병합.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { MergeInput, MergeOutput } from "./processor.ts";

export function renderPdfMerge(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="mg-dz" tabindex="0" role="button" aria-label="PDF 파일을 끌어놓거나 선택하세요">
        <p><strong>PDF 파일을 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="mg-fi" accept="application/pdf" multiple aria-label="PDF 파일 선택" />
      </div>
      <p class="muted">최대 10개 파일. 순서는 업로드 순서대로 적용됩니다.</p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">병합하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>PDF 파일을 드롭하거나 선택합니다.</li>
        <li>병합하기를 누르면 하나의 PDF로 병합됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 PDF를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>몇 개까지 병합할 수 있나요?</strong> 최대 10개입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#mg-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#mg-fi")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  let files: File[] = [];

  dz.addEventListener("dragover", (e) => {
    e.preventDefault();
    dz.classList.add("hover");
  });
  dz.addEventListener("dragleave", () => dz.classList.remove("hover"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("hover");
    if (e.dataTransfer?.files) {
      files = [...e.dataTransfer.files];
      setStatus(`입력 준비 (input-ready): ${files.length}개`);
    }
  });
  fi.addEventListener("change", () => {
    if (fi.files) {
      files = [...fi.files];
      setStatus(`입력 준비 (input-ready): ${files.length}개`);
    }
  });
  clearBtn.addEventListener("click", () => {
    files = [];
    fi.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("pdf-merge");
    if (!manifest) return;
    if (files.length === 0) {
      setStatus("실패 (failed) — PDF를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: MergeInput = { files };
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
    const r = res.output as MergeOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "병합 결과";
    card.appendChild(h);

    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `${r.fileCount}개 파일 병합 · 총 ${(r.totalSize / 1024).toFixed(1)} KB`;
    card.appendChild(info);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "다운로드";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: PDF Split · PDF 정보 제거 · PDF Metadata";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "pdf-merge" });
      downloadBlob(r.fileName, r.blob);
    });
  });
}

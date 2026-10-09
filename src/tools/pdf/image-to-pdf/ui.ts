/**
 * TOOLBOX v0.5.6 — Image to PDF UI
 * 기존 UI 계약 준수. 파일 입력 + 페이지 크기/여백 선택 + 결과.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { ImageToPdfInput, ImageToPdfOutput } from "./processor.ts";

export function renderImageToPdf(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="ip-dz" tabindex="0" role="button" aria-label="이미지 파일을 끌어놓거나 선택하세요">
        <p><strong>이미지를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="ip-fi" accept="image/*" multiple aria-label="이미지 파일 선택" />
      </div>
      <p style="margin-top:12px;">
        <label for="ip-size">페이지 크기</label>
        <select id="ip-size">
          <option value="a4" selected>A4</option>
          <option value="letter">Letter</option>
          <option value="image">이미지 크기</option>
        </select>
      </p>
      <p>
        <label for="ip-margin">여백 (px)</label>
        <input type="number" id="ip-margin" value="20" min="0" max="100" style="width:80px;" aria-label="여백" />
      </p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">PDF로 변환</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>이미지를 드롭하거나 선택합니다.</li>
        <li>페이지 크기와 여백을 선택합니다.</li>
        <li>PDF로 변환을 누르고 결과를 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 이미지를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>몇 개까지 변환할 수 있나요?</strong> 최대 20개입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#ip-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#ip-fi")!;
  const sizeSel = wrap.querySelector<HTMLSelectElement>("#ip-size")!;
  const marginInput = wrap.querySelector<HTMLInputElement>("#ip-margin")!;
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
    const manifest = getTool("image-to-pdf");
    if (!manifest) return;
    if (files.length === 0) {
      setStatus("실패 (failed) — 이미지를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: ImageToPdfInput = {
      files,
      pageSize: sizeSel.value as ImageToPdfInput["pageSize"],
      margin: Number(marginInput.value),
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
    const r = res.output as ImageToPdfOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "변환 결과";
    card.appendChild(h);

    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `${r.pageCount}개 이미지 · ${r.pageSize.toUpperCase()} 페이지`;
    card.appendChild(info);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "다운로드";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: PDF Merge · PDF Split · PDF 정보 제거";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "image-to-pdf" });
      downloadBlob(r.fileName, r.blob);
    });
  });
}

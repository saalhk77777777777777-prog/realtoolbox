/**
 * TOOLBOX v0.5.5 — PDF to Image UI
 * 기존 UI 계약 준수. 파일 입력 + 포맷/품질 선택 + 결과.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { PdfToImageInput, PdfToImageOutput } from "./processor.ts";

export function renderPdfToImage(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="pi-dz" tabindex="0" role="button" aria-label="PDF를 끌어놓거나 선택하세요">
        <p><strong>PDF를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="pi-fi" accept="application/pdf" aria-label="PDF 선택" />
      </div>
      <p style="margin-top:12px;">
        <label for="pi-format">이미지 포맷</label>
        <select id="pi-format">
          <option value="png" selected>PNG</option>
          <option value="jpeg">JPEG</option>
        </select>
      </p>
      <p>
        <label for="pi-quality">품질: <span id="pi-q-val">0.92</span></label>
        <input type="range" id="pi-quality" min="0" max="1" step="0.01" value="0.92" style="width:100%;" aria-label="이미지 품질" />
      </p>
      <p>
        <label for="pi-scale">확대 배율: <span id="pi-s-val">2.0</span></label>
        <input type="range" id="pi-scale" min="0.5" max="4" step="0.1" value="2" style="width:100%;" aria-label="확대 배율" />
      </p>
      <p>
        <label for="pi-pages">페이지 <span class="muted">(비우면 전체)</span></label>
        <input type="text" id="pi-pages" placeholder="예: 1,3-5" aria-label="변환할 페이지 범위" />
      </p>
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
        <li>PDF를 드롭하거나 선택합니다.</li>
        <li>이미지 포맷과 품질을 선택합니다.</li>
        <li>변환하기를 누르고 결과를 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 PDF를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>몇 페이지를 변환하나요?</strong> 기본은 전체 페이지이며, <code>1,3-5</code>처럼 지정할 수 있습니다. 한 번에 최대 20페이지입니다.</li>
        <li><strong>확대 배율은?</strong> 기본 2배(≈144 DPI)입니다. 클수록 선명하지만 용량이 커집니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#pi-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#pi-fi")!;
  const formatSel = wrap.querySelector<HTMLSelectElement>("#pi-format")!;
  const qualityInput = wrap.querySelector<HTMLInputElement>("#pi-quality")!;
  const qualityVal = wrap.querySelector<HTMLSpanElement>("#pi-q-val")!;
  const scaleInput = wrap.querySelector<HTMLInputElement>("#pi-scale")!;
  const scaleVal = wrap.querySelector<HTMLSpanElement>("#pi-s-val")!;
  const pagesInput = wrap.querySelector<HTMLInputElement>("#pi-pages")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  let file: File | null = null;

  qualityInput.addEventListener("input", () => {
    qualityVal.textContent = Number(qualityInput.value).toFixed(2);
  });
  scaleInput.addEventListener("input", () => {
    scaleVal.textContent = Number(scaleInput.value).toFixed(1);
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
    const manifest = getTool("pdf-to-image");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — PDF를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: PdfToImageInput = {
      file,
      format: formatSel.value as PdfToImageInput["format"],
      quality: Number(qualityInput.value),
      scale: Number(scaleInput.value),
      pageNumbers: pagesInput.value,
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
    const r = res.output as PdfToImageOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "변환 결과";
    card.appendChild(h);

    const info = document.createElement("p");
    info.className = "muted";
    info.textContent =
      r.renderedCount === 1
        ? `${r.width}×${r.height} · ${r.format.toUpperCase()} · ${r.pageCount}페이지 중 ${r.pageNumbers[0]}페이지`
        : `${r.width}×${r.height} · ${r.format.toUpperCase()} · ${r.renderedCount}페이지 변환됨 (아래 ${r.renderedCount}개 모두 다운로드 가능)`;
    card.appendChild(info);

    for (const item of r.images) {
      const fig = document.createElement("figure");
      fig.style.margin = "0 0 16px";
      const img = document.createElement("img");
      img.src = item.dataUrl;
      img.alt = `${item.page}페이지 변환 이미지`;
      img.style.maxWidth = "100%";
      img.style.border = "1px solid var(--border)";
      const cap = document.createElement("figcaption");
      cap.className = "muted";
      cap.textContent = `${item.page}페이지 · ${item.width}×${item.height}`;
      fig.appendChild(img);
      fig.appendChild(cap);
      card.appendChild(fig);
    }

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = r.renderedCount === 1 ? "다운로드" : `${r.renderedCount}개 모두 다운로드`;
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: PDF Merge · PDF Split · PDF 정보 제거";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "pdf-to-image" });
      const ext = r.format === "png" ? "png" : "jpg";
      const base = inputName(file?.name ?? "", "pdf-image");
      for (const item of r.images) {
        downloadBlob(r.renderedCount === 1 ? `${base}.${ext}` : `${base}-p${item.page}.${ext}`, item.blob);
      }
      setStatus(`완료 (completed) — ${r.renderedCount}개 다운로드`);
    });
  });
}

/** 파일명에서 확장자를 뗀 안전한 기본 이름. */
function inputName(fileName: string, fallback: string): string {
  const base = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  return base || fallback;
}

/**
 * TOOLBOX v0.4.2 — Image Resizer UI
 * 기존 UI 계약 준수. Canvas 기반 리사이징.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { ResizeInput, ResizeOutput } from "./processor.ts";

export function renderImageResizer(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="rz-dz" tabindex="0" role="button" aria-label="이미지를 끌어놓거나 선택하세요">
        <p><strong>이미지를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <input type="file" id="rz-fi" accept="image/*" aria-label="이미지 선택" />
      </div>
      <p style="margin-top:12px;">
        <label for="rz-w">너비 (px)</label>
        <input type="number" id="rz-w" value="800" min="1" max="10000" style="width:100px;" aria-label="너비" />
        <label for="rz-h">높이 (px)</label>
        <input type="number" id="rz-h" value="600" min="1" max="10000" style="width:100px;" aria-label="높이" />
      </p>
      <p>
        <label><input type="checkbox" id="rz-keep" checked /> 비율 유지</label>
      </p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">리사이즈</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>이미지를 드롭하거나 선택합니다.</li>
        <li>너비/높이를 입력하고 비율 유지를 선택합니다.</li>
        <li>리사이즈를 누르고 결과를 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 이미지를 서버로 전송하지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>비율 유지란?</strong> 원본 비율을 유지하면서 크기를 조절합니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#rz-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#rz-fi")!;
  const wInput = wrap.querySelector<HTMLInputElement>("#rz-w")!;
  const hInput = wrap.querySelector<HTMLInputElement>("#rz-h")!;
  const keepCheck = wrap.querySelector<HTMLInputElement>("#rz-keep")!;
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
    const manifest = getTool("image-resizer");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — 이미지를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: ResizeInput = {
      file,
      width: Number(wInput.value),
      height: Number(hInput.value),
      keepAspect: keepCheck.checked,
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
    const r = res.output as ResizeOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "결과";
    card.appendChild(h);

    const img = document.createElement("img");
    img.src = r.dataUrl;
    img.alt = "리사이즈된 이미지";
    img.style.maxWidth = "100%";
    img.style.border = "1px solid var(--border)";
    card.appendChild(img);

    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `원본 ${r.originalWidth}×${r.originalHeight} → 결과 ${r.width}×${r.height}`;
    card.appendChild(info);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "다운로드";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: Image Compressor · Image Converter · Target Size Compressor";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "image-resizer" });
      downloadBlob("resized.png", r.blob);
    });
  });
}

/**
 * TOOLBOX v0.4.4 — Target Size Compressor UI
 * 기존 UI 계약 준수. Canvas 기반 압축, 이진 탐색.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { TargetInput, TargetOutput } from "./processor.ts";

export function renderTarget(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="tg-dz" tabindex="0" role="button" aria-label="이미지를 끌어놓거나 선택하세요">
        <p><strong>이미지를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="tg-fi" accept="image/*" aria-label="이미지 선택" />
      </div>
      <p style="margin-top:12px;">
        <label for="tg-size">목표 크기</label>
        <input type="number" id="tg-size" value="500" min="1" style="width:100px;" aria-label="목표 크기" />
        <select id="tg-unit">
          <option value="KB" selected>KB</option>
          <option value="MB">MB</option>
        </select>
      </p>
    </div>
    <div class="stickybar">
      <button id="run" type="button">압축하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>이미지를 드롭하거나 선택합니다.</li>
        <li>목표 크기와 단위를 입력합니다.</li>
        <li>압축하기를 누르면 목표 크기 이하로 압축됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 이미지를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>원본이 목표보다 작으면?</strong> 압축하지 않고 원본을 반환합니다.</li>
        <li><strong>목표 크기에 도달하지 못하면?</strong> 최소 품질로 압축한 결과를 반환합니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#tg-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#tg-fi")!;
  const sizeInput = wrap.querySelector<HTMLInputElement>("#tg-size")!;
  const unitSel = wrap.querySelector<HTMLSelectElement>("#tg-unit")!;
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
    const manifest = getTool("target-size-compressor");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — 이미지를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: TargetInput = {
      file,
      targetSize: Number(sizeInput.value),
      unit: unitSel.value as TargetInput["unit"],
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
    const r = res.output as TargetOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "결과";
    card.appendChild(h);

    const img = document.createElement("img");
    img.src = r.dataUrl;
    img.alt = "압축된 이미지";
    img.style.maxWidth = "100%";
    img.style.border = "1px solid var(--border)";
    card.appendChild(img);

    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `원본 ${r.originalSize.toLocaleString()}B → 결과 ${r.resultSize.toLocaleString()}B (목표 ${r.targetSize.toLocaleString()}B) · 품질 ${r.quality.toFixed(2)}`;
    card.appendChild(info);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "다운로드";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: Image Compressor · Image Resizer · Image Converter";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "target-size-compressor" });
      downloadBlob("compressed.jpg", r.blob);
    });
  });
}

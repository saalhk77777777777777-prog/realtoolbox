/**
 * TOOLBOX v0.13.2 — Image Compressor UI
 * 기존 UI 계약 준수. Canvas 기반 압축, 결과는 img 태그로 표시.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { ImageInput, ImageOutput } from "./processor.ts";

export function renderImageCompressor(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="img-dz" tabindex="0" role="button" aria-label="이미지를 끌어놓거나 선택하세요">
        <p><strong>이미지를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="img-fi" accept="image/*" aria-label="이미지 선택" />
      </div>
      <p style="margin-top:12px;">
        <label for="img-quality">품질: <span id="img-q-val">0.8</span></label>
        <input type="range" id="img-quality" min="0" max="1" step="0.05" value="0.8" style="width:100%;" aria-label="압축 품질" />
      </p>
      <p>
        <label for="img-format">출력 포맷</label>
        <select id="img-format">
          <option value="webp" selected>WebP (권장)</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG (무손실)</option>
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
        <li>품질과 출력 포맷을 선택합니다.</li>
        <li>압축하기를 누르고 결과를 확인합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 이미지를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>JPEG와 WebP 차이는?</strong> JPEG는 호환성이 좋고, WebP는 더 작은 파일 크기를 제공합니다.</li>
        <li><strong>PNG는 왜 품질이 없나요?</strong> PNG는 무손실 포맷이라 품질 조절이 의미가 없습니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#img-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#img-fi")!;
  const qualityInput = wrap.querySelector<HTMLInputElement>("#img-quality")!;
  const qualityVal = wrap.querySelector<HTMLSpanElement>("#img-q-val")!;
  const formatSel = wrap.querySelector<HTMLSelectElement>("#img-format")!;
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
  qualityInput.addEventListener("input", () => {
    qualityVal.textContent = Number(qualityInput.value).toFixed(2);
  });
  clearBtn.addEventListener("click", () => {
    file = null;
    fi.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("image-compressor");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — 이미지를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: ImageInput = {
      file,
      quality: Number(qualityInput.value),
      format: formatSel.value as ImageInput["format"],
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
    const r = res.output as ImageOutput;
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
    const delta = Math.round((1 - r.compressedSize / r.originalSize) * 100);
    if (r.expanded && r.compressedSize > r.originalSize) {
      info.textContent = `원본 ${r.originalSize.toLocaleString()}B → 결과 ${r.compressedSize.toLocaleString()}B (${Math.abs(delta)}% 증가) · ${r.width}×${r.height} · ${r.format.toUpperCase()} · PNG는 무손실이라 오히려 커질 수 있습니다.`;
    } else {
      info.textContent = `원본 ${r.originalSize.toLocaleString()}B → 압축 ${r.compressedSize.toLocaleString()}B (${delta}% 감소) · ${r.width}×${r.height} · ${r.format.toUpperCase()}`;
    }
    card.appendChild(info);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "다운로드";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: Image Resizer · Image Converter · Target Size Compressor";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "image-compressor" });
      const ext = r.format === "png" ? "png" : r.format === "webp" ? "webp" : "jpg";
      downloadBlob(`compressed.${ext}`, r.blob);
    });
  });
}

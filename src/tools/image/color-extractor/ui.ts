/**
 * TOOLBOX v0.4.5 — Color Extractor UI
 * 기존 UI 계약 준수. Canvas 기반 색상 추출.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { ColorInput, ColorOutput } from "./processor.ts";

export function renderColor(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="ce-dz" tabindex="0" role="button" aria-label="이미지를 끌어놓거나 선택하세요">
        <p><strong>이미지를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="ce-fi" accept="image/*" aria-label="이미지 선택" />
      </div>
    </div>
    <div class="stickybar">
      <button id="run" type="button">색상 추출</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>이미지를 드롭하거나 선택합니다.</li>
        <li>색상 추출을 누르면 주요 색상 팔레트가 표시됩니다.</li>
        <li>각 색상을 복사하거나 JSON으로보내기 할 수 있습니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 이미지를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>팔레트는 어떻게 추출하나요?</strong> 이미지를 샘플링하여 비슷한 색상을 그룹화합니다.</li>
        <li><strong>몇 개의 색상이 추출되나요?</strong> 최대 12개입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#ce-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#ce-fi")!;
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
    const manifest = getTool("color-extractor");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — 이미지를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: ColorInput = { file };
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
    const r = res.output as ColorOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = `색상 팔레트 (${r.palette.length}개)`;
    card.appendChild(h);

    const img = document.createElement("img");
    img.src = r.dataUrl;
    img.alt = "원본 이미지";
    img.style.maxWidth = "200px";
    img.style.border = "1px solid var(--border)";
    card.appendChild(img);

    const grid = document.createElement("div");
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.gap = "8px";
    grid.style.marginTop = "12px";
    for (const c of r.palette) {
      const swatch = document.createElement("div");
      swatch.style.width = "48px";
      swatch.style.height = "48px";
      swatch.style.backgroundColor = c.hex;
      swatch.style.border = "1px solid var(--border)";
      swatch.style.borderRadius = "4px";
      swatch.title = `${c.hex} RGB(${c.rgb.r},${c.rgb.g},${c.rgb.b})`;
      grid.appendChild(swatch);
    }
    card.appendChild(grid);

    const list = document.createElement("ul");
    list.style.marginTop = "12px";
    for (const c of r.palette) {
      const li = document.createElement("li");
      li.textContent = `${c.hex} — RGB(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}) — HSL(${c.hsl.h}°, ${c.hsl.s}%, ${c.hsl.l}%)`;
      list.appendChild(li);
    }
    card.appendChild(list);

    const btns = document.createElement("p");
    const cp = document.createElement("button");
    cp.type = "button";
    cp.textContent = "복사";
    const dl = document.createElement("button");
    dl.type = "button";
    dl.className = "secondary";
    dl.textContent = "JSON보내기";
    btns.appendChild(cp);
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: Image Compressor · Image Resizer · Image Converter";
    card.appendChild(next);

    const text = r.palette.map((c) => `${c.hex} RGB(${c.rgb.r},${c.rgb.g},${c.rgb.b}) HSL(${c.hsl.h},${c.hsl.s}%,${c.hsl.l}%)`).join("\n");
    cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        setStatus("완료 (completed) — 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    dl.addEventListener("click", () => {
      track("download", { tool: "color-extractor" });
      downloadText("palette.json", JSON.stringify(r.palette, null, 2), "application/json");
    });
  });
}

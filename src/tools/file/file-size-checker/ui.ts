/**
 * TOOLBOX v0.1.0 — File Size Checker UI
 * 상태: idle → input-ready → validating → processing → completed/failed
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { SizeCheckInput, SizeCheckOutput } from "./processor.ts";

export function renderFileSizeChecker(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="dropzone" id="dz" tabindex="0" role="button" aria-label="파일을 끌어놓거나 선택하세요">
      <p><strong>파일을 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
      <p class="muted">파일 내용은 읽지 않습니다. 이름·크기·종류만 확인합니다. (Local processing)</p>
      <input type="file" id="fi" multiple aria-label="파일 선택" />
    </div>
    <div class="stickybar">
      <button id="run" type="button">확인하기</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>파일을 드롭하거나 선택합니다.</li>
        <li>확인하기를 누르면 즉시 분석합니다.</li>
        <li>Bytes / KB / MB / GB를 확인하고 필요하면 다음 도구로 이동합니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 파일을 서버로 전송하지 않습니다. 분석은 브라우저 내부에서만 수행됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>업로드되나요?</strong> 아니요. File 객체의 메타데이터만 읽습니다.</li>
        <li><strong>확장자와 MIME이 다르면?</strong> “확장자와 MIME이 다를 수 있음”으로 표시합니다.</li>
        <li><strong>결과 저장?</strong> JSON 내보내기로 저장할 수 있습니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#fi")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  let files: File[] = [];
  const setStatus = (s: string) => {
    status.textContent = s;
  };

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
      track("file_selected", { tool: "file-size-checker", count: files.length });
      setStatus(`입력 준비 (input-ready): ${files.length}개`);
    }
  });
  fi.addEventListener("change", () => {
    files = [...fi.files!];
    track("file_selected", { tool: "file-size-checker", count: files.length });
    setStatus(`입력 준비 (input-ready): ${files.length}개`);
  });
  clearBtn.addEventListener("click", () => {
    files = [];
    fi.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("file-size-checker");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const input: SizeCheckInput = { files };
    setStatus("처리 중 (processing)…");
    const res = await runTool(manifest, input);
    if (!res.ok) {
      setStatus("실패 (failed)");
      const d = document.createElement("div");
      d.className = "error";
      d.textContent = toUserMessage(res.error!);
      out.appendChild(d);
      return;
    }
    const data = res.output as SizeCheckOutput;
    setStatus("완료 (completed)");
    const table = document.createElement("div");
    table.className = "result";
    const rows = data.rows
      .map(
        (r) => `<tr><td>${escapeHtml(r.name)}</td><td>${r.bytes}</td><td>${escapeHtml(r.decimal)}</td><td>${escapeHtml(r.binary)}</td><td>${escapeHtml(r.mime)} / .${escapeHtml(r.extension)}</td><td>${r.mimeMismatch ? "확장자와 MIME이 다를 수 있음" : "—"}</td></tr>`,
      )
      .join("");
    table.innerHTML = `
      <h2>결과</h2>
      <table><thead><tr><th>파일명</th><th>Bytes</th><th>Decimal</th><th>Binary</th><th>MIME/확장자</th><th>주의</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p><button type="button" id="dl">JSON 내보내기</button></p>
      <p class="muted">다음 작업: Target Size Compressor · Image Compressor · ZIP Viewer</p>
    `;
    out.appendChild(table);
    table.querySelector<HTMLButtonElement>("#dl")!.addEventListener("click", () => {
      track("download", { tool: "file-size-checker" });
      downloadText(
        "file-size-checker-result.json",
        JSON.stringify(data, null, 2),
        "application/json",
      );
    });
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

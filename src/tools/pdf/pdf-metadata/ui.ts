/**
 * TOOLBOX v0.5.1 — PDF Metadata UI
 * 기존 UI 계약 준수. 결과는 테이블로 표시.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { PdfMetaInput, PdfMetaOutput } from "./processor.ts";

export function renderPdfMeta(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="dropzone" id="pm-dz" tabindex="0" role="button" aria-label="PDF를 끌어놓거나 선택하세요">
        <p><strong>PDF를 여기로 끌어놓기</strong> 또는 아래 버튼으로 선택</p>
        <p class="muted">파일 내용은 서버로 전송되지 않습니다. (Local processing)</p>
        <input type="file" id="pm-fi" accept="application/pdf" aria-label="PDF 선택" />
      </div>
    </div>
    <div class="stickybar">
      <button id="run" type="button">정보 확인</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>PDF를 드롭하거나 선택합니다.</li>
        <li>정보 확인을 누르면 메타데이터가 표시됩니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 PDF를 서버로 전송하지 않습니다. 브라우저 내부에서만 처리됩니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>어떤 정보가 표시되나요?</strong> 페이지 수, 제목, 작성자, 생성일 등입니다.</li>
        <li><strong>입력값이 서버로 전송되는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const dz = wrap.querySelector<HTMLDivElement>("#pm-dz")!;
  const fi = wrap.querySelector<HTMLInputElement>("#pm-fi")!;
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
    const manifest = getTool("pdf-metadata");
    if (!manifest) return;
    if (!file) {
      setStatus("실패 (failed) — PDF를 선택하세요");
      return;
    }
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: PdfMetaInput = { file };
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
    const r = res.output as PdfMetaOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    const h = document.createElement("h2");
    h.textContent = "PDF 정보";
    card.appendChild(h);

    const table = document.createElement("table");
    const rows: Array<[string, string]> = [
      ["파일명", r.fileName],
      ["파일 크기", `${(r.fileSize / 1024).toFixed(1)} KB`],
      ["페이지 수", String(r.pageCount)],
      ["PDF 버전", r.pdfVersion],
      ["암호화", r.isEncrypted ? "예" : "아니오"],
      ["제목", r.title || "(없음)"],
      ["작성자", r.author || "(없음)"],
      ["주제", r.subject || "(없음)"],
      ["키워드", r.keywords || "(없음)"],
      ["생성 프로그램", r.creator || "(없음)"],
      ["변환 프로그램", r.producer || "(없음)"],
      ["생성일", r.creationDate || "(없음)"],
      ["수정일", r.modDate || "(없음)"],
    ];
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    for (const t of ["항목", "값"]) {
      const th = document.createElement("th");
      th.textContent = t;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (const [k, v] of rows) {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = k;
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    card.appendChild(table);

    const btns = document.createElement("p");
    const dl = document.createElement("button");
    dl.type = "button";
    dl.textContent = "JSON으로 저장";
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: PDF Merge · PDF Split · PDF 정보 제거";
    card.appendChild(next);

    dl.addEventListener("click", () => {
      track("download", { tool: "pdf-metadata" });
      downloadText("pdf-metadata.json", JSON.stringify(r, null, 2), "application/json");
    });
  });
}

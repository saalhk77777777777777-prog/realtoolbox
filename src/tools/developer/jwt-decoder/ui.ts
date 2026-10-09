/**
 * TOOLBOX v0.2.5 — JWT Decoder UI
 * 기존 UI 계약 준수: stickybar 디코드/지우기, role=status 상태 전이,
 * result/error/warning 패널, 복사·다운로드, 사용법·개인정보·FAQ.
 * 사용자 입력·결과는 textarea.value + textContent로만 취급한다.
 * innerHTML/insertAdjacentHTML/eval/Function을 사용하지 않는다.
 * "디코딩은 서명 검증이 아닙니다" 배너를 고정 표시한다.
 */
import { runTool } from "../../../core/toolRunner.ts";
import { getTool } from "../../../core/toolRegistry.ts";
import { toUserMessage } from "../../../core/errorMapper.ts";
import { downloadText } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import type { JwtInput, JwtOutput } from "./processor.ts";

export function renderJwt(mount: HTMLElement): void {
  mount.innerHTML = "";
  const wrap = document.createElement("div");

  wrap.innerHTML = `
    <div class="card">
      <div class="error" role="alert" style="margin-bottom:12px;">
        <strong>디코딩은 서명 검증이 아닙니다.</strong> 이 도구는 JWT 구조를 읽어 보여주는 것뿐입니다.
        서명이 유효한지, 토큰이 안전한지, 인증에 성공했는지는 확인하지 않습니다.
      </div>
      <div class="card" style="background:#fffbeb;border-color:#fde68a;">
        <strong>개인정보 주의:</strong> JWT에는 민감한 인증 정보가 포함될 수 있습니다.
        이 도구는 브라우저에서 로컬로 디코딩하며 토큰을 서버로 전송하지 않습니다.
        붙여넣은 토큰은 확인 후 지우기를 권장합니다.
      </div>
      <p style="margin-top:12px;"><label for="jwt-input"><strong>JWT 입력</strong> <span class="muted">(브라우저에서만 처리)</span></label></p>
      <textarea id="jwt-input" rows="4" style="width:100%;padding:12px;font-size:14px;font-family:monospace;border:1px solid var(--border);border-radius:var(--radius);" placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c" aria-label="JWT 입력" spellcheck="false"></textarea>
    </div>
    <div class="stickybar">
      <button id="run" type="button">디코드</button>
      <button id="clear" type="button" class="secondary">지우기</button>
    </div>
    <div id="status" class="muted" role="status">대기 중 (idle)</div>
    <div id="out"></div>
    <section class="card" aria-label="사용법">
      <h2>사용법</h2>
      <ol>
        <li>JWT를 붙여넣습니다.</li>
        <li>디코드를 누르면 Header·Payload·Signature 구조가 표시됩니다.</li>
        <li>각 영역을 복사하거나 전체를 내려받을 수 있습니다.</li>
      </ol>
      <h2>개인정보 처리</h2>
      <p>이 도구는 JWT를 서버로 전송하지 않습니다. 사용 통계에도 토큰 원문·Header·Payload·Signature 값을 기록하지 않습니다.</p>
      <h2>FAQ</h2>
      <ul>
        <li><strong>JWT란?</strong> JSON Web Token의 약자로, 당사자 간에 정보를 JSON 객체로 안전하게 전달하기 위한 표준입니다.</li>
        <li><strong>JWT Decoder는 무엇을 하는가?</strong> JWT를 디코딩해 Header와 Payload 내용을 사람이 읽기 쉽게 보여줍니다.</li>
        <li><strong>Header와 Payload의 차이는?</strong> Header는 토큰의 메타정보(알고리즘 등), Payload는 실제 데이터(claim)입니다.</li>
        <li><strong>JWT Signature를 검증하는가?</strong> 아닙니다. 이 도구는 서명을 디코딩만 할 뿐 검증하지 않습니다. "디코딩은 서명 검증이 아닙니다."</li>
        <li><strong>JWT를 디코딩하면 비밀번호가 보이는가?</strong> JWT에 비밀번호가 포함되어 있다면 디코딩된 Payload에 표시될 수 있습니다. 민감한 정보는 JWT에 포함하지 않아야 합니다.</li>
        <li><strong>JWT를 서버로 전송하는가?</strong> 아니요. 브라우저 내부에서만 처리됩니다.</li>
        <li><strong><code>alg</code>가 <code>none</code>이면 어떻게 되는가?</strong> "alg=none" 사실과 보안 경고를 표시합니다. 실행하거나 우회 검증을 시도하지 않습니다.</li>
        <li><strong><code>exp</code>가 지나면 자동으로 토큰이 invalid인가?</strong> 아닙니다. 이 도구는 만료 여부를 판단하지 않습니다. 시간 값을 보조 표시만 합니다.</li>
        <li><strong>JWT와 Base64는 어떤 관계인가?</strong> JWT의 각 segment는 Base64URL 인코딩을 사용합니다. 일반 Base64와 다르며, 이 도구는 Base64URL을 올바르게 디코딩합니다.</li>
      </ul>
    </section>
  `;
  mount.appendChild(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("#jwt-input")!;
  const runBtn = wrap.querySelector<HTMLButtonElement>("#run")!;
  const clearBtn = wrap.querySelector<HTMLButtonElement>("#clear")!;
  const status = wrap.querySelector<HTMLDivElement>("#status")!;
  const out = wrap.querySelector<HTMLDivElement>("#out")!;

  const setStatus = (s: string) => {
    status.textContent = s;
  };

  input.addEventListener("input", () => {
    setStatus(input.value.trim().length === 0 ? "대기 중 (idle)" : "입력 준비 (input-ready)");
  });
  clearBtn.addEventListener("click", () => {
    input.value = "";
    out.innerHTML = "";
    setStatus("대기 중 (idle)");
    input.focus();
  });

  runBtn.addEventListener("click", async () => {
    const manifest = getTool("jwt-decoder");
    if (!manifest) return;
    setStatus("검증 중 (validating)…");
    out.innerHTML = "";
    const data: JwtInput = { text: input.value };
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
    const r = res.output as JwtOutput;
    setStatus("완료 (completed)");
    const card = document.createElement("div");
    card.className = "result";
    out.appendChild(card);

    // 경고 영역
    if (r.metadata.algorithm === "none") {
      const warn = document.createElement("div");
      warn.className = "error";
      warn.setAttribute("role", "alert");
      warn.textContent =
        "경고: alg=none — 서명이 없거나 검증되지 않은 토큰입니다. 보안 위험이 있을 수 있습니다.";
      card.appendChild(warn);
    }
    if (r.signatureEmpty) {
      const warn = document.createElement("div");
      warn.className = "error";
      warn.textContent = "경고: 서명이 비어 있습니다. 구조는 디코딩되었으나 서명 검증은 하지 않습니다.";
      card.appendChild(warn);
    }

    // Header 패널
    const headerSection = document.createElement("section");
    headerSection.className = "card";
    const headerTitle = document.createElement("h2");
    headerTitle.textContent = "Header";
    headerSection.appendChild(headerTitle);
    const headerPre = document.createElement("textarea");
    headerPre.rows = 4;
    headerPre.readOnly = true;
    headerPre.style.width = "100%";
    headerPre.style.fontFamily = "monospace";
    headerPre.style.fontSize = "14px";
    headerPre.setAttribute("aria-label", "디코딩된 Header JSON");
    headerPre.value = JSON.stringify(r.header, null, 2);
    headerSection.appendChild(headerPre);
    const headerCopy = document.createElement("button");
    headerCopy.type = "button";
    headerCopy.textContent = "Header 복사";
    headerCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(headerPre.value);
        setStatus("완료 (completed) — Header 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    headerSection.appendChild(headerCopy);
    card.appendChild(headerSection);

    // Payload 패널
    const payloadSection = document.createElement("section");
    payloadSection.className = "card";
    const payloadTitle = document.createElement("h2");
    payloadTitle.textContent = "Payload";
    payloadSection.appendChild(payloadTitle);
    const payloadPre = document.createElement("textarea");
    payloadPre.rows = 8;
    payloadPre.readOnly = true;
    payloadPre.style.width = "100%";
    payloadPre.style.fontFamily = "monospace";
    payloadPre.style.fontSize = "14px";
    payloadPre.setAttribute("aria-label", "디코딩된 Payload JSON");
    payloadPre.value = JSON.stringify(r.payload, null, 2);
    payloadSection.appendChild(payloadPre);
    const payloadCopy = document.createElement("button");
    payloadCopy.type = "button";
    payloadCopy.textContent = "Payload 복사";
    payloadCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(payloadPre.value);
        setStatus("완료 (completed) — Payload 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    payloadSection.appendChild(payloadCopy);
    card.appendChild(payloadSection);

    // Signature 패널
    const sigSection = document.createElement("section");
    sigSection.className = "card";
    const sigTitle = document.createElement("h2");
    sigTitle.textContent = "Signature";
    sigSection.appendChild(sigTitle);
    const sigInfo = document.createElement("p");
    sigInfo.className = "muted";
    sigInfo.textContent = `길이: ${r.signatureBytes} bytes`;
    sigSection.appendChild(sigInfo);
    const sigPre = document.createElement("textarea");
    sigPre.rows = 3;
    sigPre.readOnly = true;
    sigPre.style.width = "100%";
    sigPre.style.fontFamily = "monospace";
    sigPre.style.fontSize = "14px";
    sigPre.style.wordBreak = "break-all";
    sigPre.setAttribute("aria-label", "서명 hex");
    sigPre.value = r.signatureHex === "" ? "(빈 서명)" : r.signatureHex;
    sigSection.appendChild(sigPre);
    const sigCopy = document.createElement("button");
    sigCopy.type = "button";
    sigCopy.textContent = "Signature 복사";
    sigCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(r.signatureHex);
        setStatus("완료 (completed) — Signature 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    sigSection.appendChild(sigCopy);
    card.appendChild(sigSection);

    // Metadata 패널
    const metaSection = document.createElement("section");
    metaSection.className = "card";
    const metaTitle = document.createElement("h2");
    metaTitle.textContent = "Metadata (Claims)";
    metaSection.appendChild(metaTitle);
    const metaList = document.createElement("table");
    const metaRows: Array<[string, string]> = [];
    if (r.metadata.algorithm !== undefined) metaRows.push(["alg", r.metadata.algorithm]);
    if (r.metadata.type !== undefined) metaRows.push(["typ", r.metadata.type]);
    if (r.metadata.keyId !== undefined) metaRows.push(["kid", r.metadata.keyId]);
    if (r.metadata.issuer !== undefined) metaRows.push(["iss", r.metadata.issuer]);
    if (r.metadata.subject !== undefined) metaRows.push(["sub", r.metadata.subject]);
    if (r.metadata.audience !== undefined)
      metaRows.push(["aud", JSON.stringify(r.metadata.audience)]);
    if (r.metadata.issuedAt) {
      metaRows.push(["iat", String(r.metadata.issuedAt.value)]);
      if (r.metadata.issuedAt.utc) metaRows.push(["iat (UTC)", r.metadata.issuedAt.utc]);
    }
    if (r.metadata.expiration) {
      metaRows.push(["exp", String(r.metadata.expiration.value)]);
      if (r.metadata.expiration.utc) metaRows.push(["exp (UTC)", r.metadata.expiration.utc]);
    }
    if (r.metadata.notBefore) {
      metaRows.push(["nbf", String(r.metadata.notBefore.value)]);
      if (r.metadata.notBefore.utc) metaRows.push(["nbf (UTC)", r.metadata.notBefore.utc]);
    }
    if (r.metadata.jwtId !== undefined) metaRows.push(["jti", r.metadata.jwtId]);
    if (metaRows.length === 0) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "등록된 claim이 없습니다.";
      metaSection.appendChild(p);
    } else {
      const thead = document.createElement("thead");
      const hr = document.createElement("tr");
      for (const t of ["Claim", "값"]) {
        const th = document.createElement("th");
        th.textContent = t;
        hr.appendChild(th);
      }
      thead.appendChild(hr);
      metaList.appendChild(thead);
      const tbody = document.createElement("tbody");
      for (const [k, v] of metaRows) {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.scope = "row";
        th.textContent = k;
        const td = document.createElement("td");
        td.textContent = v;
        td.style.overflowWrap = "anywhere";
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
      metaList.appendChild(tbody);
      metaSection.appendChild(metaList);
    }
    card.appendChild(metaSection);

    // 전체 복사/다운로드
    const btns = document.createElement("p");
    const cpAll = document.createElement("button");
    cpAll.type = "button";
    cpAll.textContent = "전체 복사";
    const dl = document.createElement("button");
    dl.type = "button";
    dl.className = "secondary";
    dl.textContent = ".txt 내려받기";
    btns.appendChild(cpAll);
    btns.appendChild(dl);
    card.appendChild(btns);

    const next = document.createElement("p");
    next.className = "muted";
    next.textContent = "다음 작업: Base64 · JSON Formatter · URL Parser";
    card.appendChild(next);

    const fullText = [
      "=== Header ===",
      JSON.stringify(r.header, null, 2),
      "",
      "=== Payload ===",
      JSON.stringify(r.payload, null, 2),
      "",
      "=== Signature ===",
      `Length: ${r.signatureBytes} bytes`,
      `Hex: ${r.signatureHex || "(empty)"}`,
      "",
      "=== Metadata ===",
      ...metaRows.map(([k, v]) => `${k}: ${v}`),
    ].join("\n");

    cpAll.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(fullText);
        setStatus("완료 (completed) — 전체 복사됨");
      } catch {
        setStatus("실패 (failed) — 클립보드 접근 불가");
      }
    });
    dl.addEventListener("click", () => {
      // JWT 원문은 analytics에 포함하지 않는다
      track("download", { tool: "jwt-decoder" });
      downloadText("jwt-decode-result.txt", fullText, "text/plain");
    });
  });
}

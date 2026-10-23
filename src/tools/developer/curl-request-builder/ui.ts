/** TOOLBOX v0.17.0 — cURL Request Builder UI. */
import { process as build, validate } from "./processor.ts";

const esc = (value: unknown): string => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function render(mount: HTMLElement): void {
  mount.innerHTML = `
    <style>
      .curl-builder label{display:flex;flex-direction:column;gap:6px;margin:12px 0;color:var(--muted,#a8b5ce)}
      .curl-builder input,.curl-builder textarea,.curl-builder select{box-sizing:border-box;width:100%;padding:10px;border:1px solid var(--line,#34445f);border-radius:9px;background:var(--surface,#091324);color:inherit;font:inherit}
      .curl-builder textarea{font:12px/1.55 ui-monospace,Consolas,monospace;resize:vertical}
      .curl-builder .curl-row{display:grid;grid-template-columns:minmax(100px,150px) minmax(0,1fr);gap:12px}
      .curl-builder .curl-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
      .curl-builder .curl-output{margin-top:18px}.curl-builder h3{margin:18px 0 8px}
      .curl-builder .curl-note{font-size:13px;color:var(--muted,#a8b5ce)}
      @media(max-width:520px){.curl-builder .curl-row{grid-template-columns:1fr}}
    </style>
    <section class="tool-panel curl-builder">
      <h2>HTTP 요청 구성</h2>
      <div class="curl-row">
        <label>메서드<select id="cr-method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option><option>OPTIONS</option></select></label>
        <label>요청 URL<input id="cr-url" type="url" value="https://api.example.com/items" placeholder="https://api.example.com/path"></label>
      </div>
      <label>헤더 (한 줄에 이름: 값)<textarea id="cr-headers" rows="4" spellcheck="false" placeholder="Accept: application/json&#10;Content-Type: application/json&#10;Authorization: Bearer YOUR_TOKEN"></textarea></label>
      <label>요청 본문<textarea id="cr-body" rows="7" spellcheck="false" placeholder="{&#10;  &quot;name&quot;: &quot;example&quot;&#10;}"></textarea></label>
      <p class="curl-note">토큰과 비밀번호는 실제 값 대신 플레이스홀더를 사용하세요. 이 도구는 요청을 전송하지 않고 명령어/코드만 생성합니다.</p>
      <div class="curl-actions"><button id="cr-build" type="button">명령어 생성</button><button id="cr-copy-curl" class="secondary" type="button" disabled>cURL 복사</button><button id="cr-copy-fetch" class="secondary" type="button" disabled>fetch 복사</button></div>
      <div id="cr-error" role="status" aria-live="polite"></div>
      <div class="curl-output">
        <h3>cURL</h3><textarea id="cr-curl" rows="5" readonly spellcheck="false" placeholder="생성된 cURL 명령어"></textarea>
        <h3>JavaScript fetch</h3><textarea id="cr-fetch" rows="8" readonly spellcheck="false" placeholder="생성된 fetch 코드"></textarea>
      </div>
    </section>`;
  const $ = <T extends HTMLElement>(selector: string): T => mount.querySelector<T>(selector)!;
  const methodInput = $("#cr-method") as HTMLSelectElement;
  const urlInput = $("#cr-url") as HTMLInputElement;
  const headersInput = $("#cr-headers") as HTMLTextAreaElement;
  const bodyInput = $("#cr-body") as HTMLTextAreaElement;
  const curlOutput = $("#cr-curl") as HTMLTextAreaElement;
  const fetchOutput = $("#cr-fetch") as HTMLTextAreaElement;
  const errorOutput = $("#cr-error");
  const copyCurl = $("#cr-copy-curl") as HTMLButtonElement;
  const copyFetch = $("#cr-copy-fetch") as HTMLButtonElement;

  const generate = (): void => {
    const headers = headersInput.value.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
      const index = line.indexOf(":");
      return index < 1 ? { name: "", value: line } : { name: line.slice(0, index).trim(), value: line.slice(index + 1).trim() };
    });
    const input = { method: methodInput.value, url: urlInput.value, headers, body: bodyInput.value, includeBody: true };
    const error = validate(input);
    if (error) {
      errorOutput.innerHTML = `<p class="error">${esc(error.what)} ${esc(error.how)}</p>`;
      curlOutput.value = ""; fetchOutput.value = ""; copyCurl.disabled = true; copyFetch.disabled = true;
      return;
    }
    try {
      const output = build(input);
      curlOutput.value = output.curl;
      fetchOutput.value = output.fetch;
      errorOutput.innerHTML = '<p class="success">명령어를 생성했습니다. 실제 API 요청은 실행하지 않았습니다.</p>';
      copyCurl.disabled = false; copyFetch.disabled = false;
    } catch (error) {
      errorOutput.innerHTML = `<p class="error">${esc(error instanceof Error ? error.message : error)}</p>`;
      copyCurl.disabled = true; copyFetch.disabled = true;
    }
  };
  const copy = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      errorOutput.innerHTML = '<p class="success">클립보드에 복사했습니다.</p>';
    } catch {
      errorOutput.innerHTML = '<p class="error">브라우저에서 자동 복사를 허용하지 않았습니다. 출력란을 직접 복사하세요.</p>';
    }
  };
  $("#cr-build").addEventListener("click", generate);
  copyCurl.addEventListener("click", () => void copy(curlOutput.value));
  copyFetch.addEventListener("click", () => void copy(fetchOutput.value));
}

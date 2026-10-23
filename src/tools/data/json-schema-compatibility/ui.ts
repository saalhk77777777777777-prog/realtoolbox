/** TOOLBOX v0.15.0 — JSON Schema Compatibility Checker UI. */
import { process as run, validate } from "./processor.ts";
export function render(mount: HTMLElement): void {
  mount.innerHTML = "<section class='tool-panel'><h2>JSON Schema 호환성 검사</h2><div class='tool-grid compact'><label>이전 스키마<textarea name='before' rows='10'></textarea></label><label>새 스키마<textarea name='after' rows='10'></textarea></label></div><button id='run' type='button'>호환성 검사</button><label>결과<textarea id='out' rows='14' readonly></textarea></label><button id='copy' type='button'>결과 복사</button><p id='hint' class='muted'>필드·타입·필수 조건 중심의 기본 비교입니다.</p></section>";
  const fields = mount.querySelectorAll<HTMLTextAreaElement>("[name]");
  fields[0]!.value = JSON.stringify({ type: "object", properties: { name: { type: "string" }, level: { type: "integer" } }, required: ["name"] }, null, 2);
  fields[1]!.value = JSON.stringify({ type: "object", properties: { name: { type: "string" }, level: { type: "string" }, active: { type: "boolean" } }, required: ["name", "active"] }, null, 2);
  const out = mount.querySelector<HTMLTextAreaElement>("#out")!, hint = mount.querySelector<HTMLElement>("#hint")!;
  mount.querySelector("#run")!.addEventListener("click", () => {
    const raw = { before: fields[0]!.value, after: fields[1]!.value }, e = validate(raw);
    if (e) { out.value = e.what + "\n" + e.how; return; }
    try { out.value = JSON.stringify(run(raw), null, 2); } catch (err) { out.value = err instanceof Error ? err.message : String(err); }
  });
  mount.querySelector("#copy")!.addEventListener("click", async () => { try { await navigator.clipboard.writeText(out.value); hint.textContent = "복사했습니다."; } catch { hint.textContent = "클립보드 접근이 거부되었습니다."; } });
}

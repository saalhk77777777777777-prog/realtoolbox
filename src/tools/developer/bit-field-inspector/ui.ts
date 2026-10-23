/** TOOLBOX v0.15.0 — Bit Field Inspector UI. */
import { process as run, validate } from "./processor.ts";
export function render(mount: HTMLElement): void {
  mount.innerHTML = "<section class='tool-panel'><h2>비트 필드 해석기</h2><label>10진수 정수<input name='value' type='number' min='0' step='1' value='42'></label><label>비트 폭<input name='width' type='number' min='1' max='53' step='1' value='8'></label><button id='run' type='button'>비트 분석</button><label>결과<textarea id='out' rows='10' readonly></textarea></label><button id='copy' type='button'>결과 복사</button><p id='hint' class='muted'></p></section>";
  const out = mount.querySelector<HTMLTextAreaElement>("#out")!, hint = mount.querySelector<HTMLElement>("#hint")!;
  mount.querySelector("#run")!.addEventListener("click", () => { const raw = { value: Number(mount.querySelector<HTMLInputElement>("[name=value]")!.value), width: Number(mount.querySelector<HTMLInputElement>("[name=width]")!.value) }; const e = validate(raw); if (e) { out.value = e.what + "\n" + e.how; return; } try { out.value = JSON.stringify(run(raw), null, 2); } catch (err) { out.value = err instanceof Error ? err.message : String(err); } });
  mount.querySelector("#copy")!.addEventListener("click", async () => { try { await navigator.clipboard.writeText(out.value); hint.textContent = "복사했습니다."; } catch { hint.textContent = "클립보드 접근이 거부되었습니다."; } });
}

/** TOOLBOX v0.14.74 — Safer video selection and engine-load feedback */
import { downloadBlob } from "../../../core/downloadManager.ts";
import { track } from "../../../analytics/analytics.ts";
import { convertVideoToAnimatedWebP, MAX_VIDEO_BYTES, validateVideoToWebP, type VideoToWebPOptions, type VideoToWebPResult } from "./processor.ts";

const formatBytes = (bytes: number): string => bytes < 1024 * 1024
  ? `${(bytes / 1024).toFixed(0)} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function renderVideoToWebP(mount: HTMLElement): void {
  mount.innerHTML = `
    <div class="card">
      <div class="dropzone" id="vwp-drop" tabindex="0" role="button" aria-label="영상 파일을 끌어놓거나 선택하세요">
        <p><strong>영상 파일을 여기에 끌어놓으세요</strong></p>
        <p class="muted">MP4 · MOV · WebM · 최대 150MB</p>
        <input id="vwp-file" type="file" accept="video/*,.mp4,.mov,.webm,.m4v" aria-label="영상 파일 선택" />
      </div>
      <div id="vwp-file-info" class="muted" aria-live="polite">선택한 영상이 없습니다.</div>
      <div id="vwp-preview-wrap" hidden style="margin-top:12px"><video id="vwp-preview" controls muted playsinline preload="metadata" style="display:block;width:100%;max-height:360px;border-radius:8px;background:#111"></video></div>
    </div>
    <div class="card">
      <h2>변환 설정</h2>
      <div class="form-grid">
        <p><label for="vwp-start">시작 시간 (초)</label><input id="vwp-start" type="number" min="0" max="3600" step="0.1" value="0" /></p>
        <p><label for="vwp-duration">변환 길이</label><select id="vwp-duration"><option value="2">2초</option><option value="3" selected>3초</option><option value="5">5초</option><option value="8">8초</option><option value="10">10초</option><option value="15">15초</option></select></p>
        <p><label for="vwp-fps">프레임 속도</label><select id="vwp-fps"><option value="8">8 FPS · 용량 작게</option><option value="12" selected>12 FPS · 추천</option><option value="15">15 FPS · 부드럽게</option><option value="20">20 FPS · 더 부드럽게</option></select></p>
        <p><label for="vwp-width">최대 너비</label><select id="vwp-width"><option value="320">320px</option><option value="480">480px</option><option value="640" selected>640px</option><option value="800">800px</option></select></p>
      </div>
      <p><label for="vwp-quality">품질: <strong id="vwp-quality-value">75</strong>/100</label><input id="vwp-quality" type="range" min="40" max="95" step="5" value="75" /></p>
      <p class="muted">긴 영상은 원하는 시작 시간을 지정해 최대 15초까지만 변환할 수 있습니다. 해상도와 FPS를 낮추면 파일 크기가 줄어듭니다.</p>
    </div>
    <div class="stickybar"><button id="vwp-run" type="button">WebP 만들기</button><button id="vwp-clear" type="button" class="secondary">초기화</button></div>
    <div id="vwp-status" class="muted" role="status" aria-live="polite">영상 파일을 선택해 주세요.</div>
    <div id="vwp-progress-wrap" hidden class="card"><div style="display:flex;justify-content:space-between;gap:12px"><span id="vwp-progress-label">변환 준비 중</span><strong id="vwp-progress-percent">0%</strong></div><progress id="vwp-progress" max="100" value="0" style="width:100%;margin-top:10px"></progress></div>
    <div id="vwp-result"></div>
    <section class="card" aria-label="사용법과 개인정보 안내">
      <h2>사용법</h2><ol><li>변환할 영상을 선택합니다.</li><li>시작 시간과 길이, FPS, 너비, 품질을 설정합니다.</li><li>WebP 만들기를 누르고 결과를 저장합니다.</li></ol>
      <h2>개인정보</h2><p>선택한 영상은 서버로 업로드하지 않고 브라우저 안에서 변환합니다. 처음 사용할 때 사이트에 포함된 변환 엔진 파일(약 31MB)을 내려받으므로 인터넷 연결이 필요합니다.</p>
      <h2>알아둘 점</h2><ul><li>소리는 애니메이션 WebP에 포함되지 않습니다.</li><li>첫 변환은 엔진을 불러오는 시간 때문에 오래 걸릴 수 있습니다.</li><li>긴 영상이나 높은 해상도는 메모리를 많이 사용할 수 있습니다.</li></ul>
    </section>
  `;

  const fileInput = mount.querySelector<HTMLInputElement>("#vwp-file")!;
  const drop = mount.querySelector<HTMLDivElement>("#vwp-drop")!;
  const fileInfo = mount.querySelector<HTMLDivElement>("#vwp-file-info")!;
  const previewWrap = mount.querySelector<HTMLDivElement>("#vwp-preview-wrap")!;
  const preview = mount.querySelector<HTMLVideoElement>("#vwp-preview")!;
  const startInput = mount.querySelector<HTMLInputElement>("#vwp-start")!;
  const durationSelect = mount.querySelector<HTMLSelectElement>("#vwp-duration")!;
  const fpsSelect = mount.querySelector<HTMLSelectElement>("#vwp-fps")!;
  const widthSelect = mount.querySelector<HTMLSelectElement>("#vwp-width")!;
  const qualityInput = mount.querySelector<HTMLInputElement>("#vwp-quality")!;
  const qualityValue = mount.querySelector<HTMLElement>("#vwp-quality-value")!;
  const runButton = mount.querySelector<HTMLButtonElement>("#vwp-run")!;
  const clearButton = mount.querySelector<HTMLButtonElement>("#vwp-clear")!;
  const status = mount.querySelector<HTMLDivElement>("#vwp-status")!;
  const progressWrap = mount.querySelector<HTMLDivElement>("#vwp-progress-wrap")!;
  const progressBar = mount.querySelector<HTMLProgressElement>("#vwp-progress")!;
  const progressPercent = mount.querySelector<HTMLElement>("#vwp-progress-percent")!;
  const progressLabel = mount.querySelector<HTMLElement>("#vwp-progress-label")!;
  const result = mount.querySelector<HTMLDivElement>("#vwp-result")!;
  let file: File | null = null;
  let inputURL: string | null = null;
  let outputURL: string | null = null;
  let sourceDuration = 0;
  let busy = false;

  const setStatus = (message: string) => { status.textContent = message; };
  const setFile = (selected: File | null) => {
    if (busy) return;
    if (inputURL) URL.revokeObjectURL(inputURL);
    if (outputURL) URL.revokeObjectURL(outputURL);
    inputURL = null;
    outputURL = null;
    result.innerHTML = "";
    file = selected;
    sourceDuration = 0;
    preview.removeAttribute("src");
    preview.load();
    previewWrap.hidden = true;
    if (!file) {
      fileInfo.textContent = "선택한 영상이 없습니다.";
      setStatus("영상 파일을 선택해 주세요.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      fileInfo.textContent = `${file.name} · ${formatBytes(file.size)}`;
      setStatus("파일 크기는 150MB 이하여야 합니다.");
      return;
    }
    inputURL = URL.createObjectURL(file);
    preview.src = inputURL;
    previewWrap.hidden = false;
    fileInfo.textContent = `${file.name} · ${formatBytes(file.size)} · 길이 확인 중…`;
    setStatus("영상이 선택되었습니다.");
    preview.onloadedmetadata = () => {
      sourceDuration = Number.isFinite(preview.duration) ? preview.duration : 0;
      fileInfo.textContent = `${file?.name ?? "영상"} · ${formatBytes(file?.size ?? 0)} · ${sourceDuration > 0 ? `${sourceDuration.toFixed(1)}초 · ${preview.videoWidth}×${preview.videoHeight}` : "길이를 확인할 수 없음"}`;
      const maxStart = Math.max(0, sourceDuration - 0.5);
      startInput.max = String(Math.floor(maxStart * 10) / 10);
      if (Number(startInput.value) > maxStart) startInput.value = "0";
      setStatus("영상 준비 완료. 변환 설정을 확인해 주세요.");
    };
    preview.onerror = () => {
      sourceDuration = 0;
      fileInfo.textContent = `${file?.name ?? "영상"} · ${formatBytes(file?.size ?? 0)} · 브라우저 미리보기 지원 여부를 확인할 수 없음`;
      setStatus("브라우저 미리보기는 실패했지만, 변환 엔진이 읽을 수 있는 형식이면 변환을 시도할 수 있습니다.");
    };
  };

  drop.addEventListener("click", (event) => { if (event.target !== fileInput) fileInput.click(); });
  drop.addEventListener("dragover", (event) => { event.preventDefault(); drop.classList.add("hover"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("hover"));
  drop.addEventListener("drop", (event) => { event.preventDefault(); drop.classList.remove("hover"); setFile(event.dataTransfer?.files?.[0] ?? null); });
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", () => setFile(fileInput.files?.[0] ?? null));
  qualityInput.addEventListener("input", () => { qualityValue.textContent = qualityInput.value; });

  clearButton.addEventListener("click", () => {
    if (busy) return;
    setFile(null);
    fileInput.value = "";
    startInput.value = "0";
    durationSelect.value = "3";
    fpsSelect.value = "12";
    widthSelect.value = "640";
    qualityInput.value = "75";
    qualityValue.textContent = "75";
    result.innerHTML = "";
    progressWrap.hidden = true;
    if (outputURL) URL.revokeObjectURL(outputURL);
    outputURL = null;
  });

  runButton.addEventListener("click", async () => {
    const options: VideoToWebPOptions = {
      startSeconds: Number(startInput.value),
      durationSeconds: Number(durationSelect.value),
      fps: Number(fpsSelect.value) as VideoToWebPOptions["fps"],
      width: Number(widthSelect.value) as VideoToWebPOptions["width"],
      quality: Number(qualityInput.value),
    };
    const validation = validateVideoToWebP(file, options);
    if (validation) { setStatus(`${validation.what} ${validation.how}`); return; }
    if (sourceDuration > 0 && options.startSeconds >= sourceDuration) { setStatus("시작 시간이 영상 길이보다 깁니다."); return; }
    if (sourceDuration > 0 && options.startSeconds + options.durationSeconds > sourceDuration + 0.1) {
      options.durationSeconds = Math.max(0.5, sourceDuration - options.startSeconds);
    }
    busy = true;
    runButton.disabled = true;
    clearButton.disabled = true;
    fileInput.disabled = true;
    result.innerHTML = "";
    progressWrap.hidden = false;
    progressBar.value = 0;
    progressPercent.textContent = "0%";
    progressLabel.textContent = "변환 준비 중";
    setStatus("변환을 준비하고 있습니다.");
    try {
      const converted = await convertVideoToAnimatedWebP(file!, options, (value) => {
        const percent = Math.round(value * 100);
        progressBar.value = percent;
        progressPercent.textContent = `${percent}%`;
        progressLabel.textContent = "WebP 변환 중";
      }, (message) => {
        setStatus(message);
        progressLabel.textContent = message;
      });
      renderResult(converted, options);
      setStatus("변환이 끝났습니다. 미리보기를 확인하고 저장해 주세요.");
      track("processing_completed", { tool: "video-to-webp" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "변환에 실패했습니다. 다시 시도해 주세요.";
      setStatus(message);
      const notice = document.createElement("div");
      notice.className = "error";
      notice.textContent = message;
      result.appendChild(notice);
    } finally {
      busy = false;
      runButton.disabled = false;
      clearButton.disabled = false;
      fileInput.disabled = false;
    }
  });

  function renderResult(converted: VideoToWebPResult, options: VideoToWebPOptions): void {
    if (outputURL) URL.revokeObjectURL(outputURL);
    outputURL = URL.createObjectURL(converted.blob);
    const card = document.createElement("div");
    card.className = "result";
    const heading = document.createElement("h2");
    heading.textContent = "변환 결과";
    card.appendChild(heading);
    const image = document.createElement("img");
    image.src = outputURL;
    image.alt = "움직이는 WebP 미리보기";
    image.style.display = "block";
    image.style.maxWidth = "100%";
    image.style.maxHeight = "420px";
    image.style.margin = "0 auto";
    image.style.borderRadius = "8px";
    image.style.background = "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 16px 16px";
    card.appendChild(image);
    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `${converted.width}×${converted.height} · ${options.durationSeconds.toFixed(1)}초 · ${options.fps} FPS · 품질 ${options.quality} · ${formatBytes(converted.blob.size)}`;
    card.appendChild(info);
    const before = document.createElement("p");
    before.className = "muted";
    before.textContent = file ? `원본 ${formatBytes(file.size)} → WebP ${formatBytes(converted.blob.size)}` : "WebP 변환 완료";
    card.appendChild(before);
    const download = document.createElement("button");
    download.type = "button";
    download.textContent = "WebP 저장";
    download.addEventListener("click", () => {
      track("download", { tool: "video-to-webp" });
      downloadBlob("toolbox-animated.webp", converted.blob);
    });
    card.appendChild(download);
    result.appendChild(card);
  }

  const cleanupObserver = new MutationObserver(() => {
    if (!mount.isConnected) {
      if (inputURL) URL.revokeObjectURL(inputURL);
      if (outputURL) URL.revokeObjectURL(outputURL);
      cleanupObserver.disconnect();
    }
  });
  if (mount.parentNode) cleanupObserver.observe(mount.parentNode, { childList: true });
}
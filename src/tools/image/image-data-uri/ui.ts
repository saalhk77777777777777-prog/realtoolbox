/** TOOLBOX v0.14.0 — image-data-uri UI */
export function render(mount: HTMLElement): void {
  mount.innerHTML = `<div class="card"><h2>Image Data URI Converter</h2><p>브라우저 내부에서 처리됩니다.</p><input type="file" accept="image/*" aria-label="이미지 파일 선택"></div>`;
}

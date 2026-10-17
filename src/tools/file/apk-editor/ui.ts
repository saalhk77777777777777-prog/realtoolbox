/** TOOLBOX v0.14.79 — APK / archive visual inspector */
import JSZip from "jszip";
import { analyzeDex, editTextManifest, inspectApk, rebuildApk, validate, type ApkInspection } from "./processor.ts";
const esc = (v: string): string => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fmt = (n: number): string => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KiB" : (n / 1048576).toFixed(2) + " MiB";
export function render(mount: HTMLElement): void {
  mount.innerHTML = '<section class="card"><h2>APK / Unity 리소스 탐색기 <small>v0.14.79</small></h2><p class="muted">파일은 브라우저 안에서 처리돼. APK 분석, 앱 아이콘 미리보기, 이미지 교체, ZIP 기반 Unity/OBB 패키지 탐색을 지원해.</p><label for="apk-file">Android APK (최대 200 MiB)</label><input id="apk-file" type="file" accept=".apk,application/vnd.android.package-archive"><div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem"><button id="inspect">APK 열기 / 분석</button><button id="reset" class="secondary">초기화</button></div></section><section class="card"><h3>Unity / ZIP / OBB 패키지 탐색</h3><p class="muted">ZIP 기반 아카이브를 열어 파일 목록을 보고 이미지 미리보기·교체 후 ZIP으로 내보내. Unity의 일부 .assets/.bundle/.unity3d는 UnityFS 등 별도 포맷이라 일반 ZIP처럼 풀 수 없어.</p><label for="archive-file">ZIP / OBB / AAB / ZIP 기반 Unity 패키지</label><input id="archive-file" type="file" accept=".zip,.obb,.aab,.unity3d,.bundle,.assets"><button id="open-archive" class="secondary">아카이브 열기</button><div id="archive-status" class="muted" role="status" aria-live="polite"></div><div id="archive-output"></div></section><div id="apk-status" class="muted" role="status" aria-live="polite">APK를 선택해 줘.</div><div id="apk-output"></div>';
  const fi = mount.querySelector<HTMLInputElement>("#apk-file")!, archiveFi = mount.querySelector<HTMLInputElement>("#archive-file")!, archiveStatus = mount.querySelector<HTMLElement>("#archive-status")!, archiveOut = mount.querySelector<HTMLElement>("#archive-output")!, status = mount.querySelector<HTMLElement>("#apk-status")!, out = mount.querySelector<HTMLElement>("#apk-output")!;
  let original: File | null = null, inspection: ApkInspection | null = null;
  const replacements = new Map<string, File>();
  const setStatus = (s: string): void => { status.textContent = s; };
  mount.querySelector("#reset")!.addEventListener("click", () => { original = null; inspection = null; replacements.clear(); fi.value = ""; out.innerHTML = ""; setStatus("초기화했어."); });
  mount.querySelector("#inspect")!.addEventListener("click", async () => {
    const file = fi.files?.[0], error = validate({ file });
    if (error) { setStatus(error.what + " " + error.how); out.innerHTML = ""; return; }
    original = file!; inspection = null; replacements.clear(); out.innerHTML = ""; setStatus("APK 구조 분석 중…");
    try { inspection = await inspectApk(original); draw(); setStatus("분석 완료 · " + inspection.entryCount + "개 파일 · 서버 업로드 없음"); }
    catch (e) { setStatus("분석 실패: " + (e instanceof Error ? e.message : String(e))); }
  });
  const openArchive = mount.querySelector<HTMLButtonElement>("#open-archive")!;
  openArchive.addEventListener("click", async () => {
    const file = archiveFi.files?.[0];
    archiveOut.innerHTML = "";
    if (!file) { archiveStatus.textContent = "아카이브 파일을 선택해 줘."; return; }
    if (file.size > 200 * 1024 * 1024) { archiveStatus.textContent = "브라우저 안전 한도는 200 MiB야."; return; }
    archiveStatus.textContent = "아카이브 구조 확인 중…";
    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer(), { checkCRC32: false, createFolders: false });
      const entries = Object.entries(zip.files).filter(([, e]) => !e.dir).map(([name, entry]) => {
        const d = (entry as unknown as { _data?: { uncompressedSize?: number } })._data;
        return { name, size: d?.uncompressedSize ?? 0 };
      }).sort((a,b) => a.name.localeCompare(b.name));
      let expanded = entries.reduce((sum, e) => sum + e.size, 0);
      if (entries.some(e => e.size > 128 * 1024 * 1024) || expanded > 512 * 1024 * 1024) throw new Error("압축 해제 예상 크기가 안전 한도를 초과했어.");
      const images = entries.filter(e => /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(e.name));
      const icon = images.find(e => /(^|\/)(icon|app_icon|launcher|logo)([-_.@/]|$)/i.test(e.name)) ?? images[0];
      archiveOut.innerHTML = '<div class="card"><strong>' + esc(file.name) + '</strong><p>' + entries.length + '개 파일 · 압축 해제 예상 ' + fmt(expanded) + ' · 이미지 ' + images.length + '개</p><label for="archive-entry">파일 경로</label><select id="archive-entry"><option value="">파일 선택…</option>' + entries.map(e => '<option value="' + esc(e.name) + '">' + esc(e.name) + ' · ' + fmt(e.size) + '</option>').join("") + '</select><div id="archive-preview" style="margin:.75rem 0"></div><label for="archive-replacement">선택한 파일 교체</label><input id="archive-replacement" type="file"><button id="archive-replace" class="secondary">교체 목록에 추가</button><div id="archive-replacements"></div><button id="archive-export" disabled>수정된 ZIP 내보내기</button><input id="archive-search" type="search" placeholder="파일 경로 검색"><div id="archive-files" style="max-height:24rem;overflow:auto"></div></div>';
      const selected = archiveOut.querySelector<HTMLSelectElement>("#archive-entry")!, preview = archiveOut.querySelector<HTMLElement>("#archive-preview")!, files = archiveOut.querySelector<HTMLElement>("#archive-files")!, search = archiveOut.querySelector<HTMLInputElement>("#archive-search")!;
      const replacements = new Map<string, File>();
      const showPreview = async () => {
        preview.innerHTML = "";
        const name = selected.value; if (!name) return;
        const entry = zip.file(name); if (!entry) return;
        if (/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name)) {
          const blob = await entry.async("blob"), url = URL.createObjectURL(blob);
          const img = document.createElement("img"); img.src = url; img.alt = name; img.style.maxWidth = "100%"; img.style.maxHeight = "300px"; img.style.objectFit = "contain"; img.style.display = "block"; img.style.margin = "auto"; preview.append(img);
        } else if (/\.(txt|xml|json|ya?ml|ini|cfg|csv|md|html|css|js|ts)$/i.test(name) && (entries.find(e => e.name === name)?.size ?? 0) < 1024*1024) {
          const pre = document.createElement("pre"); pre.style.cssText = "white-space:pre-wrap;max-height:16rem;overflow:auto"; pre.textContent = (await entry.async("text")).slice(0,20000); preview.append(pre);
        } else preview.textContent = "이 파일 형식은 미리보기 대신 경로·크기만 표시해.";
      };
      const drawFiles = () => { const q=search.value.toLowerCase(), visible=entries.filter(e=>e.name.toLowerCase().includes(q)).slice(0,1500); files.innerHTML='<table><thead><tr><th>경로</th><th>크기</th></tr></thead><tbody>'+visible.map(e=>'<tr><td><button type="button" class="secondary" data-entry="'+esc(e.name)+'">'+esc(e.name)+'</button></td><td>'+fmt(e.size)+'</td></tr>').join("")+'</tbody></table>'+(entries.length>visible.length?'<p class="muted">최대 1,500개 표시 중. 검색어로 좁혀 봐.</p>':""); files.querySelectorAll<HTMLButtonElement>("[data-entry]").forEach(b=>b.addEventListener("click",()=>{selected.value=b.dataset.entry!;void showPreview();})); };
      selected.addEventListener("change",()=>void showPreview()); search.addEventListener("input",drawFiles); drawFiles();
      if (icon) { selected.value = icon.name; await showPreview(); }
      archiveOut.querySelector("#archive-replace")!.addEventListener("click",()=>{
        const name=selected.value, replacement=archiveOut.querySelector<HTMLInputElement>("#archive-replacement")!.files?.[0];
        if(!name||!replacement){archiveStatus.textContent="교체할 내부 파일과 새 파일을 선택해 줘.";return;}
        if(replacement.size>128*1024*1024){archiveStatus.textContent="교체 파일은 128 MiB 이하여야 해.";return;}
        replacements.set(name,replacement);
        archiveOut.querySelector<HTMLElement>("#archive-replacements")!.textContent=[...replacements.keys()].join(" · ");
        archiveOut.querySelector<HTMLButtonElement>("#archive-export")!.disabled=false;
        archiveStatus.textContent=replacements.size+"개 파일 교체 준비됨.";
      });
      archiveOut.querySelector("#archive-export")!.addEventListener("click",async()=>{
        const btn=archiveOut.querySelector<HTMLButtonElement>("#archive-export")!;btn.disabled=true;archiveStatus.textContent="ZIP 재패키징 중…";
        try{for(const [name,replacement] of replacements)zip.file(name,new Uint8Array(await replacement.arrayBuffer()),{binary:true,date:new Date()});const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name.replace(/\.(obb|aab|unity3d|bundle|assets)$/i,"")+( /\.zip$/i.test(file.name)?"-modified.zip":"-modified.zip");a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);archiveStatus.textContent="수정된 ZIP을 내보냈어. 원본 Unity 포맷과의 호환성은 별도 검증이 필요해.";}catch(e){archiveStatus.textContent="내보내기 실패: "+(e instanceof Error?e.message:String(e));}finally{btn.disabled=false;}
      });
      archiveStatus.textContent="아카이브 열기 완료 · "+entries.length+"개 파일 · 브라우저 로컬 처리";
    } catch (e) { archiveStatus.textContent = "열 수 없어: ZIP 구조가 아니거나 지원하지 않는 압축 포맷이야. " + (e instanceof Error ? e.message : String(e)); }
  });
  function draw(): void {
    if (!inspection) return;
    const info: [string,string][] = [["파일명",inspection.fileName],["크기",fmt(inspection.byteLength)],["내부 파일 수",String(inspection.entryCount)],["패키지명",inspection.packageName || "확인 불가"],["버전 이름",inspection.versionName || "확인 불가"],["버전 코드",inspection.versionCode || "확인 불가"],["Manifest 형식",inspection.manifestKind],["DEX 파일",inspection.dexFiles.join(", ") || "없음"],["기존 서명 파일",String(inspection.signatureFiles.length)]];
    out.innerHTML = '<section class="card"><h3>APK 개요</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.5rem">' + info.map(x => '<div class="card"><div class="muted">' + esc(x[0]) + '</div><strong>' + esc(x[1]) + '</strong></div>').join("") + '</div>' +
      (inspection.warnings.length ? '<div class="error" style="margin-top:.75rem"><strong>주의 사항</strong><ul>' + inspection.warnings.map(w => '<li>' + esc(w) + '</li>').join("") + '</ul></div>' : '') +
      '<p class="muted">바이너리 텍스트 XML Manifest는 기본 속성을 편집할 수 있어. 바이너리 AXML 컴파일은 지원하지 않아.</p></section>' +
      '<section class="card"><h3>휴대폰 미리보기</h3><p class="muted">APK의 앱 아이콘을 찾아 휴대폰 홈 화면 형태로 보여줘. Android 실제 실행 화면을 에뮬레이션하는 것은 아니야.</p><div style="display:flex;justify-content:center;padding:1rem"><div style="width:260px;max-width:100%;padding:12px;border:7px solid #222;border-radius:34px;background:#111;box-shadow:0 8px 24px #0003"><div style="height:20px;width:78px;border-radius:12px;background:#050505;margin:0 auto 12px"></div><div style="height:430px;border-radius:22px;padding:18px 14px;background:linear-gradient(160deg,#c9e7ff,#e8e4ff 52%,#f8e8ee);color:#1b2434;display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700"><span>9:41</span><span>▮▮▮ ▰</span></div><div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:14px 8px;align-content:center" id="phone-home"><div style="text-align:center"><div id="phone-icon" style="width:54px;height:54px;border-radius:15px;background:#fff9;display:grid;place-items:center;margin:auto;font-size:25px;overflow:hidden">📱</div><small id="phone-app-name" style="display:block;overflow-wrap:anywhere;margin-top:5px">앱 미리보기</small></div><div style="text-align:center"><div style="width:54px;height:54px;border-radius:15px;background:#ffffffa8;margin:auto;display:grid;place-items:center">🌐</div><small style="display:block;margin-top:5px">브라우저</small></div><div style="text-align:center"><div style="width:54px;height:54px;border-radius:15px;background:#ffffffa8;margin:auto;display:grid;place-items:center">⚙️</div><small style="display:block;margin-top:5px">설정</small></div></div><div style="display:flex;justify-content:space-around;padding:10px 5px;background:#ffffff7d;border-radius:18px"><span>☎️</span><span>💬</span><span>🌍</span><span>📷</span></div><div style="width:90px;height:4px;border-radius:4px;background:#222;margin:14px auto 0"></div></div></div></div><p class="muted">아이콘은 ZIP 내부 이미지 파일 중 이름을 바탕으로 추정해. 실제 앱 UI는 실행 화면 캡처나 별도 에뮬레이터가 있어야 정확히 볼 수 있어.</p><div id="apk-image-list"></div></section>' +
      '<section class="card"><h3>리소스 파일 교체</h3><p class="muted">APK 내부 파일을 골라 교체해. 원본 파일은 바뀌지 않아.</p><label for="apk-path">APK 내부 경로</label><select id="apk-path"><option value="">파일 선택…</option>' + inspection.entries.map(e => '<option value="' + esc(e.name) + '">' + esc(e.name) + ' · ' + fmt(e.size) + '</option>').join("") + '</select><label for="replacement-file">교체 파일</label><input id="replacement-file" type="file"><button id="add-replacement" class="secondary">교체 목록에 추가</button><div id="replacement-list" class="muted" style="margin-top:.5rem"></div><button id="export-apk" style="margin-top:.75rem" disabled>수정본 APK ZIP 내보내기</button><p class="muted">내보내기는 서명되지 않은 재패키징 결과야. 브라우저에서 APK v2/v3 서명이나 ZIP 정렬을 하지 않으므로 설치용 APK로 보장하지 않아.</p></section>' +
      '<section class="card"><h3>AndroidManifest.xml 편집</h3><p id="manifest-note" class="muted"></p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.5rem"><label>패키지명<input id="manifest-package" type="text" autocomplete="off" placeholder="com.example.app"></label><label>버전 이름<input id="manifest-version-name" type="text" autocomplete="off" placeholder="1.0.1"></label><label>버전 코드<input id="manifest-version-code" type="number" min="0" step="1" placeholder="2"></label></div><button id="apply-manifest" class="secondary" style="margin-top:.5rem">Manifest 변경 적용</button><p class="muted">텍스트 XML Manifest만 편집 가능해. 일반 APK의 바이너리 AXML은 읽기 전용이며, 이 기능이 적용돼도 Android 빌드 도구의 재컴파일·검증을 대신하지 않아.</p><details><summary>현재 Manifest 미리보기</summary><pre id="manifest-preview" style="white-space:pre-wrap;overflow:auto;max-height:18rem"></pre></details></section>' +
      '<section class="card"><h3>DEX 코드 구조 살펴보기</h3><p class="muted">DEX 헤더와 문자열을 분석해. Java/Kotlin 소스 코드로 디컴파일하지는 않아.</p><label for="dex-path">DEX 파일</label><select id="dex-path"><option value="">DEX 파일 선택…</option>' + inspection.dexFiles.map(p => '<option value="' + esc(p) + '">' + esc(p) + '</option>').join("") + '</select><button id="analyze-dex" class="secondary">DEX 분석</button><div id="dex-result"></div></section>' +
      '<section class="card"><h3>APK 내부 파일 (' + inspection.entryCount + ')</h3><input id="entry-filter" type="search" placeholder="경로 검색…"><div id="entry-list" style="max-height:28rem;overflow:auto"></div></section>';
    const phoneName = out.querySelector<HTMLElement>("#phone-app-name")!;
    phoneName.textContent = inspection.packageName?.split(".").pop() || inspection.fileName.replace(/\.apk$/i,"");
    const imageEntries = inspection.entries.filter(e => /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(e.name));
    const iconEntry = imageEntries.find(e => /(^|\/)(ic_launcher|launcher_icon|app_icon|icon)([-_.@/]|$)/i.test(e.name)) || imageEntries.find(e => /mipmap.*launcher/i.test(e.name)) || imageEntries[0];
    const iconMount = out.querySelector<HTMLElement>("#phone-icon")!;
    const imageList = out.querySelector<HTMLElement>("#apk-image-list")!;
    if (iconEntry) {
      void (async()=>{const z=await JSZip.loadAsync(await original!.arrayBuffer()),e=z.file(iconEntry.name);if(!e)return;const url=URL.createObjectURL(await e.async("blob"));const img=document.createElement("img");img.src=url;img.alt="추정 앱 아이콘";img.style.cssText="width:100%;height:100%;object-fit:cover;border-radius:15px";iconMount.innerHTML="";iconMount.append(img);})();
    }
    imageList.innerHTML = imageEntries.length ? '<label for="apk-image-select">이미지 리소스 미리보기 ('+imageEntries.length+')</label><select id="apk-image-select"><option value="">이미지 선택…</option>'+imageEntries.map(e=>'<option value="'+esc(e.name)+'">'+esc(e.name)+' · '+fmt(e.size)+'</option>').join("")+'</select><div id="apk-image-preview" style="margin-top:.5rem;text-align:center"></div>' : '<p class="muted">일반 이미지 파일을 찾지 못했어. VectorDrawable XML 등은 별도 렌더러가 필요해.</p>';
    const imageSelect = out.querySelector<HTMLSelectElement>("#apk-image-select");
    imageSelect?.addEventListener("change", async()=>{const holder=out.querySelector<HTMLElement>("#apk-image-preview")!;holder.innerHTML="";if(!imageSelect.value)return;const z=await JSZip.loadAsync(await original!.arrayBuffer()),e=z.file(imageSelect.value);if(!e)return;const url=URL.createObjectURL(await e.async("blob"));const img=document.createElement("img");img.src=url;img.alt=imageSelect.value;img.style.cssText="max-width:100%;max-height:320px;object-fit:contain";holder.append(img);});
    const note = out.querySelector<HTMLElement>("#manifest-note")!, preview = out.querySelector<HTMLElement>("#manifest-preview")!;
    const manifestEditable = inspection.manifestKind === "text-xml";
    note.textContent = inspection.manifestKind === "missing" ? "Manifest 파일이 없어." : manifestEditable ? "텍스트 XML이므로 package / versionName / versionCode 편집을 지원해." : "바이너리 AXML 형식이야. 속성 편집은 지원하지 않아.";
    const manifestFields = ["#manifest-package", "#manifest-version-name", "#manifest-version-code"];
    manifestFields.forEach(selector => { const el = out.querySelector<HTMLInputElement>(selector)!; el.disabled = !manifestEditable; });
    out.querySelector<HTMLButtonElement>("#apply-manifest")!.disabled = !manifestEditable;
    void (async () => {
      const zip = await JSZip.loadAsync(await original!.arrayBuffer()), entry = zip.file("AndroidManifest.xml"); if (!entry) return;
      const bytes = await entry.async("uint8array"), xml = new TextDecoder().decode(bytes);
      preview.textContent = manifestEditable ? xml : [...new TextDecoder("latin1").decode(bytes)].filter(c => c >= " " && c <= "~").join("").slice(0, 4000);
      if (manifestEditable) {
        const pkg = xml.match(/\bpackage\s*=\s*["']([^"']+)/i)?.[1] ?? "";
        const vn = xml.match(/\bandroid:versionName\s*=\s*["']([^"']*)/i)?.[1] ?? "";
        const vc = xml.match(/\bandroid:versionCode\s*=\s*["']([^"']*)/i)?.[1] ?? "";
        out.querySelector<HTMLInputElement>("#manifest-package")!.value = pkg;
        out.querySelector<HTMLInputElement>("#manifest-version-name")!.value = vn;
        out.querySelector<HTMLInputElement>("#manifest-version-code")!.value = vc;
      }
    })();
    out.querySelector<HTMLButtonElement>("#apply-manifest")!.addEventListener("click", async () => {
      if (!original || !manifestEditable) return;
      try {
        const zip = await JSZip.loadAsync(await original.arrayBuffer()), entry = zip.file("AndroidManifest.xml");
        if (!entry) throw new Error("Manifest 파일이 없어.");
        const xml = new TextDecoder().decode(await entry.async("uint8array"));
        const packageName = out.querySelector<HTMLInputElement>("#manifest-package")!.value;
        const versionName = out.querySelector<HTMLInputElement>("#manifest-version-name")!.value;
        const versionCode = out.querySelector<HTMLInputElement>("#manifest-version-code")!.value;
        const updated = editTextManifest(xml, { packageName, versionName, versionCode });
        replacements.set("AndroidManifest.xml", new File([updated], "AndroidManifest.xml", { type: "application/xml" }));
        preview.textContent = updated;
        out.querySelector<HTMLButtonElement>("#export-apk")!.disabled = false;
        setStatus("텍스트 Manifest 변경을 교체 목록에 적용했어. 내보내기 전 APK 호환성을 꼭 검증해 줘.");
      } catch (e) { setStatus("Manifest 편집 실패: " + (e instanceof Error ? e.message : String(e))); }
    });
    const filter = out.querySelector<HTMLInputElement>("#entry-filter")!, list = out.querySelector<HTMLElement>("#entry-list")!;
    const drawEntries = (): void => { const q = filter.value.toLowerCase(), rows = inspection!.entries.filter(e => e.name.toLowerCase().includes(q)).slice(0, 2000); list.innerHTML = '<table><thead><tr><th>경로</th><th>크기</th><th>유형</th></tr></thead><tbody>' + rows.map(e => '<tr><td><code>' + esc(e.name) + '</code></td><td>' + fmt(e.size) + '</td><td>' + esc(e.extension || "파일") + '</td></tr>').join("") + '</tbody></table>' + (inspection!.entries.length > rows.length ? '<p class="muted">표시는 최대 2,000개야. 검색어로 좁혀 봐.</p>' : ''); };
    filter.addEventListener("input", drawEntries); drawEntries();
    out.querySelector("#add-replacement")!.addEventListener("click", () => {
      const path = out.querySelector<HTMLSelectElement>("#apk-path")!.value, file = out.querySelector<HTMLInputElement>("#replacement-file")!.files?.[0];
      if (!path || !file) { setStatus("내부 경로와 교체 파일을 모두 골라 줘."); return; }
      if (path === "AndroidManifest.xml" || /^classes(?:\d+)?\.dex$/i.test(path) || /\.(RSA|DSA|EC|SF)$/i.test(path)) { setStatus("Manifest·DEX·서명 파일은 단순 교체를 지원하지 않아."); return; }
      replacements.set(path, file);
      const repl = out.querySelector<HTMLElement>("#replacement-list")!;
      repl.innerHTML = [...replacements.entries()].map(([p,f]) => '<div>' + esc(p) + ' ← ' + esc(f.name) + ' (' + fmt(f.size) + ') <button data-remove="' + esc(p) + '" class="secondary">제거</button></div>').join("");
      repl.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach(b => b.addEventListener("click", () => { replacements.delete(b.dataset.remove!); draw(); }));
      out.querySelector<HTMLButtonElement>("#export-apk")!.disabled = replacements.size === 0; setStatus(replacements.size + "개 리소스 교체 준비됨.");
    });
    out.querySelector("#export-apk")!.addEventListener("click", async () => {
      if (!original || !replacements.size) return;
      const b = out.querySelector<HTMLButtonElement>("#export-apk")!; b.disabled = true; setStatus("수정본 패키징 중…");
      try { const blob = await rebuildApk(original, replacements), url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = original.name.replace(/\.apk$/i, "") + "-modified-unsigned.apk"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); setStatus("내보내기 완료. 서명되지 않았으며 설치 가능성은 보장되지 않아."); }
      catch (e) { setStatus("내보내기 실패: " + (e instanceof Error ? e.message : String(e))); }
      finally { b.disabled = false; }
    });
    out.querySelector("#analyze-dex")!.addEventListener("click", async () => {
      const path = out.querySelector<HTMLSelectElement>("#dex-path")!.value, result = out.querySelector<HTMLElement>("#dex-result")!;
      if (!path || !original) { result.textContent = "DEX 파일을 선택해 줘."; return; }
      result.textContent = "DEX 분석 중…";
      try { const zip = await JSZip.loadAsync(original!), entry = zip.file(path); if (!entry) throw new Error("DEX 파일을 찾을 수 없어."); const dex = await analyzeDex(path, await entry.async("uint8array")); result.innerHTML = '<p>버전: <strong>' + esc(dex.version) + '</strong> · 헤더 크기: ' + fmt(dex.fileSizeHeader) + ' · 추출 문자열: ' + dex.stringCount + '</p><p>클래스 디스크립터</p><pre style="white-space:pre-wrap;max-height:12rem;overflow:auto">' + esc(dex.classDescriptors.join("\n") || "발견된 클래스 디스크립터가 없어.") + '</pre><details><summary>문자열 보기 (최대 5,000개)</summary><pre style="white-space:pre-wrap;max-height:20rem;overflow:auto">' + esc(dex.strings.join("\n")) + '</pre></details>'; }
      catch (e) { result.textContent = "분석 실패: " + (e instanceof Error ? e.message : String(e)); }
    });
  }
}
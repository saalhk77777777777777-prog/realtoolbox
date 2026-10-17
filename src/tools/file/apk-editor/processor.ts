/** TOOLBOX v0.14.78 — guarded browser-local APK processing */
import JSZip from "jszip";
import type { ToolError } from "../../../core/types.ts";
export const MAX_APK_BYTES = 200 * 1024 * 1024;
export const MAX_EXPANDED_BYTES = 512 * 1024 * 1024;
export const MAX_ENTRY_BYTES = 128 * 1024 * 1024;
export interface Input { file: File }
export interface ApkEntry { name: string; size: number; compressedSize: number; extension: string }
export interface ApkInspection {
  fileName: string; byteLength: number; entryCount: number; entries: ApkEntry[];
  packageName: string | null; versionName: string | null; versionCode: string | null;
  manifestKind: "text-xml" | "binary-xml" | "missing"; dexFiles: string[];
  signatureFiles: string[]; warnings: string[];
}
export interface DexAnalysis { fileName: string; byteLength: number; version: string; checksum: string; fileSizeHeader: number; stringCount: number; classDescriptors: string[]; strings: string[] }
export function validate(input: unknown): ToolError | null {
  const v = input as Partial<Input> | null;
  if (!v?.file) return { code: "USER_INPUT", what: "APK 파일을 선택해 줘.", why: "분석할 파일이 없어.", how: "기기에서 직접 만든 APK 또는 테스트용 APK를 선택해 줘." };
  if (!(v.file instanceof File)) return { code: "FILE_INVALID", what: "파일 입력이 올바르지 않아.", why: "브라우저 File 객체가 아니야.", how: "파일 선택 버튼으로 다시 선택해 줘." };
  if (!/\.apk$/i.test(v.file.name)) return { code: "FILE_INVALID", what: "APK 파일이 아니야.", why: "확장자가 .apk가 아니야.", how: ".apk 파일을 선택해 줘." };
  if (v.file.size > MAX_APK_BYTES) return { code: "BROWSER_LIMIT", what: "파일이 너무 커.", why: "브라우저 안전 한도는 200 MiB야.", how: "더 작은 APK를 사용해 줘." };
  return null;
}
function decodeXmlText(bytes: Uint8Array): string | null {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/^\uFEFF/, "").trimStart();
  return text.startsWith("<?xml") || text.startsWith("<manifest") ? text : null;
}
function extractStringPool(bytes: Uint8Array): string[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 28 || view.getUint16(0, true) !== 0x0003) return [];
  let pos = view.getUint16(2, true);
  while (pos + 8 <= bytes.length) {
    const type = view.getUint16(pos, true), headerSize = view.getUint16(pos + 2, true), chunkSize = view.getUint32(pos + 4, true);
    if (chunkSize < 8 || pos + chunkSize > bytes.length) break;
    if (type === 0x0001 && headerSize >= 28 && chunkSize >= headerSize) {
      const count = view.getUint32(pos + 8, true), flags = view.getUint32(pos + 16, true), stringsStart = view.getUint32(pos + 20, true);
      if (count > 20000 || pos + stringsStart >= bytes.length) return [];
      const utf8 = (flags & 0x100) !== 0, out: string[] = [];
      const len8 = (at: number): [number, number] => bytes[at] & 0x80 ? [((bytes[at] & 0x7f) << 8) | bytes[at + 1], 2] : [bytes[at], 1];
      const len16 = (at: number): [number, number] => { const a = view.getUint16(at, true); return a & 0x8000 ? [((a & 0x7fff) << 16) | view.getUint16(at + 2, true), 4] : [a, 2]; };
      for (let i = 0; i < count; i++) {
        const offsetAt = pos + headerSize + i * 4; if (offsetAt + 4 > bytes.length) break;
        let at = pos + stringsStart + view.getUint32(offsetAt, true); if (at < 0 || at >= bytes.length) continue;
        try {
          if (utf8) { const [, n1] = len8(at); at += n1; const [n, n2] = len8(at); at += n2; if (n <= bytes.length - at) out.push(new TextDecoder().decode(bytes.subarray(at, at + n))); }
          else { const [n, step] = len16(at); at += step; if (n < 100000 && at + n * 2 <= bytes.length) out.push(new TextDecoder("utf-16le").decode(bytes.subarray(at, at + n * 2))); }
        } catch { /* malformed entry: skip */ }
      }
      return out;
    }
    pos += chunkSize;
  }
  return [];
}
export async function inspectApk(file: File): Promise<ApkInspection> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer(), { checkCRC32: false, createFolders: false });
  const entries: ApkEntry[] = [];
  let expandedTotal = 0;
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const internal = (entry as unknown as { _data?: { compressedSize?: number; uncompressedSize?: number } })._data;
    const size = internal?.uncompressedSize ?? 0, compressedSize = internal?.compressedSize ?? 0;
    if (size > MAX_ENTRY_BYTES) throw new Error("내부 파일이 128 MiB를 초과해 안전을 위해 중단했어: " + name);
    expandedTotal += size;
    if (expandedTotal > MAX_EXPANDED_BYTES) throw new Error("압축 해제 예상 크기가 512 MiB를 초과해 안전을 위해 중단했어.");
    const leaf = name.slice(name.lastIndexOf("/") + 1);
    entries.push({ name, size, compressedSize, extension: leaf.includes(".") ? leaf.slice(leaf.lastIndexOf(".")).toLowerCase() : "" });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const warnings: string[] = [], manifest = zip.file("AndroidManifest.xml");
  let manifestKind: ApkInspection["manifestKind"] = "missing", manifestText: string | null = null, strings: string[] = [];
  if (manifest) { const bytes = await manifest.async("uint8array"); manifestText = decodeXmlText(bytes); if (manifestText) manifestKind = "text-xml"; else { manifestKind = "binary-xml"; strings = extractStringPool(bytes); } }
  let packageName: string | null = null, versionName: string | null = null, versionCode: string | null = null;
  if (manifestText) {
    packageName = manifestText.match(/\bpackage\s*=\s*["']([^"']+)/i)?.[1] ?? null;
    versionName = manifestText.match(/\bandroid:versionName\s*=\s*["']([^"']+)/i)?.[1] ?? null;
    versionCode = manifestText.match(/\bandroid:versionCode\s*=\s*["']([^"']+)/i)?.[1] ?? null;
  } else if (strings.length) { packageName = strings.find(s => /^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*){2,}$/.test(s)) ?? null; versionName = strings.find(s => /^\d+(\.\d+){1,4}$/.test(s)) ?? null; warnings.push("바이너리 Manifest에서 문자열만 추출했어. 패키지명·버전은 추정값일 수 있어."); }
  const dexFiles = entries.filter(e => /^classes(?:\d+)?\.dex$/i.test(e.name)).map(e => e.name);
  const signatureFiles = entries.filter(e => /^META-INF\/.*\.(RSA|DSA|EC|SF)$/i.test(e.name) || /^META-INF\/MANIFEST\.MF$/i.test(e.name)).map(e => e.name);
  if (!manifest) warnings.push("AndroidManifest.xml을 찾지 못했어. 정상 APK가 아닐 수 있어.");
  if (signatureFiles.length) warnings.push("기존 서명 파일이 있어. 리소스를 바꾸면 기존 서명은 유효하지 않게 돼.");
  if (entries.some(e => e.name.endsWith(".so"))) warnings.push("네이티브 라이브러리가 포함돼 있어. 교체 후 호환성 검증이 필요해.");
  warnings.push("압축 해제 크기 제한은 ZIP 메타데이터 기반 방어선이며, 모든 악성 ZIP을 완벽히 판별하지는 않아.");
  return { fileName: file.name, byteLength: file.size, entryCount: entries.length, entries, packageName, versionName, versionCode, manifestKind, dexFiles, signatureFiles, warnings };
}
export function editTextManifest(xml: string, attrs: { packageName?: string; versionName?: string; versionCode?: string }): string {
  const trimmed = xml.replace(/^\uFEFF/, "").trimStart();
  if (!(trimmed.startsWith("<?xml") || trimmed.startsWith("<manifest"))) throw new Error("텍스트 XML Manifest만 편집할 수 있어. 바이너리 AXML은 지원하지 않아.");
  if (!/<manifest(?:\s|>)/i.test(xml)) throw new Error("manifest 루트 요소를 찾지 못했어.");
  let output = xml;
  const setAttr = (source: string, name: string, value: string): string => {
    const escaped = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const re = new RegExp("([\\s])" + name + "\\s*=\\s*([\"'])[^\"']*\\2", "i");
    if (re.test(source)) return source.replace(re, "$1" + name + "=\"" + escaped + "\"");
    return source.replace(/<manifest\b/i, "<manifest " + name + "=\"" + escaped + "\"");
  };
  if (attrs.packageName !== undefined) {
    if (!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)+$/.test(attrs.packageName)) throw new Error("패키지명 형식이 올바르지 않아.");
    output = setAttr(output, "package", attrs.packageName);
  }
  if (attrs.versionName !== undefined) output = setAttr(output, "android:versionName", attrs.versionName);
  if (attrs.versionCode !== undefined) {
    if (!/^\d+$/.test(attrs.versionCode)) throw new Error("versionCode는 0 이상의 정수여야 해.");
    output = setAttr(output, "android:versionCode", attrs.versionCode);
  }
  return output;
}
export async function analyzeDex(fileName: string, bytes: Uint8Array): Promise<DexAnalysis> {
  if (bytes.length < 112 || new TextDecoder().decode(bytes.subarray(0, 4)) !== "dex\n") throw new Error("유효한 DEX 헤더를 찾지 못했어.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), version = new TextDecoder().decode(bytes.subarray(4, 7));
  const fileSizeHeader = view.getUint32(32, true), checksum = [...bytes.subarray(8, 12)].map(b => b.toString(16).padStart(2, "0")).join("");
  const text = new TextDecoder("latin1").decode(bytes);
  const strings = text.split(/[^ -~]+/g).filter(s => s.length >= 4).filter((s, i, all) => all.indexOf(s) === i).slice(0, 5000);
  return { fileName, byteLength: bytes.length, version, checksum, fileSizeHeader, stringCount: strings.length, classDescriptors: strings.flatMap(s => s.split(" ").filter(part => part.startsWith("L") && part.endsWith(";"))).filter((s, i, all) => all.indexOf(s) === i).slice(0, 500), strings };
}
export async function rebuildApk(file: File, replacements: Map<string, File>): Promise<Blob> {
  if (file.size > MAX_APK_BYTES) throw new Error("APK 크기가 200 MiB 제한을 초과했어.");
  const zip = await JSZip.loadAsync(await file.arrayBuffer(), { checkCRC32: false, createFolders: false });
  for (const [path, replacement] of replacements) { if (!zip.file(path)) throw new Error("APK 안에서 파일을 찾을 수 없어: " + path); zip.file(path, new Uint8Array(await replacement.arrayBuffer()), { binary: true, date: new Date() }); }
  for (const path of Object.keys(zip.files)) if (/^META-INF\/.*\.(RSA|DSA|EC|SF)$/i.test(path) || /^META-INF\/MANIFEST\.MF$/i.test(path)) zip.remove(path);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.android.package-archive", compression: "DEFLATE", compressionOptions: { level: 6 }, platform: "DOS" });
}
export async function process(input: Input): Promise<ApkInspection> { const error = validate(input); if (error) throw new Error(error.what + " " + error.how); return inspectApk(input.file); }
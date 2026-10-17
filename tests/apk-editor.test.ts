/** TOOLBOX v0.14.79 — APK Editor tests */
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { analyzeDex, editTextManifest, inspectApk, rebuildApk, validate } from "../src/tools/file/apk-editor/processor.ts";
function fakeFile(name: string, bytes: Uint8Array): File { return new File([bytes.slice().buffer as ArrayBuffer], name, { type: "application/vnd.android.package-archive" }); }
async function makeApk(): Promise<File> {
  const zip = new JSZip();
  zip.file("AndroidManifest.xml", '<?xml version="1.0"?><manifest package="org.example.demo" android:versionName="1.2" android:versionCode="12"/>');
  zip.file("res/drawable/icon.png", new Uint8Array([1, 2, 3]));
  zip.file("classes.dex", new Uint8Array([100, 101, 120, 10, 48, 51, 53, 0, ...new Array(104).fill(0)]));
  zip.file("META-INF/CERT.SF", "old signature");
  return fakeFile("demo.apk", await zip.generateAsync({ type: "uint8array" }));
}
describe("APK Editor v0.14.79", () => {
  it("rejects missing or non-APK inputs", () => { expect(validate(null)).not.toBeNull(); expect(validate({ file: new File(["x"], "not.zip") })).not.toBeNull(); });
  it("inspects ZIP entries and text manifest metadata", async () => { const info = await inspectApk(await makeApk()); expect(info.entryCount).toBe(4); expect(info.packageName).toBe("org.example.demo"); expect(info.dexFiles).toEqual(["classes.dex"]); expect(info.signatureFiles).toContain("META-INF/CERT.SF"); });
  it("rebuilds with replacements and strips stale signatures", async () => { const file = await makeApk(); const output = await rebuildApk(file, new Map([["res/drawable/icon.png", new File([new Uint8Array([9, 8])], "icon.png")]])); const zip = await JSZip.loadAsync(await output.arrayBuffer()); expect(await zip.file("res/drawable/icon.png")!.async("uint8array")).toEqual(new Uint8Array([9, 8])); expect(zip.file("META-INF/CERT.SF")).toBeNull(); });
  it("reads DEX header and basic strings without pretending to decompile", async () => { const bytes = new Uint8Array(120); bytes.set(new TextEncoder().encode("dex\n035\0hello.class Lorg/example/App;")); new DataView(bytes.buffer).setUint32(32, bytes.length, true); const result = await analyzeDex("classes.dex", bytes); expect(result.version).toBe("035"); expect(result.stringCount).toBeGreaterThan(0); });
  it("edits text XML manifest attributes and escapes XML values", () => {
    const xml = '<?xml version="1.0"?><manifest package="org.example.demo" android:versionName="1.2" android:versionCode="12"/>';
    const edited = editTextManifest(xml, { packageName: "org.example.updated", versionName: "2 & beta", versionCode: "13" });
    expect(edited).toContain('package="org.example.updated"');
    expect(edited).toContain('android:versionName="2 &amp; beta"');
    expect(edited).toContain('android:versionCode="13"');
    expect(() => editTextManifest(xml, { packageName: "bad name" })).toThrow();
    expect(() => editTextManifest("<manifest/>", { versionCode: "-1" })).toThrow();
  });
});
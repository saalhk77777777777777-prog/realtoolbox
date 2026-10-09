/** TOOLBOX v0.14.46 — PDF user-facing error regression tests */
import { describe, it, expect } from "vitest";
import { loadPdf, checkPdfHeader, hasEncryptDict } from "../src/tools/pdf/shared/loadPdf.ts";
import { processPdfToImage } from "../src/tools/pdf/pdf-to-image/processor.ts";
import { processMerge } from "../src/tools/pdf/pdf-merge/processor.ts";
import { processSplit } from "../src/tools/pdf/pdf-split/processor.ts";
import { processPdfMeta } from "../src/tools/pdf/pdf-metadata/processor.ts";
import { makePdf } from "./helpers/pdfFixtures.ts";

const fileOf = (bytes: Uint8Array): File =>
  new File([bytes as BlobPart], "fixture.pdf", { type: "application/pdf" });

interface Thrown { code?: string; what?: string; why?: string; how?: string }

const catchErr = async (fn: () => Promise<unknown>): Promise<Thrown> => {
  try { await fn(); }
  catch (e) { return e as Thrown; }
  throw new Error("Expected operation to reject, but it resolved successfully.");
};

const withEncryptDict = (bytes: Uint8Array): Uint8Array => {
  let s = new TextDecoder("latin1").decode(bytes);
  s = s.replace(/(<<\s*)(\/Size)/, "$1/Encrypt 999 0 R $2");
  if (!s.includes("/Encrypt")) s = s.replace(/\n%%EOF\s*$/, "\n/Encrypt 999 0 R\n%%EOF\n");
  if (!s.includes("/Encrypt")) s += "\n/Encrypt 999 0 R\n";
  s = s.replace(/\n%%EOF\s*$/, "\n999 0 obj\n<< /Filter /Standard /V 1 /R 2 /O <00> /U <00> /P -1 >>\nendobj\n%%EOF\n");
  if (!s.includes("/Encrypt")) s += "\n/Encrypt 999 0 R\n";
  return new TextEncoder().encode(s);
};

const expectNoLeak = (e: Thrown) => {
  const blob = [e.what || "", e.why || "", e.how || ""].join(" ");
  for (const leak of [
    "Cannot read properties of undefined", "ignoreEncryption", "Failed to parse PDF document",
    "at Object.", "node_modules", "pdf.worker", "Setting up fake worker",
  ]) expect(blob).not.toContain(leak);
};

describe("PDF user-facing error messages", () => {
  const garbage = new TextEncoder().encode("\x89PNG\r\n\x1a\nNOT-A-PDF-AT-ALL");
  const headerOnly = new TextEncoder().encode("%PDF-1.4\n");

  it("rejects non-PDF input at header validation", () => {
    expect(checkPdfHeader(garbage)?.code).toBe("FILE_INVALID");
  });
  it("rejects header-only and truncated PDFs", async () => {
    expect((await catchErr(() => loadPdf(headerOnly))).code).toBe("FILE_INVALID");
    const full = await makePdf(4);
    const e = await catchErr(() => loadPdf(full.slice(0, Math.floor(full.length / 2))));
    expect(e.code).toBe("FILE_INVALID");
    expectNoLeak(e);
  });
  it("detects encrypted marker before parsing", async () => {
    const enc = withEncryptDict(await makePdf(2));
    expect(hasEncryptDict(enc)).toBe(true);
    const e = await catchErr(() => loadPdf(enc));
    expect(e.code).toBe("FILE_INVALID");
    expect(e.what).toContain("암호가 걸린 PDF");
    expectNoLeak(e);
  });
  it("normal PDF is not marked encrypted", async () => {
    expect(hasEncryptDict(await makePdf(1))).toBe(false);
  });
  it("all PDF tools return structured errors for malformed/encrypted inputs", async () => {
    const bad = [garbage, headerOnly];
    for (const bytes of bad) {
      const f = fileOf(bytes);
      const results = [
        await catchErr(() => processPdfMeta({ file: f })),
        await catchErr(() => processMerge({ files: [f] })),
        await catchErr(() => processSplit({ file: f, mode: "all" })),
        await catchErr(() => processPdfToImage({ file: f, format: "png", quality: 0.9, scale: 2, pageNumbers: "" })),
      ];
      for (const e of results) {
        expect(e.code).toBe("FILE_INVALID");
        expect(e.what).toBeTruthy();
        expect(e.how).toBeTruthy();
        expectNoLeak(e);
      }
    }
  });
  it("PDF-to-image rejects encrypted marker before loading pdf.js", async () => {
    const enc = fileOf(withEncryptDict(await makePdf(1)));
    const e = await catchErr(() => processPdfToImage({
      file: enc, format: "png", quality: 0.9, scale: 2, pageNumbers: "",
    }));
    expect(e.code).toBe("FILE_INVALID");
    expect(e.what).toContain("암호가 걸린 PDF");
  });
  it("PDF-to-image rejects false files before loading pdf.js", async () => {
    const e = await catchErr(() => processPdfToImage({
      file: fileOf(garbage), format: "png", quality: 0.9, scale: 2, pageNumbers: "",
    }));
    expect(e.code).toBe("FILE_INVALID");
    expect(e.what).toContain("PDF 파일이 아닙니다");
    expectNoLeak(e);
  });
});

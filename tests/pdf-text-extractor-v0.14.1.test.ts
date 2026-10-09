/** TOOLBOX v0.14.1 — PDF Text Extractor QA */
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { processPdfText, validatePdfText, MAX_PDF_BYTES } from "../src/tools/pdf/pdf-text-extractor/processor.ts";
import { loadPdf } from "../src/tools/pdf/shared/loadPdf.ts";

const makePdf = async (texts: string[]) => {
  const d=await PDFDocument.create(); const font=await d.embedFont(StandardFonts.Helvetica);
  for(const text of texts){const p=d.addPage([500,700]); p.drawText(text,{x:40,y:620,size:18,font,color:rgb(0,0,0)});}
  return new Uint8Array(await d.save());
};
const file=(b:Uint8Array,n="테스트 PDF.pdf")=>new File([new Uint8Array(b)],n,{type:"application/pdf"});

describe("PDF Text Extractor v0.14.1",()=>{
  it("rejects absent, empty, and oversize input",()=>{
    expect(validatePdfText(null)?.code).toBe("USER_INPUT");
    expect(validatePdfText({file:new File([],"empty.pdf",{type:"application/pdf"})})?.code).toBe("FILE_INVALID");
    expect(validatePdfText({file:new File([new Uint8Array(MAX_PDF_BYTES+1)],"big.pdf",{type:"application/pdf"})})?.code).toBe("UNSUPPORTED");
  });
  it("extracts text page-by-page and preserves Korean filename",async()=>{
    const b=await makePdf(["TOOLBOX PAGE ONE","TOOLBOX PAGE TWO"]); const r=await processPdfText({file:file(b)});
    expect(r.pageCount).toBe(2); expect(r.pages).toHaveLength(2); expect(r.text).toContain("TOOLBOX PAGE ONE"); expect(r.text).toContain("TOOLBOX PAGE TWO"); expect(r.fileName).toBe("테스트 PDF.pdf"); expect(r.characterCount).toBe([...r.text].length);
  });
  it("returns empty text for image/vector-only page instead of failing",async()=>{const b=await makePdf([""]); const r=await processPdfText({file:file(b)}); expect(r.pageCount).toBe(1); expect(r.pages).toEqual([""]);});
  it("rejects fake PDF header",async()=>{await expect(processPdfText({file:file(new TextEncoder().encode("%PDF-1.7\nnot a pdf"))})).rejects.toMatchObject({code:"FILE_INVALID"});});
  it("rejects truncated real PDF",async()=>{const b=await makePdf(["hello"]); await expect(processPdfText({file:file(b.slice(0,Math.floor(b.length/2)))})).rejects.toMatchObject({code:"FILE_INVALID"});});
  it("output contract can be independently reopened",async()=>{const b=await makePdf(["round trip"]); const out=await processPdfText({file:file(b)}); const original=await loadPdf(b); expect(out.pageCount).toBe(original.getPageCount()); expect(typeof out.text).toBe("string");});
});

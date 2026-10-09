/** TOOLBOX v0.14.1 — PDF Page Reorder / Rotate QA */
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { loadPdf } from "../src/tools/pdf/shared/loadPdf.ts";
import { processReorder, validateReorder } from "../src/tools/pdf/pdf-page-reorder/processor.ts";
import { processRotate, validateRotate } from "../src/tools/pdf/pdf-page-rotate/processor.ts";

async function makePdf() { const d=await PDFDocument.create(); d.addPage([300,400]); d.addPage([400,500]); d.addPage([500,600]); return new Uint8Array(await d.save()); }
function asFile(b:Uint8Array,n="pages.pdf"){return new File([new Uint8Array(b)],n,{type:"application/pdf"});}

describe("PDF Page tools v0.14.1",()=>{
 it("validates reorder boundaries",()=>{const f=asFile(new Uint8Array([37,80,68,70,45,49,46,55])); expect(validateReorder(null)?.code).toBe("USER_INPUT"); expect(validateReorder({file:f,order:[]})?.code).toBe("USER_INPUT"); expect(validateReorder({file:f,order:[1,2.5]})?.code).toBe("USER_INPUT");});
 it("reorders actual pages and preserves page dimensions",async()=>{const b=await makePdf(); const r=await processReorder({file:asFile(b,"한글 pages.pdf"),order:[3,1,2]}); expect(r.pageCount).toBe(3); expect(r.order).toEqual([3,1,2]); const out=await loadPdf(new Uint8Array(await r.blob.arrayBuffer())); const sizes=out.getPages().map(p=>[p.getWidth(),p.getHeight()]); expect(sizes).toEqual([[500,600],[300,400],[400,500]]);});
 it("rejects duplicate, missing, and out-of-range pages",async()=>{const f=asFile(await makePdf()); await expect(processReorder({file:f,order:[1,1,2]})).rejects.toMatchObject({code:"USER_INPUT"}); await expect(processReorder({file:f,order:[1,2,4]})).rejects.toMatchObject({code:"USER_INPUT"}); await expect(processReorder({file:f,order:[1,2]})).rejects.toMatchObject({code:"USER_INPUT"});});
 it("validates only quarter-turn rotations",()=>{const f=asFile(new Uint8Array([37,80,68,70,45,49,46,55])); expect(validateRotate({file:f,rotation:0}) ).toBeNull(); expect(validateRotate({file:f,rotation:90}) ).toBeNull(); expect(validateRotate({file:f,rotation:180}) ).toBeNull(); expect(validateRotate({file:f,rotation:270}) ).toBeNull(); expect(validateRotate({file:f,rotation:45 as never})?.code).toBe("USER_INPUT");});
 it("rotates every actual page and output remains readable",async()=>{const b=await makePdf(); const r=await processRotate({file:asFile(b),rotation:90}); expect(r.pageCount).toBe(3); const out=await loadPdf(new Uint8Array(await r.blob.arrayBuffer())); expect(out.getPages()).toHaveLength(3); expect(out.getPages().every(p=>p.getRotation().angle===90)).toBe(true);});
 it("keeps 0 degree as a valid no-op",async()=>{const b=await makePdf(); const r=await processRotate({file:asFile(b),rotation:0}); const out=await loadPdf(new Uint8Array(await r.blob.arrayBuffer())); expect(out.getPages().every(p=>p.getRotation().angle===0)).toBe(true);});
});

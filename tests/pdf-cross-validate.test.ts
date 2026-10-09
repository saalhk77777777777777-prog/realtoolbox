/**
 * TOOLBOX v0.7.0 — 산출물 교차검증 (pdf.js) + EXIF 회전
 *
 * pdf-lib로 만들고 pdf-lib로 읽으면 같은 오해를 공유한다. pdf.js는 별개 구현이므로
 * 구조 검증에 쓴다. content stream은 압축돼 있어 grep 대신 pdf.js 연산자 목록을 본다.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { processImageToPdf } from "../src/tools/pdf/image-to-pdf/processor.ts";
import { processMerge } from "../src/tools/pdf/pdf-merge/processor.ts";
import { processSplit } from "../src/tools/pdf/pdf-split/processor.ts";
import { processCompress } from "../src/tools/pdf/pdf-compress/processor.ts";

type PdfJs = typeof import("pdfjs-dist");
let pdfjs!: PdfJs;
let OPS!: PdfJs["OPS"];

beforeAll(async () => {
  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs = ((mod as { default?: unknown }).default ?? mod) as PdfJs;
  OPS = pdfjs.OPS;
});

const fileOf = (bytes: Uint8Array): File =>
  new File([bytes as BlobPart], "f.pdf", { type: "application/pdf" });

/** pdf-lib가 아니라 pdf.js로 다시 연다 */
async function inspect(bytes: Uint8Array) {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    useWorkerFetch: false,
    disableFontFace: true,
    verbosity: 0,
  }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const vp = pg.getViewport({ scale: 1 });
    const ops = await pg.getOperatorList();
    pages.push({
      width: vp.width,
      height: vp.height,
      ops: ops.fnArray,
      args: ops.argsArray,
    });
  }
  return { numPages: doc.numPages, pages };
}

async function sourcePdf(pages: number): Promise<Uint8Array> {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const p = d.addPage([300, 400]);
    p.drawRectangle({ x: 20, y: 20, width: 260, height: 360, color: rgb(0.2, 0.3, 0.8) });
    p.drawText(`P${i + 1}`, { x: 30, y: 380, size: 18, font: f });
  }
  return d.save();
}

/** 회전 표시가 든 합성 JPEG (SOI + APP1/EXIF + SOF0 + EOI). 저장 크기 W×H. */
function jpegWithExifOrientation(orientation: number, w = 120, h = 80): Uint8Array {
  const tiff = [
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00,
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00,
    orientation & 0xff, (orientation >> 8) & 0xff, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];
  const payload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff];
  const app1Len = payload.length + 2;
  const sof = [0xff, 0xc0, 0x00, 0x11, 0x08, (h >> 8) & 0xff, h & 0xff, (w >> 8) & 0xff, w & 0xff, 0x03];
  sof.push(1, 0x22, 0x00, 2, 0x11, 0x01, 3, 0x11, 0x01);
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe1, (app1Len >> 8) & 0xff, app1Len & 0xff, ...payload]),
      Buffer.from(sof),
      Buffer.from([0xff, 0xd9]),
    ]),
  );
}

const jpegFile = (bytes: Uint8Array) =>
  new File([bytes as BlobPart], "photo.jpg", { type: "image/jpeg" });

/** PDF 행렬 곱: a × b */
const mul = (a: number[], b: number[]): number[] => [
  a[0] * b[0] + a[1] * b[2],
  a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2],
  a[2] * b[1] + a[3] * b[3],
  a[4] * b[0] + a[5] * b[2] + b[4],
  a[4] * b[1] + a[5] * b[3] + b[5],
];

/**
 * paintImageXObject 시점의 누적 CTM.
 * pdf.js는 pdf-lib의 연결 행렬을 translate/rotate/scale로 나누어 내보내므로
 * 연속 transform을 곱해야 한다. save마다 초기화한다.
 */
function paintMatrix(page: { ops: number[]; args: unknown[][] }): number[] | null {
  let acc = [1, 0, 0, 1, 0, 0];
  for (let i = 0; i < page.ops.length; i++) {
    const op = page.ops[i];
    if (op === OPS.save) acc = [1, 0, 0, 1, 0, 0];
    else if (op === OPS.transform) acc = mul(acc, page.args[i] as number[]);
    else if (op === OPS.paintImageXObject) return acc;
  }
  return null;
}

/** 회전 여부: CTM의 b/c 성분이 0이 아니면 회전되어 있다 */
function hasRotation(page: { ops: number[]; args: unknown[][] }): boolean {
  const m = paintMatrix(page);
  return !!m && (Math.abs(m[1]) > 1e-6 || Math.abs(m[2]) > 1e-6);
}

/** 실제로 그려지는 bounding box */
function drawnBox(page: { ops: number[]; args: unknown[][] }): { w: number; h: number } | null {
  const m = paintMatrix(page);
  return m ? { w: Math.hypot(m[0], m[1]), h: Math.hypot(m[2], m[3]) } : null;
}

describe("pdf.js 교차검증 — merge/split/compress", () => {
  it("merge 2+3 = 5페이지, pdf.js가 크기와 내용을 확인", async () => {
    const a = await sourcePdf(2);
    const b = await sourcePdf(3);
    const out = await processMerge({ files: [fileOf(a), fileOf(b)] });
    const bytes = new Uint8Array(await (out.blob as Blob).arrayBuffer());
    const r = await inspect(bytes);

    expect(r.numPages).toBe(5);
    for (const p of r.pages) {
      expect(p.width).toBe(300);
      expect(p.height).toBe(400);
      expect(p.ops).toContain(OPS.showText); // 내용은 살아있다
    }
  });

  it("split은 선택 페이지만 남기고 원본 바이트는 불변", async () => {
    const src = await sourcePdf(5);
    const before = Buffer.from(src).toString("base64");
    const out = await processSplit({ file: fileOf(src), mode: "range", rangeStart: 2, rangeEnd: 3 });
    const r = await inspect(new Uint8Array(await (out.blob as Blob).arrayBuffer()));

    expect(r.numPages).toBe(2);
    expect(Buffer.from(src).toString("base64")).toBe(before);
  });

  it("compress 산출물이 pdf.js에서 열린다", async () => {
    const out = await processCompress({ file: fileOf(await sourcePdf(3)), mode: "strip" });
    const r = await inspect(new Uint8Array(await (out.blob as Blob).arrayBuffer()));
    expect(r.numPages).toBe(3);
    expect(r.pages[0].ops).toContain(OPS.showText);
  });
});

describe("image-to-pdf EXIF 회전", () => {
  it("EXIF 6(시계 90°) — 페이지에 회전이 들어가야 한다", async () => {
    const out = await processImageToPdf({ files: [jpegFile(jpegWithExifOrientation(6))], pageSize: "image", margin: 0 });
    const r = await inspect(new Uint8Array(await (out.blob as Blob).arrayBuffer()));

    expect(r.numPages).toBe(1);
    // 저장 크기는 120x80(가로)지만 표시 기준은 80x120(세로)이어야 한다
    expect(r.pages[0].width).toBe(80);
    expect(r.pages[0].height).toBe(120);
    expect(hasRotation(r.pages[0])).toBe(true);
    // 회전 후 실제 그려지는 bounding box도 80x120이어야 축이 안 뒤집힌다
    const drawn = drawnBox(r.pages[0]);
    expect(drawn?.w).toBeCloseTo(80, 3);
    expect(drawn?.h).toBeCloseTo(120, 3);
  });

  it("EXIF 8(시계 270°)도 회전되고 축이 유지된다", async () => {
    const out = await processImageToPdf({ files: [jpegFile(jpegWithExifOrientation(8))], pageSize: "image", margin: 0 });
    const r = await inspect(new Uint8Array(await (out.blob as Blob).arrayBuffer()));

    expect(r.pages[0].width).toBe(80);
    expect(r.pages[0].height).toBe(120);
    expect(hasRotation(r.pages[0])).toBe(true);
    const drawn = drawnBox(r.pages[0]);
    expect(drawn?.w).toBeCloseTo(80, 3);
    expect(drawn?.h).toBeCloseTo(120, 3);
  });

  it("EXIF 1/없음 — 회전 없이 원본 크기 그대로 (无损 embed 유지)", async () => {
    for (const o of [1, 3]) {
      const out = await processImageToPdf({ files: [jpegFile(jpegWithExifOrientation(o))], pageSize: "image", margin: 0 });
      const r = await inspect(new Uint8Array(await (out.blob as Blob).arrayBuffer()));
      expect(r.pages[0].width).toBe(120);
      expect(r.pages[0].height).toBe(80);
      expect(hasRotation(r.pages[0])).toBe(false);
    }
  });

  it("EXIF 없는 JPEG도 안전하게 통과한다", async () => {
    const noExif = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x50, 0x00, 0x78, 0x03, 1, 0x22, 0x00, 2, 0x11, 0x01, 3, 0x11, 0x01, 0xff, 0xd9]);
    const out = await processImageToPdf({ files: [jpegFile(noExif)], pageSize: "image", margin: 0 });
    const r = await inspect(new Uint8Array(await (out.blob as Blob).arrayBuffer()));
    expect(r.numPages).toBe(1);
    expect(hasRotation(r.pages[0])).toBe(false);
  });

  it("회전 여부와 무관하게 JPEG는 손실 없이 원본 바이트로 embed된다", async () => {
    const jpg = jpegWithExifOrientation(1);
    const out = await processImageToPdf({ files: [jpegFile(jpg)], pageSize: "a4", margin: 20 });
    const bytes = new Uint8Array(await (out.blob as Blob).arrayBuffer());
    // /DCTDecode = JPEG 플러그인, PNG로 재인코딩되지 않았음이 확인된다
    expect(Buffer.from(bytes).toString("latin1")).toContain("/DCTDecode");
  });
});

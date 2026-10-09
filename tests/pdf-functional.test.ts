import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { processMerge, validateMerge, MAX_MERGE_FILES } from "../src/tools/pdf/pdf-merge/processor.ts";
import { processSplit, validateSplit, MAX_PDF_PAGES } from "../src/tools/pdf/pdf-split/processor.ts";
import { processCompress } from "../src/tools/pdf/pdf-compress/processor.ts";
import { processPdfMeta } from "../src/tools/pdf/pdf-metadata/processor.ts";
import { pdfFile, makePdf, PNG_2x2_RED } from "./helpers/pdfFixtures.ts";
import { loadPdf } from "../src/tools/pdf/shared/loadPdf.ts";

/**
 * pdf-lib의 load()는 기본으로 Info dict를 덮어쓴다. 원본 필드를 그대로 읽어야
 * 메타데이터/압축 결과를 검증할 수 있으므로 updateMetadata:false로 읽는다.
 */
const readPdf = (bytes: Uint8Array | ArrayBuffer): Promise<PDFDocument> =>
  PDFDocument.load(bytes, { updateMetadata: false });

const pagesOf = async (blob: Blob): Promise<number> =>
  (await readPdf(await blob.arrayBuffer())).getPageCount();

const isPdf = async (blob: Blob): Promise<boolean> => {
  const head = new TextDecoder("latin1").decode(new Uint8Array(await blob.slice(0, 5).arrayBuffer()));
  return head === "%PDF-";
};

// ─────────────────────────────────────────────
// 하: 기본 정상 — 산출물이 실제로 유효한 PDF인지
// ─────────────────────────────────────────────
describe("PDF 하 — 기본 정상 (실제 출력 검증)", () => {
  it("merge: 2파일 → 유효 PDF, 페이지 수 합산", async () => {
    const out = await processMerge({ files: [await pdfFile(1), await pdfFile(2)] });
    expect(await isPdf(out.blob)).toBe(true);
    expect(await pagesOf(out.blob)).toBe(3);
    expect(out.fileCount).toBe(2);
  });

  it("split: all → 선택한 페이지만 담은 새 PDF", async () => {
    const out = await processSplit({ file: await pdfFile(4), mode: "all" });
    expect(await isPdf(out.blob)).toBe(true);
    expect(await pagesOf(out.blob)).toBe(4);
    expect(out.pageCount).toBe(4);
    expect(out.splitCount).toBe(4);
  });

  it("metadata: 페이지 수와 필드를 정확히 읽음", async () => {
    const out = await processPdfMeta({ file: await pdfFile(3, { title: "T", author: "A" }) });
    expect(out.pageCount).toBe(3);
    expect(out.title).toBe("T");
    expect(out.author).toBe("A");
    expect(out.isEncrypted).toBe(false);
    expect(out.pdfVersion).toMatch(/^\d+\.\d+$/);
  });

  it("compress: 유효 PDF 출력, 페이지 보존", async () => {
    const out = await processCompress({ file: await pdfFile(2), mode: "keep" });
    expect(await isPdf(out.blob)).toBe(true);
    expect(await pagesOf(out.blob)).toBe(2);
  });
});

// ─────────────────────────────────────────────
// 중: 경계값·예상 가능한 예외
// ─────────────────────────────────────────────
describe("PDF 중 — 경계·예외", () => {
  it("split odd/even — 페이지 수 정확히 절반", async () => {
    const f = await pdfFile(5);
    const odd = await processSplit({ file: f, mode: "odd" });
    expect(odd.splitCount).toBe(3);
    expect(await pagesOf(odd.blob)).toBe(3);

    const even = await processSplit({ file: f, mode: "even" });
    expect(even.splitCount).toBe(2);
    expect(await pagesOf(even.blob)).toBe(2);
  });

  it("split range — 지정 범위만, 경계 밖 제외", async () => {
    const out = await processSplit({ file: await pdfFile(10), mode: "range", rangeStart: 3, rangeEnd: 5 });
    expect(out.splitCount).toBe(3);
    expect(await pagesOf(out.blob)).toBe(3);
  });

  it("split range — 페이지 수를 넘기는 범위는 잘라냄", async () => {
    const out = await processSplit({ file: await pdfFile(3), mode: "range", rangeStart: 1, rangeEnd: 99 });
    expect(out.splitCount).toBe(3);
  });

  it("split even — 1페이지 PDF는 거절 (무결과 방지)", async () => {
    await expect(processSplit({ file: await pdfFile(1), mode: "even" })).rejects.toMatchObject({
      code: "USER_INPUT",
    });
  });

  it("range 검증 — 정수/범위 밖 거부", () => {
    const f = new File(["%PDF-"], "a.pdf");
    expect(validateSplit({ file: f, mode: "range", rangeStart: 0, rangeEnd: 2 })?.code).toBe("USER_INPUT");
    expect(validateSplit({ file: f, mode: "range", rangeStart: 5, rangeEnd: 2 })?.code).toBe("USER_INPUT");
    expect(validateSplit({ file: f, mode: "range", rangeStart: 1.5, rangeEnd: 2 })?.code).toBe("USER_INPUT");
    expect(validateSplit({ file: f, mode: "range", rangeStart: 1, rangeEnd: MAX_PDF_PAGES + 1 })?.code).toBe(
      "USER_INPUT",
    );
    expect(validateSplit({ file: f, mode: "range", rangeStart: 1, rangeEnd: 2 })).toBeNull();
  });

  it("merge: 1개 파일도 동작", async () => {
    const out = await processMerge({ files: [await pdfFile(3)] });
    expect(await pagesOf(out.blob)).toBe(3);
  });

  it("compress: 두 방식 모두 유효 PDF", async () => {
    for (const mode of ["keep", "strip"] as const) {
      const out = await processCompress({ file: await pdfFile(2), mode });
      expect(await isPdf(out.blob)).toBe(true);
      expect(await pagesOf(out.blob)).toBe(2);
      expect(out.mode).toBe(mode);
    }
  });

it("compress: strip은 개인정보 필드를 지우고 keep은 보존한다", async () => {
    // 회귀 방어 — 이전 결함은 strong이 medium과 완전히 동일하면서 "강력"이라는 이름만
    // 달랐던 것이었다. 선택지가 실제로 결과를 바꾸는지 확인하지 않으면 또 같은 함정이 생긴다.
    const src = await pdfFile(1, { author: "Secret Person", subject: "Internal", title: "KeepMe" });
    const keep = await readPdf(await (await processCompress({ file: src, mode: "keep" })).blob.arrayBuffer());
    const strip = await readPdf(await (await processCompress({ file: src, mode: "strip" })).blob.arrayBuffer());

    expect(keep.getAuthor()).toBe("Secret Person");
    expect(strip.getAuthor()).toBe("");
    expect(strip.getSubject()).toBe("");
    // title은 두 모드 모두 보존된다 — strip이 지우는 대상이 아님을 고정 (UI 라벨과 일치)
    expect(strip.getTitle()).toBe("KeepMe");
    // 두 모드가 같은 바이트열을 내면 안 된다
    const kb = new Uint8Array(await (await processCompress({ file: src, mode: "keep" })).blob.arrayBuffer());
    const sb = new Uint8Array(await (await processCompress({ file: src, mode: "strip" })).blob.arrayBuffer());
    expect(Buffer.from(kb).equals(Buffer.from(sb))).toBe(false);
  });

  it("compress: 크기 축약을 약속하지 않는다 — 페이지와 유효성은 유지된다", async () => {
    // 이 도구가 하는 일은 구조/메타데이터 정리다. 이름에서 "압축"을 뺀 이유를 고정한다.
    const src = await pdfFile(2);
    for (const mode of ["keep", "strip"] as const) {
      const out = await processCompress({ file: src, mode });
      expect(await isPdf(out.blob)).toBe(true);
      expect(out.outputSize).toBeGreaterThan(0);
      // 다운로드 이름이 "압축"을 약속하면 안 된다 — 도구 이름과 같은 정직한 계약
      expect(out.fileName).toBe("cleaned.pdf");
      expect(await pagesOf(out.blob)).toBe(2);
    }
  });

  it("compress: strip은 Producer를 TOOLBOX로 정규화", async () => {
    const out = await processCompress({ file: await pdfFile(1), mode: "strip" });
    expect((await readPdf(await out.blob.arrayBuffer())).getProducer()).toBe("TOOLBOX");
  });

  it("compress: 수정 시각을 epoch로 정규화 (비교 가능하게)", async () => {
    const out = await processCompress({ file: await pdfFile(1), mode: "strip" });
    const mod = (await readPdf(await out.blob.arrayBuffer())).getModificationDate();
    expect(mod?.getTime()).toBe(0);
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("PDF 상 — 복잡한 입력", () => {
  it("merge: 10파일 × 5페이지 = 50페이지", async () => {
    const files = Array.from({ length: MAX_MERGE_FILES }, () => pdfFile(5));
    const out = await processMerge({ files: await Promise.all(files) });
    expect(await pagesOf(out.blob)).toBe(50);
  });

  it("merge: 페이지 크기가 다른 문서도 병합 (크기 보존)", async () => {
    const a = await PDFDocument.create();
    a.addPage([100, 100]);
    const b = await PDFDocument.create();
    b.addPage([400, 600]);
    const out = await processMerge({
      files: [
        new File([(await a.save()) as BlobPart], "a.pdf"),
        new File([(await b.save()) as BlobPart], "b.pdf"),
      ],
    });
    const loaded = await readPdf(await out.blob.arrayBuffer());
    expect(loaded.getPageCount()).toBe(2);
    // getPage는 0-based
    expect(loaded.getPage(0).getSize()).toEqual({ width: 100, height: 100 });
    expect(loaded.getPage(1).getSize()).toEqual({ width: 400, height: 600 });
  });

  it("split: 원본은 변하지 않음", async () => {
    const original = await pdfFile(6);
    const before = new Uint8Array(await original.arrayBuffer());
    await processSplit({ file: original, mode: "all" });
    const after = new Uint8Array(await original.arrayBuffer());
    expect(after.length).toBe(before.length);
    expect(after.every((b, i) => b === before[i])).toBe(true);
  });

  it("metadata: 텍스트 없는 PDF도 페이지 수를 정확히 센다", async () => {
    // 직전 정규식 카운터는 object stream 안쪽 /Type /Page 를 놓쳤다.
    const out = await processPdfMeta({ file: await pdfFile(12) });
    expect(out.pageCount).toBe(12);
  });

  it("metadata: 필드가 없으면 빈 문자열 (throw 아님)", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const out = await processPdfMeta({ file: new File([(await doc.save()) as BlobPart], "x.pdf") });
    expect(out.pageCount).toBe(1);
    expect(out.author).toBe("");
    expect(out.title).toBe("");
  });

  it("metadata: 날짜는 ISO 문자열 또는 빈 문자열 (형식 깨지지 않음)", async () => {
    const out = await processPdfMeta({ file: await pdfFile(1) });
    for (const d of [out.creationDate, out.modDate]) {
      if (d !== "") expect(Number.isNaN(Date.parse(d))).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────
// 킬러: 손상/위장 입력에 대한 방어
// ─────────────────────────────────────────────
describe("PDF 킬러 — 손상·위장 입력", () => {
  it("merge: PDF가 아닌 바이트는 FILE_INVALID (깨진 파일 조용히 합치지 않음)", async () => {
    await expect(processMerge({ files: [new File(["not a pdf at all"], "x.pdf")] })).rejects.toMatchObject(
      { code: "FILE_INVALID" },
    );
  });

  it("split: 손상 PDF는 거절 — 원본 bytes를 그대로 내보내지 않음", async () => {
    await expect(
      processSplit({ file: new File(["%PDF-1.4\n손상됨"], "x.pdf"), mode: "all" }),
    ).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("compress: 손상 PDF는 거절 — 바이너리가 깨진 채 나오지 않음", async () => {
    await expect(
      processCompress({ file: new File(["%PDF-1.4\n%만 남음"], "x.pdf"), mode: "strip" }),
    ).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("metadata: 손상 PDF는 FILE_INVALID와 사용자 안내 반환", async () => {
    await expect(processPdfMeta({ file: new File(["완전히 잘못된 파일"], "x.pdf") })).rejects.toMatchObject({
      code: "FILE_INVALID",
      how: expect.any(String),
      why: expect.any(String),
    });
  });

  it("merge: 빈 배열/비파일 값 검증", () => {
    expect(validateMerge({ files: [] })?.code).toBe("USER_INPUT");
    expect(validateMerge({ files: ["x"] as never })?.code).toBe("USER_INPUT");
    expect(validateMerge(null)?.code).toBe("USER_INPUT");
  });

  it("split: 0페이지 PDF 거절 (pdf-lib이 생성 가능, 사용자도 보유 가능)", async () => {
    const empty = await PDFDocument.create();
    // save()는 기본적으로 빈 문서에 페이지를 1장 추가하므로 addDefaultPage:false가 필요하다.
    const bytes = await empty.save({ addDefaultPage: false });
    await expect(
      processSplit({ file: new File([bytes as BlobPart], "e.pdf"), mode: "all" }),
    ).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("loadPdf: %PDF- 헤더가 없으면 즉시 거절", async () => {
    await expect(loadPdf(new TextEncoder().encode("GIF89a"))).rejects.toMatchObject({
      code: "FILE_INVALID",
    });
  });

  it("loadPdf: 헤더만 있고 내용이 없으면 거절", async () => {
    await expect(loadPdf(new TextEncoder().encode("%PDF-1.7"))).rejects.toMatchObject({
      code: "FILE_INVALID",
    });
  });

  it("loadPdf: 이미지 위장 파일 거절", async () => {
    await expect(loadPdf(PNG_2x2_RED)).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("loadPdf: 빈 바이트 거절", async () => {
    await expect(loadPdf(new Uint8Array())).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("output 라운드트립 — 결과 PDF가 다시 열리고 페이지 수가 유지됨", async () => {
    const merged = await processMerge({ files: [await pdfFile(2)] });
    const round = await processPdfMeta({ file: new File([merged.blob as BlobPart], "r.pdf") });
    expect(round.pageCount).toBe(2);
  });

  it("fixture 자체가 유효 (테스트 전제 검증)", async () => {
    const bytes = await makePdf(1);
    expect(new TextDecoder("latin1").decode(bytes.subarray(0, 5))).toBe("%PDF-");
  });
});
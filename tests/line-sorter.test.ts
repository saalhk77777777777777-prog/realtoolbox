import { describe, it, expect } from "vitest";
import {
  validateLineSort,
  processLineSort,
  MAX_LINESORT_CHARS,
} from "../src/tools/text/line-sorter/processor.ts";
import { searchTools } from "../src/search/searchIndex.ts";
import {
  registerTool,
  __clearRegistryForTests,
  listTools,
  getTool,
  getToolBySlug,
} from "../src/core/toolRegistry.ts";
import { fileSizeCheckerManifest } from "../src/tools/file/file-size-checker/manifest.ts";
import { textCounterManifest } from "../src/tools/text/text-counter/manifest.ts";
import { base64Manifest } from "../src/tools/developer/base64/manifest.ts";
import { urlCoderManifest } from "../src/tools/developer/url-encoder/manifest.ts";
import { timestampManifest } from "../src/tools/developer/timestamp-converter/manifest.ts";
import { hashManifest } from "../src/tools/developer/hash-generator/manifest.ts";
import { jsonManifest } from "../src/tools/developer/json-formatter/manifest.ts";
import { uuidManifest } from "../src/tools/developer/uuid-generator/manifest.ts";
import { entityManifest } from "../src/tools/developer/html-entity/manifest.ts";
import { urlParserManifest } from "../src/tools/developer/url-parser/manifest.ts";
import { jwtManifest } from "../src/tools/developer/jwt-decoder/manifest.ts";
import { regexManifest } from "../src/tools/developer/regex-tester/manifest.ts";
import { csvManifest } from "../src/tools/data/csv-cleaner/manifest.ts";
import { chartManifest } from "../src/tools/data/csv-chart/manifest.ts";
import { imageCompressorManifest } from "../src/tools/image/image-compressor/manifest.ts";
import { imageResizerManifest } from "../src/tools/image/image-resizer/manifest.ts";
import { imageConverterManifest } from "../src/tools/image/image-converter/manifest.ts";
import { targetManifest } from "../src/tools/image/target-size-compressor/manifest.ts";
import { colorManifest } from "../src/tools/image/color-extractor/manifest.ts";
import { cropFlipManifest } from "../src/tools/image/crop-rotate-flip/manifest.ts";
import { pdfMetaManifest } from "../src/tools/pdf/pdf-metadata/manifest.ts";
import { pdfMergeManifest } from "../src/tools/pdf/pdf-merge/manifest.ts";
import { pdfSplitManifest } from "../src/tools/pdf/pdf-split/manifest.ts";
import { pdfCompressManifest } from "../src/tools/pdf/pdf-compress/manifest.ts";
import { pdfToImageManifest } from "../src/tools/pdf/pdf-to-image/manifest.ts";
import { imageToPdfManifest } from "../src/tools/pdf/image-to-pdf/manifest.ts";
import { caseManifest } from "../src/tools/text/case-converter/manifest.ts";
import { whitespaceManifest } from "../src/tools/text/whitespace-cleaner/manifest.ts";
import { lineSortManifest } from "../src/tools/text/line-sorter/manifest.ts";

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("line-sorter 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateLineSort({ text: "", mode: "string", descending: false })?.code).toBe("USER_INPUT");
    expect(validateLineSort(null)?.code).toBe("USER_INPUT");
  });

  it("정상 입력 허용", () => {
    expect(validateLineSort({ text: "b\na", mode: "string", descending: false })).toBeNull();
  });

  it("문자열 정렬", async () => {
    const out = await processLineSort({ text: "b\na\nc", mode: "string", descending: false });
    expect(out.result).toBe("a\nb\nc");
  });

  it("숫자 정렬", async () => {
    const out = await processLineSort({ text: "3\n1\n2", mode: "number", descending: false });
    expect(out.result).toBe("1\n2\n3");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("line-sorter 중 — 다양한 입력·경계·예외", () => {
  it("길이 정렬", async () => {
    const out = await processLineSort({ text: "aaa\na\naa", mode: "length", descending: false });
    expect(out.result).toBe("a\naa\naaa");
  });

  it("대소문자 무시 정렬", async () => {
    const out = await processLineSort({ text: "Banana\napple\nCherry", mode: "caseInsensitive", descending: false });
    expect(out.result).toBe("apple\nBanana\nCherry");
  });

  it("내림차순", async () => {
    const out = await processLineSort({ text: "a\nb\nc", mode: "string", descending: true });
    expect(out.result).toBe("c\nb\na");
  });

  it("잘못된 모드 거부", () => {
    expect(validateLineSort({ text: "x", mode: "bogus", descending: false } as never)?.code).toBe("USER_INPUT");
  });

  it("초과 입력 거부", () => {
    expect(validateLineSort({ text: "a".repeat(MAX_LINESORT_CHARS + 1), mode: "string", descending: false })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("line-sorter 상 — 복잡한 입력·극단 경계", () => {
  it("혼합 입력", async () => {
    const out = await processLineSort({ text: "10\n2\n1", mode: "number", descending: false });
    expect(out.result).toBe("1\n2\n10");
  });

  it("단일 줄", async () => {
    const out = await processLineSort({ text: "hello", mode: "string", descending: false });
    expect(out.result).toBe("hello");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("line-sorter 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateLineSort({ text: "", mode: "string", descending: false })?.code).toBe("USER_INPUT");
    expect(validateLineSort({ text: "x", mode: "bogus", descending: false } as never)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateLineSort({ text: "a\nb", mode: "string", descending: false })).toBeNull();
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateLineSort({ text: "a".repeat(MAX_LINESORT_CHARS), mode: "string", descending: false })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("line-sorter 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateLineSort({ text: 123, mode: "string", descending: false } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateLineSort(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("line-sorter integration", () => {
  it("Registry 29도구 공존 + 기존 계약 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    registerTool(hashManifest);
    registerTool(jsonManifest);
    registerTool(uuidManifest);
    registerTool(entityManifest);
    registerTool(urlParserManifest);
    registerTool(jwtManifest);
    registerTool(regexManifest);
    registerTool(csvManifest);
    registerTool(chartManifest);
    registerTool(imageCompressorManifest);
    registerTool(imageResizerManifest);
    registerTool(imageConverterManifest);
    registerTool(targetManifest);
    registerTool(colorManifest);
    registerTool(cropFlipManifest);
    registerTool(pdfMetaManifest);
    registerTool(pdfMergeManifest);
    registerTool(pdfSplitManifest);
    registerTool(pdfCompressManifest);
    registerTool(pdfToImageManifest);
    registerTool(imageToPdfManifest);
    registerTool(caseManifest);
    registerTool(whitespaceManifest);
    registerTool(lineSortManifest);
    expect(listTools()).toHaveLength(29);
    expect(getTool("whitespace-cleaner")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("line-sorter")?.category).toBe("text");
  });

  it("Search 발견 + 기존 의도 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    registerTool(hashManifest);
    registerTool(jsonManifest);
    registerTool(uuidManifest);
    registerTool(entityManifest);
    registerTool(urlParserManifest);
    registerTool(jwtManifest);
    registerTool(regexManifest);
    registerTool(csvManifest);
    registerTool(chartManifest);
    registerTool(imageCompressorManifest);
    registerTool(imageResizerManifest);
    registerTool(imageConverterManifest);
    registerTool(targetManifest);
    registerTool(colorManifest);
    registerTool(cropFlipManifest);
    registerTool(pdfMetaManifest);
    registerTool(pdfMergeManifest);
    registerTool(pdfSplitManifest);
    registerTool(pdfCompressManifest);
    registerTool(pdfToImageManifest);
    registerTool(imageToPdfManifest);
    registerTool(caseManifest);
    registerTool(whitespaceManifest);
    registerTool(lineSortManifest);
    expect(searchTools("line sorter")[0]?.id).toBe("line-sorter");
    expect(searchTools("줄 정렬")[0]?.id).toBe("line-sorter");
    expect(searchTools("whitespace")[0]?.id).toBe("whitespace-cleaner");
    expect(searchTools("case converter")[0]?.id).toBe("case-converter");
    expect(searchTools("image to pdf")[0]?.id).toBe("image-to-pdf");
    expect(searchTools("pdf to image")[0]?.id).toBe("pdf-to-image");
    expect(searchTools("pdf compress")[0]?.id).toBe("pdf-compress");
    expect(searchTools("pdf split")[0]?.id).toBe("pdf-split");
    expect(searchTools("pdf merge")[0]?.id).toBe("pdf-merge");
    expect(searchTools("pdf metadata")[0]?.id).toBe("pdf-metadata");
    expect(searchTools("crop")[0]?.id).toBe("crop-rotate-flip");
    expect(searchTools("color extractor")[0]?.id).toBe("color-extractor");
    expect(searchTools("target size")[0]?.id).toBe("target-size-compressor");
    expect(searchTools("image converter")[0]?.id).toBe("image-converter");
    expect(searchTools("image resizer")[0]?.id).toBe("image-resizer");
    expect(searchTools("image compressor")[0]?.id).toBe("image-compressor");
    expect(searchTools("csv chart")[0]?.id).toBe("csv-chart");
    expect(searchTools("csv")[0]?.id).toBe("csv-cleaner");
    expect(searchTools("regex")[0]?.id).toBe("regex-tester");
    expect(searchTools("jwt")[0]?.id).toBe("jwt-decoder");
    expect(searchTools("url parser")[0]?.id).toBe("url-parser");
    expect(searchTools("html entity")[0]?.id).toBe("html-entity");
    expect(searchTools("uuid")[0]?.id).toBe("uuid-generator");
    expect(searchTools("json")[0]?.id).toBe("json-formatter");
    expect(searchTools("hash")[0]?.id).toBe("hash-generator");
    expect(searchTools("timestamp")[0]?.id).toBe("timestamp-converter");
    expect(searchTools("base64")[0]?.id).toBe("base64");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
  });
});

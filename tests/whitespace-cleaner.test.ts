import { describe, it, expect } from "vitest";
import {
  validateWhitespace,
  processWhitespace,
  MAX_WHITESPACE_CHARS,
} from "../src/tools/text/whitespace-cleaner/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("whitespace-cleaner 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateWhitespace({ text: "", trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true })?.code).toBe("USER_INPUT");
    expect(validateWhitespace(null)?.code).toBe("USER_INPUT");
  });

  it("정상 입력 허용", () => {
    expect(validateWhitespace({ text: "hello", trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true })).toBeNull();
  });

  it("trim 적용", async () => {
    const out = await processWhitespace({ text: "  hello  ", trim: true, collapseSpaces: false, removeEmptyLines: false, normalizeTabs: false, normalizeNewlines: false });
    expect(out.result).toBe("hello");
  });

  it("다중 공백 제거", async () => {
    const out = await processWhitespace({ text: "hello   world", trim: false, collapseSpaces: true, removeEmptyLines: false, normalizeTabs: false, normalizeNewlines: false });
    expect(out.result).toBe("hello world");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("whitespace-cleaner 중 — 다양한 입력·경계·예외", () => {
  it("빈 줄 제거", async () => {
    const out = await processWhitespace({ text: "a\n\nb", trim: false, collapseSpaces: false, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: false });
    expect(out.result).toBe("a\nb");
  });

  it("탭 정규화", async () => {
    const out = await processWhitespace({ text: "a\tb", trim: false, collapseSpaces: false, removeEmptyLines: false, normalizeTabs: true, normalizeNewlines: false });
    expect(out.result).toBe("a  b");
  });

  it("CRLF 정규화", async () => {
    const out = await processWhitespace({ text: "a\r\nb", trim: false, collapseSpaces: false, removeEmptyLines: false, normalizeTabs: false, normalizeNewlines: true });
    expect(out.result).toBe("a\nb");
  });

  it("모든 옵션 적용", async () => {
    const out = await processWhitespace({ text: "  a   b  \n\n  c  ", trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true });
    expect(out.result).toBe("a b \n c");
  });

  it("초과 입력 거부", () => {
    expect(validateWhitespace({ text: "a".repeat(MAX_WHITESPACE_CHARS + 1), trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("whitespace-cleaner 상 — 복잡한 입력·극단 경계", () => {
  it("혼합 공백", async () => {
    const out = await processWhitespace({ text: "  a \t  b  ", trim: true, collapseSpaces: true, removeEmptyLines: false, normalizeTabs: true, normalizeNewlines: false });
    expect(out.result).toBe("a b");
  });

  it("연속 빈 줄", async () => {
    const out = await processWhitespace({ text: "a\n\n\n\nb", trim: false, collapseSpaces: false, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: false });
    expect(out.result).toBe("a\nb");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("whitespace-cleaner 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateWhitespace({ text: "", trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true })?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateWhitespace({ text: "hello", trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true })).toBeNull();
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateWhitespace({ text: "a".repeat(MAX_WHITESPACE_CHARS), trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("whitespace-cleaner 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateWhitespace({ text: 123, trim: true, collapseSpaces: true, removeEmptyLines: true, normalizeTabs: false, normalizeNewlines: true } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateWhitespace(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("whitespace-cleaner integration", () => {
  it("Registry 28도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(28);
    expect(getTool("case-converter")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("whitespace-cleaner")?.category).toBe("text");
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
    expect(searchTools("whitespace")[0]?.id).toBe("whitespace-cleaner");
    expect(searchTools("공백 정리")[0]?.id).toBe("whitespace-cleaner");
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

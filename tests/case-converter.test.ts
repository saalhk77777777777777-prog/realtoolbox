import { describe, it, expect } from "vitest";
import {
  validateCase,
  processCase,
  MAX_CASE_CHARS,
} from "../src/tools/text/case-converter/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("case-converter 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateCase({ text: "", mode: "lower" })?.code).toBe("USER_INPUT");
    expect(validateCase(null)?.code).toBe("USER_INPUT");
  });

  it("정상 입력 허용", () => {
    expect(validateCase({ text: "hello", mode: "lower" })).toBeNull();
  });

  it("lower 변환", async () => {
    const out = await processCase({ text: "HELLO WORLD", mode: "lower" });
    expect(out.result).toBe("hello world");
  });

  it("upper 변환", async () => {
    const out = await processCase({ text: "hello world", mode: "upper" });
    expect(out.result).toBe("HELLO WORLD");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("case-converter 중 — 다양한 입력·경계·예외", () => {
  it("title 변환", async () => {
    const out = await processCase({ text: "hello world", mode: "title" });
    expect(out.result).toBe("Hello World");
  });

  it("camel 변환", async () => {
    const out = await processCase({ text: "hello world", mode: "camel" });
    expect(out.result).toBe("helloWorld");
  });

  it("pascal 변환", async () => {
    const out = await processCase({ text: "hello world", mode: "pascal" });
    expect(out.result).toBe("HelloWorld");
  });

  it("snake 변환", async () => {
    const out = await processCase({ text: "hello world", mode: "snake" });
    expect(out.result).toBe("hello_world");
  });

  it("kebab 변환", async () => {
    const out = await processCase({ text: "hello world", mode: "kebab" });
    expect(out.result).toBe("hello-world");
  });

  it("잘못된 모드 거부", () => {
    expect(validateCase({ text: "x", mode: "bogus" } as never)?.code).toBe("USER_INPUT");
  });

  it("초과 입력 거부", () => {
    expect(validateCase({ text: "a".repeat(MAX_CASE_CHARS + 1), mode: "lower" })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("case-converter 상 — 복잡한 입력·극단 경계", () => {
  it("혼합 입력", async () => {
    const out = await processCase({ text: "hello WORLD foo BAR", mode: "title" });
    expect(out.result).toBe("Hello World Foo Bar");
  });

  it("이미 변환된 입력", async () => {
    const out = await processCase({ text: "hello_world", mode: "camel" });
    expect(out.result).toBe("helloWorld");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("case-converter 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateCase({ text: "", mode: "lower" })?.code).toBe("USER_INPUT");
    expect(validateCase({ text: "x", mode: "bogus" } as never)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateCase({ text: "hello", mode: "lower" })).toBeNull();
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateCase({ text: "a".repeat(MAX_CASE_CHARS), mode: "lower" })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("case-converter 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateCase({ text: 123, mode: "lower" } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateCase(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("case-converter integration", () => {
  it("Registry 27도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(27);
    // 버전은 릴리스마다 바뀌므로 하드코딩하지 않고 manifest 선언과 일치하는지 본다.
    expect(getTool("image-to-pdf")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("case-converter")?.category).toBe("text");
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
    expect(searchTools("case converter")[0]?.id).toBe("case-converter");
    expect(searchTools("대소문자")[0]?.id).toBe("case-converter");
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

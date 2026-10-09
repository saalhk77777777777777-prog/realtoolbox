import { describe, it, expect } from "vitest";
import {
  validateSlug,
  processSlug,
  MAX_SLUG_CHARS,
} from "../src/tools/text/slug-generator/processor.ts";
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
import { duplicateManifest } from "../src/tools/text/duplicate-line-remover/manifest.ts";
import { slugManifest } from "../src/tools/text/slug-generator/manifest.ts";

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("slug-generator 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateSlug({ text: "", separator: "-", lowercase: true })?.code).toBe("USER_INPUT");
    expect(validateSlug(null)?.code).toBe("USER_INPUT");
  });

  it("정상 입력 허용", () => {
    expect(validateSlug({ text: "hello", separator: "-", lowercase: true })).toBeNull();
  });

  it("기본 slug 생성", async () => {
    const out = await processSlug({ text: "Hello World", separator: "-", lowercase: true });
    expect(out.slug).toBe("hello-world");
  });

  it("소문자 변환", async () => {
    const out = await processSlug({ text: "HELLO", separator: "-", lowercase: true });
    expect(out.slug).toBe("hello");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("slug-generator 중 — 다양한 입력·경계·예외", () => {
  it("Unicode 정규화", async () => {
    const out = await processSlug({ text: "café", separator: "-", lowercase: true });
    expect(out.slug).toBe("cafe");
  });

  it("연속 공백 → 단일 구분자", async () => {
    const out = await processSlug({ text: "hello   world", separator: "-", lowercase: true });
    expect(out.slug).toBe("hello-world");
  });

  it("앞뒤 공백 trim", async () => {
    const out = await processSlug({ text: "  hello  ", separator: "-", lowercase: true });
    expect(out.slug).toBe("hello");
  });

  it("잘못된 모드 거부", () => {
    expect(validateSlug({ text: "x", separator: "-", lowercase: "yes" } as never)?.code).toBe("USER_INPUT");
  });

  it("초과 입력 거부", () => {
    expect(validateSlug({ text: "a".repeat(MAX_SLUG_CHARS + 1), separator: "-", lowercase: true })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("slug-generator 상 — 복잡한 입력·극단 경계", () => {
  it("특수문자 제거", async () => {
    const out = await processSlug({ text: "hello!@#world", separator: "-", lowercase: true });
    expect(out.slug).toBe("helloworld");
  });

  it("숫자 포함", async () => {
    const out = await processSlug({ text: "hello 123 world", separator: "-", lowercase: true });
    expect(out.slug).toBe("hello-123-world");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("slug-generator 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateSlug({ text: "", separator: "-", lowercase: true })?.code).toBe("USER_INPUT");
    expect(validateSlug({ text: "x", separator: "-", lowercase: "yes" } as never)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateSlug({ text: "hello", separator: "-", lowercase: true })).toBeNull();
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateSlug({ text: "a".repeat(MAX_SLUG_CHARS), separator: "-", lowercase: true })).toBeNull();
  });

  it("구분자 — RegExp 특수문자도 예외 없이 처리", async () => {
    for (const sep of ["\\", ".", "+", "(", "[", "$", "*", "?", "^", "|"]) {
      expect(validateSlug({ text: "hello world", separator: sep, lowercase: true })?.code).toBe("USER_INPUT");
    }
    for (const sep of ["-", "_"]) {
      expect(validateSlug({ text: "hello world", separator: sep, lowercase: true })).toBeNull();
      expect((await processSlug({ text: "hello world", separator: sep, lowercase: true })).slug).toBe(
        `hello${sep}world`,
      );
    }
  });

  it("구분자 — 공백·빈 문자열·2자 이상 거부", () => {
    for (const sep of ["", " ", "  ", "--", "a b"]) {
      expect(validateSlug({ text: "x", separator: sep, lowercase: true })?.code).toBe("USER_INPUT");
    }
  });

  it("구분자 — 입력 필터가 구분자를 제거하지 않음", async () => {
    const out = await processSlug({ text: "a-b_c d", separator: "-", lowercase: true });
    expect(out.slug).toBe("a-b_c-d");
  });

  it("앞뒤 구분자 collapse — 잔여 구분자 없음", async () => {
    const out = await processSlug({ text: "  --hello   world--  ", separator: "-", lowercase: true });
    expect(out.slug).toBe("hello-world");
    expect(out.slug.startsWith("-")).toBe(false);
    expect(out.slug.endsWith("-")).toBe(false);
  });

  it("특수문자만 있는 입력 — 빈 slug 반환 (예외 아님)", async () => {
    const out = await processSlug({ text: "!!!???", separator: "-", lowercase: true });
    expect(out.slug).toBe("");
    expect(out.slugLength).toBe(0);
  });

  it("한글 등 비ASCII 문자 — 제거 후 결과 검증", async () => {
    const out = await processSlug({ text: "안녕하세요 Hello", separator: "-", lowercase: true });
    expect(out.slug).toBe("hello");
    expect(/^[\w-]*$/.test(out.slug)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("slug-generator 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateSlug({ text: 123, separator: "-", lowercase: true } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateSlug(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("slug-generator integration", () => {
  it("Registry 31도구 공존 + 기존 계약 유지", () => {
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
    registerTool(duplicateManifest);
    registerTool(slugManifest);
    expect(listTools()).toHaveLength(31);
    expect(getTool("duplicate-line-remover")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("slug-generator")?.category).toBe("text");
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
    registerTool(duplicateManifest);
    registerTool(slugManifest);
    expect(searchTools("slug")[0]?.id).toBe("slug-generator");
    expect(searchTools("url 생성")[0]?.id).toBe("slug-generator");
    expect(searchTools("duplicate line")[0]?.id).toBe("duplicate-line-remover");
    expect(searchTools("line sorter")[0]?.id).toBe("line-sorter");
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

import { describe, it, expect } from "vitest";
import {
  validateMerge,
  MAX_PDF_BYTES,
  MAX_MERGE_FILES,
} from "../src/tools/pdf/pdf-merge/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("pdf-merge 하 — 기본 정상", () => {
  it("빈 파일 거부", () => {
    expect(validateMerge({ files: [] })?.code).toBe("USER_INPUT");
    expect(validateMerge(null)?.code).toBe("USER_INPUT");
  });

  it("정상 파일 수용", () => {
    expect(validateMerge({ files: [new File(["%PDF-1.4"], "a.pdf")] })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 중: 경계·복잡·예외
// ─────────────────────────────────────────────
describe("pdf-merge 중 — 경계·복잡·예외", () => {
  it("최대 파일 수 초과 거부", () => {
    const files = Array.from({ length: MAX_MERGE_FILES + 1 }, (_, i) => new File(["%PDF-1.4"], `${i}.pdf`));
    expect(validateMerge({ files })?.code).toBe("UNSUPPORTED");
  });

  it("용량 초과 거부", () => {
    const big = new File([new Uint8Array(MAX_PDF_BYTES + 1)], "big.pdf");
    expect(validateMerge({ files: [big] })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력·극단 경계
// ─────────────────────────────────────────────
describe("pdf-merge 상 — 복잡한 입력·극단 경계", () => {
  it("최대 파일 수 수용", () => {
    const files = Array.from({ length: MAX_MERGE_FILES }, (_, i) => new File(["%PDF-1.4"], `${i}.pdf`));
    expect(validateMerge({ files })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("pdf-merge 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateMerge({ files: [] })?.code).toBe("USER_INPUT");
    expect(validateMerge(null)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateMerge({ files: [new File(["%PDF-1.4"], "a.pdf")] })).toBeNull();
  });

  it("경계값 — 10개 파일 수용", () => {
    const files = Array.from({ length: 10 }, (_, i) => new File(["%PDF-1.4"], `${i}.pdf`));
    expect(validateMerge({ files })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("pdf-merge 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateMerge({ files: 123 } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateMerge(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("pdf-merge integration", () => {
  it("Registry 22도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(22);
    expect(getTool("pdf-metadata")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("pdf-merge")?.category).toBe("pdf");
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
    expect(searchTools("pdf merge")[0]?.id).toBe("pdf-merge");
    expect(searchTools("pdf 병합")[0]?.id).toBe("pdf-merge");
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


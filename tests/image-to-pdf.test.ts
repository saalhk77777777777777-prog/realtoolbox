import { describe, it, expect } from "vitest";
import {
  validateImageToPdf,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
} from "../src/tools/pdf/image-to-pdf/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("image-to-pdf 하 — 기본 정상", () => {
  it("빈 파일 거부", () => {
    expect(validateImageToPdf({ files: [], pageSize: "a4", margin: 20 })?.code).toBe("USER_INPUT");
    expect(validateImageToPdf(null)?.code).toBe("USER_INPUT");
  });

  it("정상 파일 수용", () => {
    expect(validateImageToPdf({ files: [new File(["x"], "x.png")], pageSize: "a4", margin: 20 })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 중: 경계·복잡·예외
// ─────────────────────────────────────────────
describe("image-to-pdf 중 — 경계·복잡·예외", () => {
  it("최대 이미지 수 초과 거부", () => {
    const files = Array.from({ length: MAX_IMAGES + 1 }, (_, i) => new File(["x"], `${i}.png`));
    expect(validateImageToPdf({ files, pageSize: "a4", margin: 20 })?.code).toBe("UNSUPPORTED");
  });

  it("잘못된 페이지 크기 거부", () => {
    expect(validateImageToPdf({ files: [new File(["x"], "x.png")], pageSize: "b5", margin: 20 } as never)?.code).toBe("USER_INPUT");
  });

  it("여백 범위 초과 거부", () => {
    expect(validateImageToPdf({ files: [new File(["x"], "x.png")], pageSize: "a4", margin: -1 })?.code).toBe("USER_INPUT");
    expect(validateImageToPdf({ files: [new File(["x"], "x.png")], pageSize: "a4", margin: 101 })?.code).toBe("USER_INPUT");
  });

  it("용량 초과 거부", () => {
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.png");
    expect(validateImageToPdf({ files: [big], pageSize: "a4", margin: 20 })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력·극단 경계
// ─────────────────────────────────────────────
describe("image-to-pdf 상 — 복잡한 입력·극단 경계", () => {
  it("최대 이미지 수 수용", () => {
    const files = Array.from({ length: MAX_IMAGES }, (_, i) => new File(["x"], `${i}.png`));
    expect(validateImageToPdf({ files, pageSize: "a4", margin: 20 })).toBeNull();
  });

  it("모든 페이지 크기 수용", () => {
    for (const pageSize of ["a4", "letter", "image"] as const) {
      expect(validateImageToPdf({ files: [new File(["x"], "x.png")], pageSize, margin: 20 })).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("image-to-pdf 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateImageToPdf({ files: [], pageSize: "a4", margin: 20 })?.code).toBe("USER_INPUT");
    expect(validateImageToPdf({ files: [new File(["x"], "x.png")], pageSize: "b5", margin: 20 } as never)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateImageToPdf({ files: [new File(["x"], "x.png")], pageSize: "a4", margin: 20 })).toBeNull();
  });

  it("경계값 — 20개 이미지 수용", () => {
    const files = Array.from({ length: 20 }, (_, i) => new File(["x"], `${i}.png`));
    expect(validateImageToPdf({ files, pageSize: "a4", margin: 20 })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("image-to-pdf 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateImageToPdf({ files: 123, pageSize: "a4", margin: 20 } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateImageToPdf(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("image-to-pdf integration", () => {
  it("Registry 26도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(26);
    expect(getTool("pdf-to-image")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("image-to-pdf")?.category).toBe("pdf");
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
    expect(searchTools("image to pdf")[0]?.id).toBe("image-to-pdf");
    expect(searchTools("이미지 pdf")[0]?.id).toBe("image-to-pdf");
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


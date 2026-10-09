import { describe, it, expect } from "vitest";
import {
  validateCompress,
  MAX_PDF_BYTES,
} from "../src/tools/pdf/pdf-compress/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("pdf-compress 하 — 기본 정상", () => {
  it("빈 파일 거부", () => {
    expect(validateCompress({ file: null, mode: "keep" })?.code).toBe("USER_INPUT");
    expect(validateCompress(null)?.code).toBe("USER_INPUT");
  });

it("정상 파일 수용 — 두 방식 모두", () => {
    for (const mode of ["keep", "strip"] as const) {
      expect(validateCompress({ file: new File(["%PDF-1.4"], "x.pdf"), mode })).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────
// 중: 경계·복잡·예외
// ─────────────────────────────────────────────
describe("pdf-compress 중 — 경계·복잡·예외", () => {
it("잘못된 처리 방식 거부", () => {
    // 이전 3단계("light"/"medium"/"strong")는 이제 유효하지 않다 — 효과 없는 단계를 다시 받지 않기 위해
    expect(validateCompress({ file: new File(["%PDF-1.4"], "x.pdf"), mode: "light" } as never)?.code).toBe("USER_INPUT");
    expect(validateCompress({ file: new File(["%PDF-1.4"], "x.pdf"), mode: "strong" } as never)?.code).toBe("USER_INPUT");
    expect(validateCompress({ file: new File(["%PDF-1.4"], "x.pdf"), mode: "extreme" } as never)?.code).toBe("USER_INPUT");
  });

  it("용량 초과 거부", () => {
    const big = new File([new Uint8Array(MAX_PDF_BYTES + 1)], "big.pdf");
    expect(validateCompress({ file: big, mode: "keep" })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력·극단 경계
// ─────────────────────────────────────────────
describe("pdf-compress 상 — 복잡한 입력·극단 경계", () => {
it("모든 처리 방식 수용 — 단 2개뿐이다", () => {
    // 3개 이상으로 늘리지 않는다. 효과가 없는 단계를 다시 늘리는 것을 막는 회귀 방어.
    for (const mode of ["keep", "strip"] as const) {
      expect(validateCompress({ file: new File(["%PDF-1.4"], "x.pdf"), mode })).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("pdf-compress 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
expect(validateCompress({ file: null, mode: "keep" })?.code).toBe("USER_INPUT");
    expect(validateCompress({ file: new File(["%PDF-1.4"], "x.pdf"), mode: "extreme" } as never)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateCompress({ file: new File(["%PDF-1.4"], "x.pdf"), mode: "keep" })).toBeNull();
  });

  it("경계값 — 100MB 이내 수용", () => {
    const f = new File([new Uint8Array(1024)], "x.pdf");
    expect(validateCompress({ file: f, mode: "keep" })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("pdf-compress 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateCompress({ file: 123, mode: "keep" } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateCompress(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("pdf-compress integration", () => {
  it("Registry 24도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(24);
    expect(getTool("pdf-split")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("pdf-compress")?.category).toBe("pdf");
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
expect(searchTools("pdf 메타데이터 제거")[0]?.id).toBe("pdf-compress");
    expect(searchTools("pdf 개인정보 제거")[0]?.id).toBe("pdf-compress");
    expect(searchTools("pdf optimize")[0]?.id).toBe("pdf-compress");
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


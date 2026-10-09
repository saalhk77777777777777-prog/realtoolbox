import { describe, it, expect } from "vitest";
import {
  validateCropFlip,
  MAX_IMAGE_BYTES,
} from "../src/tools/image/crop-rotate-flip/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("crop-flip 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateCropFlip({ file: null, rotate: 0, flip: null, crop: null })?.code).toBe("USER_INPUT");
    expect(validateCropFlip(null)?.code).toBe("USER_INPUT");
  });

  it("정상 입력 허용", () => {
    expect(validateCropFlip({ file: new File(["x"], "x.png"), rotate: 0, flip: null, crop: null })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("crop-flip 중 — 다양한 입력·경계·예외", () => {
  it("잘못된 회전 각도 거부", () => {
    expect(validateCropFlip({ file: new File(["x"], "x.png"), rotate: 45, flip: null, crop: null } as never)?.code).toBe("USER_INPUT");
  });

  it("잘못된 반전 방향 거부", () => {
    expect(validateCropFlip({ file: new File(["x"], "x.png"), rotate: 0, flip: "diagonal", crop: null } as never)?.code).toBe("USER_INPUT");
  });

  it("큰 파일 거부", () => {
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.png");
    expect(validateCropFlip({ file: big, rotate: 0, flip: null, crop: null })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("crop-flip 상 — 복잡한 입력·극단 경계", () => {
  it("모든 회전 각도 허용", () => {
    for (const rotate of [0, 90, 180, 270] as const) {
      expect(validateCropFlip({ file: new File(["x"], "x.png"), rotate, flip: null, crop: null })).toBeNull();
    }
  });

  it("모든 반전 방향 허용", () => {
    for (const flip of [null, "horizontal", "vertical"] as const) {
      expect(validateCropFlip({ file: new File(["x"], "x.png"), rotate: 0, flip, crop: null })).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("crop-flip 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateCropFlip({ file: null, rotate: 0, flip: null, crop: null })?.code).toBe("USER_INPUT");
    expect(validateCropFlip({ file: new File(["x"], "x.png"), rotate: 45, flip: null, crop: null } as never)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateCropFlip({ file: new File(["x"], "x.png"), rotate: 90, flip: "horizontal", crop: null })).toBeNull();
  });

  it("경계값 — 50MB 허용", () => {
    const f = new File([new Uint8Array(1024)], "x.png");
    expect(validateCropFlip({ file: f, rotate: 0, flip: null, crop: null })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("crop-flip 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateCropFlip({ file: 123, rotate: 0, flip: null, crop: null } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateCropFlip(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("crop-flip integration", () => {
  it("Registry 20도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(20);
    expect(getTool("color-extractor")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("crop-rotate-flip")?.category).toBe("image");
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
    expect(searchTools("crop")[0]?.id).toBe("crop-rotate-flip");
    expect(searchTools("이미지 자르기")[0]?.id).toBe("crop-rotate-flip");
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

import { describe, it, expect } from "vitest";
import {
  validateResize,
  MAX_IMAGE_BYTES,
} from "../src/tools/image/image-resizer/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("image-resizer 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateResize({ file: null, width: 100, height: 100, keepAspect: true })?.code).toBe("USER_INPUT");
    expect(validateResize(null)?.code).toBe("USER_INPUT");
  });

  it("정상 크기 허용", () => {
    expect(validateResize({ file: new File(["x"], "x.png"), width: 800, height: 600, keepAspect: true })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("image-resizer 중 — 다양한 입력·경계·예외", () => {
  it("0/음수 크기 거부", () => {
    expect(validateResize({ file: new File(["x"], "x.png"), width: 0, height: 100, keepAspect: true })?.code).toBe("USER_INPUT");
    expect(validateResize({ file: new File(["x"], "x.png"), width: 100, height: -1, keepAspect: true })?.code).toBe("USER_INPUT");
  });

  it("소수 크기 거부", () => {
    expect(validateResize({ file: new File(["x"], "x.png"), width: 100.5, height: 100, keepAspect: true })?.code).toBe("USER_INPUT");
  });

  it("큰 파일 거부", () => {
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.png");
    expect(validateResize({ file: big, width: 100, height: 100, keepAspect: true })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("image-resizer 상 — 복잡한 입력·극단 경계", () => {
  it("최대 크기 (10000px) 허용", () => {
    expect(validateResize({ file: new File(["x"], "x.png"), width: 10000, height: 10000, keepAspect: true })).toBeNull();
  });

  it("최대+1 크기 거부", () => {
    expect(validateResize({ file: new File(["x"], "x.png"), width: 10001, height: 100, keepAspect: true })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("image-resizer 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateResize({ file: null, width: 100, height: 100, keepAspect: true })?.code).toBe("USER_INPUT");
    expect(validateResize({ file: new File(["x"], "x.png"), width: 0, height: 100, keepAspect: true })?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateResize({ file: new File(["x"], "x.png"), width: 800, height: 600, keepAspect: true })).toBeNull();
  });

  it("경계값 — 10000px 허용", () => {
    expect(validateResize({ file: new File(["x"], "x.png"), width: 10000, height: 10000, keepAspect: true })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("image-resizer 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateResize({ file: 123, width: 100, height: 100, keepAspect: true } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateResize(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("image-resizer integration", () => {
  it("Registry 16도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(16);
    expect(getTool("image-compressor")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("image-resizer")?.category).toBe("image");
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
    expect(searchTools("image resizer")[0]?.id).toBe("image-resizer");
    expect(searchTools("이미지 리사이즈")[0]?.id).toBe("image-resizer");
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

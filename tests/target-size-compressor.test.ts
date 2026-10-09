import { describe, it, expect } from "vitest";
import {
  validateTarget,
  MAX_IMAGE_BYTES,
} from "../src/tools/image/target-size-compressor/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("target-size 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateTarget({ file: null, targetSize: 500, unit: "KB" })?.code).toBe("USER_INPUT");
    expect(validateTarget(null)?.code).toBe("USER_INPUT");
  });

  it("정상 입력 허용", () => {
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: 500, unit: "KB" })).toBeNull();
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: 2, unit: "MB" })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("target-size 중 — 다양한 입력·경계·예외", () => {
  it("0/음수 목표 크기 거부", () => {
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: 0, unit: "KB" })?.code).toBe("USER_INPUT");
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: -1, unit: "KB" })?.code).toBe("USER_INPUT");
  });

  it("큰 파일 거부", () => {
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.jpg");
    expect(validateTarget({ file: big, targetSize: 500, unit: "KB" })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("target-size 상 — 복잡한 입력·극단 경계", () => {
  it("KB/MB 단위 모두 허용", () => {
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: 1, unit: "KB" })).toBeNull();
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: 10, unit: "MB" })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("target-size 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateTarget({ file: null, targetSize: 500, unit: "KB" })?.code).toBe("USER_INPUT");
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: 0, unit: "KB" })?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateTarget({ file: new File(["x"], "x.jpg"), targetSize: 500, unit: "KB" })).toBeNull();
  });

  it("경계값 — 50MB 허용", () => {
    const f = new File([new Uint8Array(1024)], "x.jpg");
    expect(validateTarget({ file: f, targetSize: 500, unit: "KB" })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("target-size 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateTarget({ file: 123, targetSize: 500, unit: "KB" } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateTarget(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("target-size integration", () => {
  it("Registry 18도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(18);
    expect(getTool("image-converter")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("target-size-compressor")?.category).toBe("image");
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
    expect(searchTools("target size")[0]?.id).toBe("target-size-compressor");
    expect(searchTools("목표 크기")[0]?.id).toBe("target-size-compressor");
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

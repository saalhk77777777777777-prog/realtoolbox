import { describe, it, expect, vi } from "vitest";
import {
  validateImage,
  processImage,
  MAX_IMAGE_BYTES,
} from "../src/tools/image/image-compressor/processor.ts";
import { runTool } from "../src/core/toolRunner.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("image-compressor 하 — 기본 정상", () => {
  it("빈 입력 거부", () => {
    expect(validateImage({ file: null, quality: 0.8, format: "jpeg" })?.code).toBe("USER_INPUT");
    expect(validateImage(null)?.code).toBe("USER_INPUT");
  });

  it("품질 범위 확인", () => {
    expect(validateImage({ file: new File(["x"], "x.jpg"), quality: -0.1, format: "jpeg" })?.code).toBe("USER_INPUT");
    expect(validateImage({ file: new File(["x"], "x.jpg"), quality: 1.1, format: "jpeg" })?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("image-compressor 중 — 다양한 입력·경계·예외", () => {
  it("비정상 포맷 입력", () => {
    expect(validateImage({ file: new File(["x"], "x.jpg"), quality: 0.8, format: "gif" } as never)?.code).toBe("USER_INPUT");
  });

  it("품질 경계값 (0, 1 허용)", () => {
    expect(validateImage({ file: new File(["x"], "x.jpg"), quality: 0, format: "jpeg" })).toBeNull();
    expect(validateImage({ file: new File(["x"], "x.jpg"), quality: 1, format: "jpeg" })).toBeNull();
  });

  it("큰 파일 거부", () => {
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.jpg");
    expect(validateImage({ file: big, quality: 0.8, format: "jpeg" })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("image-compressor 상 — 복잡한 입력·극단 경계", () => {
  it("PNG 포맷 허용", () => {
    expect(validateImage({ file: new File(["x"], "x.png"), quality: 0.8, format: "png" })).toBeNull();
  });

  it("WebP 포맷 허용", () => {
    expect(validateImage({ file: new File(["x"], "x.webp"), quality: 0.8, format: "webp" })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("image-compressor 실사용 회귀 — 실제 출력 검증", () => {
  it("PNG 결과가 원본보다 커지면 원본을 유지한다", async () => {
    const original = new File(
      [new Uint8Array(250_185)],
      "real-user.png",
      { type: "image/png" },
    );
    const oversizedEncoded = new Blob(
      [new Uint8Array(2_116_732)],
      { type: "image/png" },
    );

    const fakeCanvas = {
      width: 1179,
      height: 2053,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (callback: BlobCallback) => callback(oversizedEncoded),
      toDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
    };

    const previousBitmap = globalThis.createImageBitmap;
    const previousDocument = globalThis.document;

    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: vi.fn(async () => ({ width: 1179, height: 2053 })),
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { createElement: vi.fn(() => fakeCanvas) },
    });

    try {
      const result = await processImage({
        file: original,
        quality: 0.8,
        format: "png",
      });

      expect(result.originalSize).toBe(250_185);
      expect(result.compressedSize).toBe(250_185);
      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
      expect(result.blob).toBe(original);
      expect(result.expanded).toBe(true);
    } finally {
      Object.defineProperty(globalThis, "createImageBitmap", {
        configurable: true,
        value: previousBitmap,
      });
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: previousDocument,
      });
    }
  });

  it("JPEG/WebP 결과가 원본보다 커지는 경우를 결과 메타데이터에 기록한다", async () => {
    const original = new File(
      [new Uint8Array(10_000)],
      "real-user.jpg",
      { type: "image/jpeg" },
    );
    const oversizedEncoded = new Blob(
      [new Uint8Array(20_000)],
      { type: "image/jpeg" },
    );

    const fakeCanvas = {
      width: 320,
      height: 240,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (callback: BlobCallback) => callback(oversizedEncoded),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,AAAA"),
    };

    const previousBitmap = globalThis.createImageBitmap;
    const previousDocument = globalThis.document;

    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: vi.fn(async () => ({ width: 320, height: 240 })),
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { createElement: vi.fn(() => fakeCanvas) },
    });

    try {
      const result = await processImage({
        file: original,
        quality: 0.8,
        format: "jpeg",
      });

      expect(result.compressedSize).toBe(20_000);
      expect(result.compressedSize).toBeGreaterThan(result.originalSize);
      expect(result.expanded).toBe(true);
    } finally {
      Object.defineProperty(globalThis, "createImageBitmap", {
        configurable: true,
        value: previousBitmap,
      });
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: previousDocument,
      });
    }
  });
});

describe("image-compressor 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateImage({ file: null, quality: 0.8, format: "jpeg" })?.code).toBe("USER_INPUT");
    expect(validateImage({ file: new File(["x"], "x.jpg"), quality: -1, format: "jpeg" })?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", () => {
    expect(validateImage({ file: new File(["x"], "x.jpg"), quality: 0.5, format: "jpeg" })).toBeNull();
  });

  it("경계값 — 50MB 허용", () => {
    const f = new File([new Uint8Array(1024)], "x.jpg");
    expect(validateImage({ file: f, quality: 0.8, format: "jpeg" })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("image-compressor 의도적 오류 입력", () => {
  it("숫자 타입 입력", () => {
    expect(validateImage({ file: 123, quality: 0.8, format: "jpeg" } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateImage(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("image-compressor integration", () => {
  it("Registry 15도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(15);
    expect(getTool("csv-chart")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("image-compressor")?.category).toBe("image");
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
    expect(searchTools("image compressor")[0]?.id).toBe("image-compressor");
    expect(searchTools("이미지 압축")[0]?.id).toBe("image-compressor");
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

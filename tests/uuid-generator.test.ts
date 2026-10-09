import { describe, it, expect, vi, afterEach } from "vitest";
import {
  validateUuid,
  processUuid,
  generateV4,
  generateV7,
  SUPPORTED_VERSIONS,
  MAX_UUID_COUNT,
} from "../src/tools/developer/uuid-generator/processor.ts";
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

afterEach(() => {
  vi.unstubAllGlobals();
});

function assertCanonical(u: string, version: "4" | "7"): void {
  expect(u).toHaveLength(36);
  expect(u[8]).toBe("-");
  expect(u[13]).toBe("-");
  expect(u[18]).toBe("-");
  expect(u[23]).toBe("-");
  expect(u.replace(/-/g, "")).toMatch(/^[0-9a-f]{32}$/);
  expect(u[14]).toBe(version);
  expect("89ab").toContain(u[19]!);
}

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("uuid 하 — 기본 정상", () => {
  it("v4 1개 생성 + 구조 전체 검증", async () => {
    const out = await processUuid({ version: "v4", count: 1 });
    expect(out.count).toBe(1);
    expect(out.version).toBe("v4");
    assertCanonical(out.uuids[0]!, "4");
  });

  it("v4 여러 개 생성 + 전부 고유", async () => {
    const out = await processUuid({ version: "v4", count: 50 });
    expect(new Set(out.uuids).size).toBe(50);
    for (const u of out.uuids) assertCanonical(u, "4");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("uuid 중 — 다양한 입력·경계·예외", () => {
  it("v7 구조 + 시간 필드 ≈ now", async () => {
    const before = Date.now();
    const out = await processUuid({ version: "v7", count: 1 });
    const after = Date.now();
    const u = out.uuids[0]!;
    assertCanonical(u, "7");
    const timeMs = Number.parseInt(u.slice(0, 8) + u.slice(9, 13), 16);
    expect(timeMs).toBeGreaterThanOrEqual(before);
    expect(timeMs).toBeLessThanOrEqual(after);
  });

  it("v7 결정적 time 주입으로 필드 정확도", () => {
    const u = generateV7(0x0123456789ab);
    expect(u.slice(0, 8)).toBe("01234567");
    expect(u.slice(9, 13)).toBe("89ab");
    expect(u[14]).toBe("7");
  });

  it("count 0·음수·소수·비정상 거부", () => {
    for (const count of [0, -1, 1.5, Number.NaN, Number("x")]) {
      expect(validateUuid({ version: "v4", count })?.code).toBe("USER_INPUT");
    }
  });

  it("최대 개수 초과 거부, 경계 100 허용", async () => {
    expect(validateUuid({ version: "v4", count: MAX_UUID_COUNT + 1 })?.code).toBe("USER_INPUT");
    expect(validateUuid({ version: "v4", count: MAX_UUID_COUNT })).toBeNull();
    expect((await processUuid({ version: "v4", count: MAX_UUID_COUNT })).uuids).toHaveLength(
      MAX_UUID_COUNT,
    );
  });

  it("미지원 version 거부 (v1·NIL 등 억지 구현 없음)", () => {
    for (const version of ["v1", "v3", "v5", "nil", "random"]) {
      expect(validateUuid({ version, count: 1 })?.code).toBe("UNSUPPORTED");
    }
    expect(SUPPORTED_VERSIONS).toEqual(["v4", "v7"]);
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("uuid 상 — 복잡한 입력·극단 경계", () => {
  it("v7 여러 개 생성 + 고유", async () => {
    const out = await processUuid({ version: "v7", count: 20 });
    expect(new Set(out.uuids).size).toBe(20);
  });

  it("randomUUID 부재 시에도 CSPRNG fallback으로 유효한 v4", () => {
    const c = globalThis.crypto as Crypto & { randomUUID?: () => string };
    vi.stubGlobal("crypto", { ...c, randomUUID: undefined, getRandomValues: c.getRandomValues.bind(c) });
    assertCanonical(generateV4(), "4");
  });

  it("crypto 부재 시 BROWSER_LIMIT (Math.random 대체 없음)", () => {
    vi.stubGlobal("crypto", undefined);
    const codes: string[] = [];
    for (const fn of [() => generateV4(), () => generateV7(1)]) {
      try {
        fn();
        codes.push("no-throw");
      } catch (e) {
        codes.push((e as { code?: string }).code ?? "?");
      }
    }
    expect(codes).toEqual(["BROWSER_LIMIT", "BROWSER_LIMIT"]);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("uuid 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 잘못된 입력이 정상으로 통과하지 않음", () => {
    for (const count of [0, -1, 1.5, Number.NaN]) {
      expect(validateUuid({ version: "v4", count })?.code).toBe("USER_INPUT");
    }
    for (const version of ["v1", "v3", "v5", "nil"]) {
      expect(validateUuid({ version, count: 1 })?.code).toBe("UNSUPPORTED");
    }
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    expect(validateUuid({ version: "v4", count: 1 })).toBeNull();
    expect(validateUuid({ version: "v7", count: 100 })).toBeNull();
  });

  it("경계값 — 100개 허용", async () => {
    const out = await processUuid({ version: "v4", count: 100 });
    expect(out.uuids).toHaveLength(100);
  });

  it("경계값 — 101개 거부", () => {
    expect(validateUuid({ version: "v4", count: 101 })?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("uuid 의도적 오류 입력", () => {
  it("비정상 버전 문자열", () => {
    expect(validateUuid({ version: "v1", count: 1 })?.code).toBe("UNSUPPORTED");
    expect(validateUuid({ version: "", count: 1 })?.code).toBe("UNSUPPORTED");
  });

  it("숫자 타입 입력", () => {
    expect(validateUuid({ version: "v4", count: "1" } as never)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("uuid integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(uuidManifest, { version: "v4", count: 2 });
    expect(res.ok).toBe(true);
    const out = res.output as Awaited<ReturnType<typeof processUuid>>;
    expect(out.uuids).toHaveLength(2);
    assertCanonical(out.uuids[0]!, "4");
  });

  it("Runner 실패 전파 (v1)", async () => {
    const res = await runTool(uuidManifest, { version: "v1", count: 1 });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("UNSUPPORTED");
  });

  it("Registry 8도구 공존 + 기존 계약 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    registerTool(hashManifest);
    registerTool(jsonManifest);
    registerTool(uuidManifest);
    expect(listTools()).toHaveLength(8);
    expect(getTool("json-formatter")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("uuid-generator")?.category).toBe("developer");
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
    expect(searchTools("uuid")[0]?.id).toBe("uuid-generator");
    expect(searchTools("uuid 생성")[0]?.id).toBe("uuid-generator");
    expect(searchTools("json")[0]?.id).toBe("json-formatter");
    expect(searchTools("hash")[0]?.id).toBe("hash-generator");
    expect(searchTools("timestamp")[0]?.id).toBe("timestamp-converter");
    expect(searchTools("base64")[0]?.id).toBe("base64");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
  });
});

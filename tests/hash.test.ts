import { describe, it, expect } from "vitest";
import {
  validateHash,
  processHash,
  SUPPORTED_ALGORITHMS,
  MAX_HASH_CHARS,
} from "../src/tools/developer/hash-generator/processor.ts";
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

const H = (text: string, algorithm: "SHA-256" | "SHA-384" | "SHA-512" | "SHA-1" = "SHA-256") =>
  processHash({ text, algorithm });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("hash 하 — 기본 정상", () => {
  it('SHA-256("abc")', async () => {
    expect((await H("abc")).hex).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("SHA-256 출력 길이 64", async () => {
    expect((await H("hello")).hexLength).toBe(64);
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("hash 중 — 다양한 입력·경계·예외", () => {
  it('SHA-384("abc")', async () => {
    expect((await processHash({ text: "abc", algorithm: "SHA-384" })).hex).toBe(
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
    );
  });

  it('SHA-512("abc")', async () => {
    expect((await processHash({ text: "abc", algorithm: "SHA-512" })).hex).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    );
  });

  it('SHA-1("abc") + weakWarning', async () => {
    const out = await processHash({ text: "abc", algorithm: "SHA-1" });
    expect(out.hex).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(out.weakWarning).toBe(true);
  });

  it("빈 입력 거부", () => {
    expect(validateHash({ text: "", algorithm: "SHA-256" })?.code).toBe("USER_INPUT");
    expect(validateHash(null)?.code).toBe("USER_INPUT");
  });

  it("MD5 등 미지원 알고리즘 명시적 거부", () => {
    expect(validateHash({ text: "x", algorithm: "MD5" })?.code).toBe("UNSUPPORTED");
    expect(validateHash({ text: "x", algorithm: "SHA-999" })?.code).toBe("UNSUPPORTED");
    expect(SUPPORTED_ALGORITHMS).toEqual(["SHA-256", "SHA-384", "SHA-512", "SHA-1"]);
  });

  it("초과 입력 거부", () => {
    expect(
      validateHash({ text: "a".repeat(MAX_HASH_CHARS + 1), algorithm: "SHA-256" })?.code,
    ).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("hash 상 — 복잡한 입력·극단 경계", () => {
  it("한글·이모지·특수문자 결정성", async () => {
    for (const t of ["한글 테스트", "🎉🚀", "a&b=c?d#e+f% \t\n", "Mixed 한🎉z"]) {
      const a = await H(t);
      const b = await H(t);
      expect(a.hex).toBe(b.hex);
      expect(a.hex).toMatch(/^[0-9a-f]{64}$/);
    }
    expect((await H("한")).hex).not.toBe((await H("a")).hex);
  });

  it("긴 입력 100k자 (단일 패스)", async () => {
    const long = "한a🎉".repeat(25000);
    const out = await H(long);
    expect(out.hexLength).toBe(64);
    expect(out.inputBytes).toBe(new TextEncoder().encode(long).length);
  });

  it("알고리즘별 출력 길이", async () => {
    expect((await H("x", "SHA-256")).hexLength).toBe(64);
    expect((await H("x", "SHA-384")).hexLength).toBe(96);
    expect((await H("x", "SHA-512")).hexLength).toBe(128);
    expect((await H("x", "SHA-1")).hexLength).toBe(40);
  });

  it("대문자 표시는 값 동일 (정본=소문자)", async () => {
    const out = await H("hello");
    expect(out.hex.toUpperCase()).toMatch(/^[0-9A-F]{64}$/);
    expect(out.hex).toBe(out.hex.toLowerCase());
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("hash 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 빈 입력이 정상으로 통과하지 않음", () => {
    expect(validateHash({ text: "", algorithm: "SHA-256" })?.code).toBe("USER_INPUT");
    expect(validateHash(null)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    expect(validateHash({ text: "hello", algorithm: "SHA-256" })).toBeNull();
  });

  it("경계값 — 100만자 허용", () => {
    expect(
      validateHash({ text: "a".repeat(MAX_HASH_CHARS), algorithm: "SHA-256" }),
    ).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(
      validateHash({ text: "a".repeat(MAX_HASH_CHARS + 1), algorithm: "SHA-256" })?.code,
    ).toBe("UNSUPPORTED");
  });

  it("SHA-1 weakWarning 플래그", async () => {
    expect((await H("x", "SHA-1")).weakWarning).toBe(true);
    expect((await H("x", "SHA-256")).weakWarning).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("hash 의도적 오류 입력", () => {
  it("비정상 알고리즘 문자열", () => {
    expect(validateHash({ text: "x", algorithm: "MD5" })?.code).toBe("UNSUPPORTED");
    expect(validateHash({ text: "x", algorithm: "" })?.code).toBe("UNSUPPORTED");
  });

  it("숫자 타입 입력", () => {
    expect(validateHash({ text: 123, algorithm: "SHA-256" } as never)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("hash integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(hashManifest, { text: "abc", algorithm: "SHA-256" });
    expect(res.ok).toBe(true);
    expect((res.output as Awaited<ReturnType<typeof processHash>>).hex).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("Runner 실패 전파 (MD5)", async () => {
    const res = await runTool(hashManifest, { text: "abc", algorithm: "MD5" });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("UNSUPPORTED");
  });

  it("Registry 6도구 공존 + 기존 계약 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    registerTool(hashManifest);
    expect(listTools()).toHaveLength(6);
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getTool("text-counter")?.version).toBe("0.13.3");
    expect(getTool("base64")?.version).toBe("0.13.3");
    expect(getTool("url-encoder")?.version).toBe("0.13.3");
    expect(getTool("timestamp-converter")?.version).toBe("0.13.3");
    expect(getToolBySlug("hash-generator")?.category).toBe("developer");
  });

  it("Search 발견 + 기존 의도 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    registerTool(hashManifest);
    expect(searchTools("hash")[0]?.id).toBe("hash-generator");
    expect(searchTools("sha256")[0]?.id).toBe("hash-generator");
    expect(searchTools("해시")[0]?.id).toBe("hash-generator");
    expect(searchTools("base64")[0]?.id).toBe("base64");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
  });
});

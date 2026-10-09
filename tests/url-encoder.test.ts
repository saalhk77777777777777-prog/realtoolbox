import { describe, it, expect } from "vitest";
import {
  validateUrlCoder,
  processUrlCoder,
  MAX_URL_CHARS,
} from "../src/tools/developer/url-encoder/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("url-encoder 하 — 기본 정상", () => {
  it("공백·예약문자 이스케이프", async () => {
    const out = await processUrlCoder({ text: "a b&c=d?e#f+g%h", mode: "encode", scope: "component" });
    expect(out.api).toBe("encodeURIComponent");
    expect(out.output).toBe("a%20b%26c%3Dd%3Fe%23f%2Bg%25h");
  });

  it("한글 UTF-8", async () => {
    const out = await processUrlCoder({ text: "한글", mode: "encode", scope: "component" });
    expect(out.output).toBe("%ED%95%9C%EA%B8%80");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("url-encoder 중 — 다양한 입력·경계·예외", () => {
  it("scope 차이: 동일 입력, 다른 결과", async () => {
    const input = "a/b?x=1&y=한 글";
    const comp = await processUrlCoder({ text: input, mode: "encode", scope: "component" });
    const full = await processUrlCoder({ text: input, mode: "encode", scope: "fullUrl" });
    expect(full.api).toBe("encodeURI");
    expect(comp.output).toBe("a%2Fb%3Fx%3D1%26y%3D%ED%95%9C%20%EA%B8%80");
    expect(full.output).toBe("a/b?x=1&y=%ED%95%9C%20%EA%B8%80");
    expect(comp.output).not.toBe(full.output);
  });

  it("fullUrl 결과도 decodeURIComponent로 왕복", async () => {
    const enc = await processUrlCoder({
      text: "https://ex.com/a b?x=1",
      mode: "encode",
      scope: "fullUrl",
    });
    const dec = await processUrlCoder({ text: enc.output, mode: "decode", scope: "fullUrl" });
    expect(dec.api).toBe("decodeURIComponent");
    expect(dec.output).toBe("https://ex.com/a b?x=1");
  });

  it("+는 공백이 아니다 (form-encoding 아님)", async () => {
    const out = await processUrlCoder({ text: "a+b", mode: "decode", scope: "component" });
    expect(out.output).toBe("a+b");
  });

  it("빈 입력 거부", () => {
    expect(validateUrlCoder({ text: "", mode: "encode", scope: "component" })?.code).toBe("USER_INPUT");
    expect(validateUrlCoder(null)?.code).toBe("USER_INPUT");
    expect(validateUrlCoder({ text: "x", mode: "encode", scope: "bogus" })?.code).toBe("USER_INPUT");
  });

  it("깨진 percent-encoding 거부 (원문 반환 없음)", async () => {
    for (const bad of ["%", "abc%", "%2G", "100%", "%41%4"]) {
      expect(validateUrlCoder({ text: bad, mode: "decode", scope: "component" })).toBeNull();
      await expect(
        processUrlCoder({ text: bad, mode: "decode", scope: "component" }),
      ).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("초과 입력 거부 + 긴 입력 round-trip", async () => {
    expect(
      validateUrlCoder({ text: "a".repeat(MAX_URL_CHARS + 1), mode: "encode", scope: "component" })?.code,
    ).toBe("UNSUPPORTED");
    const long = "한?&=#".repeat(20000);
    const enc = await processUrlCoder({ text: long, mode: "encode", scope: "component" });
    const dec = await processUrlCoder({ text: enc.output, mode: "decode", scope: "component" });
    expect(dec.output).toBe(long);
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("url-encoder 상 — 복잡한 입력·극단 경계", () => {
  it("전체 URL 구조 유지", async () => {
    const out = await processUrlCoder({
      text: "https://ex.com/한 글?x=1&y=2#frag",
      mode: "encode",
      scope: "fullUrl",
    });
    expect(out.output).toBe("https://ex.com/%ED%95%9C%20%EA%B8%80?x=1&y=2#frag");
  });

  it("특수문자 조합", async () => {
    const out = await processUrlCoder({
      text: "a@b#c$d&e=f+g",
      mode: "encode",
      scope: "component",
    });
    expect(out.output).toBe("a%40b%23c%24d%26e%3Df%2Bg");
  });

  it("이모지 포함", async () => {
    const out = await processUrlCoder({ text: "🎉🚀", mode: "encode", scope: "component" });
    expect(out.output).toBe("%F0%9F%8E%89%F0%9F%9A%80");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("url-encoder 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", async () => {
    for (const bad of ["%", "abc%", "%2G", "100%", "%41%4"]) {
      await expect(
        processUrlCoder({ text: bad, mode: "decode", scope: "component" }),
      ).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    for (const good of ["hello", "a b", "한글", "🎉"]) {
      const out = await processUrlCoder({ text: good, mode: "encode", scope: "component" });
      expect(out.output).toBeDefined();
    }
  });

  it("경계값 — 100만자 허용", () => {
    expect(
      validateUrlCoder({ text: "a".repeat(MAX_URL_CHARS), mode: "encode", scope: "component" }),
    ).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(
      validateUrlCoder({ text: "a".repeat(MAX_URL_CHARS + 1), mode: "encode", scope: "component" })?.code,
    ).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("url-encoder 의도적 오류 입력", () => {
  it("비정상 scope 입력", () => {
    expect(validateUrlCoder({ text: "x", mode: "encode", scope: "bogus" })?.code).toBe("USER_INPUT");
  });

  it("숫자 타입 입력", () => {
    expect(validateUrlCoder({ text: 123, mode: "encode", scope: "component" } as never)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("url-encoder integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(urlCoderManifest, { text: "a b", mode: "encode", scope: "component" });
    expect(res.ok).toBe(true);
    expect((res.output as Awaited<ReturnType<typeof processUrlCoder>>).output).toBe("a%20b");
  });

  it("Runner 실패 전파 (깨진 입력)", async () => {
    const res = await runTool(urlCoderManifest, { text: "%", mode: "decode", scope: "component" });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
  });

  it("Registry 5도구 공존 + 기존 계약 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    expect(listTools()).toHaveLength(4);
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getTool("text-counter")?.version).toBe("0.13.3");
    expect(getTool("base64")?.version).toBe("0.13.3");
    expect(getToolBySlug("url-encoder")?.category).toBe("developer");
  });

  it("Search 발견 + 기존 의도 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    expect(searchTools("url")[0]?.id).toBe("url-encoder");
    expect(searchTools("url 인코딩")[0]?.id).toBe("url-encoder");
    expect(searchTools("base64")[0]?.id).toBe("base64");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
  });
});

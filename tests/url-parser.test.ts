import { describe, it, expect } from "vitest";
import {
  validateUrlParser,
  processUrlParser,
  MAX_URL_CHARS,
} from "../src/tools/developer/url-parser/processor.ts";
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

const P = (text: string) => processUrlParser({ text });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("url-parser 하 — 기본 정상", () => {
  it("기본 HTTPS URL 전체 필드", async () => {
    const out = await P("https://example.com/path?foo=bar#section");
    expect(out.valid).toBe(true);
    expect(out.protocol).toBe("https:");
    expect(out.hostname).toBe("example.com");
    expect(out.host).toBe("example.com");
    expect(out.port).toBe("");
    expect(out.pathname).toBe("/path");
    expect(out.search).toBe("?foo=bar");
    expect(out.hash).toBe("#section");
    expect(out.origin).toBe("https://example.com");
    expect(out.href).toBe("https://example.com/path?foo=bar#section");
    expect(out.searchParams).toEqual([{ key: "foo", value: "bar" }]);
  });

  it("HTTP + 명시 포트", async () => {
    const out = await P("http://ex.com:8080/a");
    expect(out.port).toBe("8080");
    expect(out.origin).toBe("http://ex.com:8080");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("url-parser 중 — 다양한 입력·경계·예외", () => {
  it("기본 포트 정규화 (443 생략)", async () => {
    const out = await P("https://example.com:443/a");
    expect(out.port).toBe("");
    expect(out.href).toBe("https://example.com/a");
    expect(out.input).toBe("https://example.com:443/a");
  });

  it("credentials: username 포함, password 마스킹 (원값 미포함)", async () => {
    const out = await P("https://user:password@example.com/");
    expect(out.username).toBe("user");
    expect(out.passwordMasked).toBe("••••••");
    expect(out.hasCredentials).toBe(true);
    expect("password" in out).toBe(false);
    const { input, href, ...fields } = out;
    expect(input).toBe("https://user:password@example.com/");
    expect(href).toBe("https://user:password@example.com/");
    expect(Object.keys(fields)).toContain("passwordMasked");
    expect(fields.passwordMasked).toBe("••••••");
    expect(JSON.stringify(fields)).not.toContain("user:password@");
  });

  it("percent-encoding 임의 변환 없음", async () => {
    const out = await P("https://ex.com/a%20b");
    expect(out.pathname).toBe("/a%20b");
  });

  it("Unicode URL (punycode + canonicalization 문서화)", async () => {
    const out = await P("https://한글.kr/한");
    expect(out.hostname).toBe("xn--bj0bj06e.kr");
    expect(out.href).toBe("https://xn--bj0bj06e.kr/%ED%95%9C");
    expect(out.input).toBe("https://한글.kr/한");
  });

  it("반복 query key 순서 보존", async () => {
    const out = await P("https://ex.com/?name=tavi&lang=ko&lang=en");
    expect(out.searchParams).toEqual([
      { key: "name", value: "tavi" },
      { key: "lang", value: "ko" },
      { key: "lang", value: "en" },
    ]);
  });

  it("빈 query 값 보존", async () => {
    const out = await P("https://ex.com/?foo=&bar");
    expect(out.searchParams).toEqual([
      { key: "foo", value: "" },
      { key: "bar", value: "" },
    ]);
  });

  it("특수문자 hash", async () => {
    expect((await P("https://ex.com/#a?b&c")).hash).toBe("#a?b&c");
  });

  it("앞뒤 공백 trim", async () => {
    const out = await P("  https://ex.com/  ");
    expect(out.input).toBe("https://ex.com/");
    expect(out.href).toBe("https://ex.com/");
  });

  it("빈 입력", () => {
    expect(validateUrlParser({ text: "" })?.code).toBe("USER_INPUT");
    expect(validateUrlParser({ text: "   " })?.code).toBe("USER_INPUT");
    expect(validateUrlParser(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("url-parser 상 — 복잡한 입력·극단 경계", () => {
  it("긴 URL (9999자)", async () => {
    const long = `https://ex.com/${"a".repeat(9999)}`;
    const out = await P(long);
    expect(out.valid).toBe(true);
    expect(out.pathname.length).toBeGreaterThan(9999);
  });

  it("많은 query 파라미터 (100개)", async () => {
    const params = Array.from({ length: 100 }, (_, i) => `k${i}=v${i}`).join("&");
    const out = await P(`https://ex.com/?${params}`);
    expect(out.searchParams).toHaveLength(100);
  });

  it("IPv6 주소", async () => {
    const out = await P("http://[::1]:3000/");
    expect(out.hostname).toBe("[::1]");
    expect(out.port).toBe("3000");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("url-parser 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 URL이 정상으로 통과하지 않음", async () => {
    for (const bad of ["not a url", "https://", "/path", "../foo", "//example.com/path"]) {
      await expect(P(bad)).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("False Negative 방지 — 정상 URL이 오류로 판정되지 않음", async () => {
    for (const good of ["https://ex.com/", "http://ex.com:8080/path", "https://ex.com/?a=1"]) {
      const out = await P(good);
      expect(out.valid).toBe(true);
    }
  });

  it("실행 scheme 거부 (대소문자 무시)", async () => {
    await expect(P("javascript:alert(1)")).rejects.toMatchObject({ code: "UNSUPPORTED" });
    await expect(P("JaVaScRiPt:alert(1)")).rejects.toMatchObject({ code: "UNSUPPORTED" });
    await expect(P("data:text/plain,hi")).rejects.toMatchObject({ code: "UNSUPPORTED" });
  });

  it("경계값 — 1만자 허용", () => {
    const long = `https://ex.com/${"a".repeat(MAX_URL_CHARS - 20)}`;
    expect(validateUrlParser({ text: long })).toBeNull();
  });

  it("경계값 — 1만+1자 거부", () => {
    const long = `https://ex.com/${"a".repeat(MAX_URL_CHARS)}`;
    expect(validateUrlParser({ text: long })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("url-parser 의도적 오류 입력", () => {
  it("비정상 타입 입력", () => {
    expect(validateUrlParser({ text: 123 } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateUrlParser(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("url-parser integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(urlParserManifest, { text: "https://example.com/x?y=1" });
    expect(res.ok).toBe(true);
    const out = res.output as Awaited<ReturnType<typeof processUrlParser>>;
    expect(out.hostname).toBe("example.com");
    expect(out.searchParams).toEqual([{ key: "y", value: "1" }]);
  });

  it("Runner 실패 전파 + 해결 메시지", async () => {
    const res = await runTool(urlParserManifest, { text: "/relative" });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
    expect(res.error?.how).toContain("전체 주소");
  });

  it("Registry 10도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(10);
    expect(getTool("html-entity")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("url-parser")?.category).toBe("developer");
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
    expect(searchTools("url parser")[0]?.id).toBe("url-parser");
    expect(searchTools("쿼리 파라미터")[0]?.id).toBe("url-parser");
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

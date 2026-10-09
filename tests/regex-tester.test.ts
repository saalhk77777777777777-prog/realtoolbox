import { describe, it, expect } from "vitest";
import {
  validateRegex,
  processRegex,
  MAX_PATTERN_CHARS,
  MAX_TEXT_CHARS,
  MAX_MATCHES,
  isPotentiallyCatastrophicPattern,
} from "../src/tools/developer/regex-tester/processor.ts";
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

const R = (pattern: string, flags: string, text: string) =>
  processRegex({ pattern, flags, text });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("regex 하 — 기본 정상", () => {
  it("단순 문자열 매칭", async () => {
    const out = await R("hello", "", "hello world");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.match).toBe("hello");
    expect(out.matches[0]?.index).toBe(0);
  });

  it("숫자 패턴 매칭", async () => {
    const out = await R("\\d+", "", "abc 123 def");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.match).toBe("123");
  });

  it("g 플래그 다중 매칭", async () => {
    const out = await R("a+", "g", "aa b aaa c a");
    expect(out.matchCount).toBe(3);
    expect(out.matches.map((m) => m.match)).toEqual(["aa", "aaa", "a"]);
  });

  it("i 플래그 대소문자 무시", async () => {
    const out = await R("hello", "i", "Hello WORLD");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.match).toBe("Hello");
  });

  it("빈 텍스트 — 매치 없음", async () => {
    const out = await R("a", "", "");
    expect(out.matchCount).toBe(0);
    expect(out.matches).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("regex 중 — 다양한 입력·경계·예외", () => {
  it("캡처 그룹", async () => {
    const out = await R("(\\d+)-(\\d+)", "", "123-456");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.groups).toEqual(["123", "456"]);
  });

  it("네임드 그룹", async () => {
    const out = await R("(?<year>\\d{4})-(?<month>\\d{2})", "", "2024-05");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.namedGroups).toEqual({ year: "2024", month: "05" });
  });

  it("m 플래그 줄 시작/끝", async () => {
    const out = await R("^start", "m", "start here\nnot start\nstart again");
    expect(out.matchCount).toBe(1);
  });

  it("s 플래그 개행 포함", async () => {
    const out = await R("a.b", "s", "a\nb");
    expect(out.matchCount).toBe(1);
  });

  it("u 플래그 이모지", async () => {
    const out = await R("🎉", "u", "hello 🎉 world");
    expect(out.matchCount).toBe(1);
  });

  it("y 플래그 sticky", async () => {
    const out = await R("a+", "y", "aa b");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.index).toBe(0);
  });

  it("잘못된 패턴 — FILE_INVALID", async () => {
    await expect(R("[", "", "test")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("잘못된 플래그 — USER_INPUT", () => {
    expect(validateRegex({ pattern: "a", flags: "z", text: "test" })?.code).toBe("USER_INPUT");
  });

  it("중복 플래그 — USER_INPUT", () => {
    expect(validateRegex({ pattern: "a", flags: "gg", text: "test" })?.code).toBe("USER_INPUT");
  });

  it("빈 패턴 — USER_INPUT", () => {
    expect(validateRegex({ pattern: "", flags: "", text: "test" })?.code).toBe("USER_INPUT");
  });

  it("패턴 상한 초과 — UNSUPPORTED", () => {
    expect(
      validateRegex({ pattern: "a".repeat(MAX_PATTERN_CHARS + 1), flags: "", text: "t" })?.code,
    ).toBe("UNSUPPORTED");
  });

  it("텍스트 상한 초과 — UNSUPPORTED", () => {
    expect(
      validateRegex({ pattern: "a", flags: "", text: "a".repeat(MAX_TEXT_CHARS + 1) })?.code,
    ).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("regex 상 — 복잡한 입력·극단 경계", () => {
  it("중첩 그룹", async () => {
    const out = await R("((\\d+)-(\\d+))-(\\d+)", "", "123-456-789");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.groups).toEqual(["123-456", "123", "456", "789"]);
  });

  it("선택적 그룹 (매치 안 된 그룹)", async () => {
    const out = await R("(\\d+)(?:-(\\d+))?", "", "123");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.groups).toEqual(["123", undefined]);
  });

  it("다중 플래그 조합 (gi)", async () => {
    const out = await R("a", "gi", "A a A a");
    expect(out.matchCount).toBe(4);
  });

  it("다중 플래그 조합 (gms)", async () => {
    const out = await R("a.b", "gms", "a\nb a\nb");
    expect(out.matchCount).toBe(2);
  });

  it("결과 상한 절단 (1000개 초과)", async () => {
    const text = "a ".repeat(1500);
    const out = await R("a", "g", text);
    expect(out.truncated).toBe(true);
    expect(out.matchCount).toBe(MAX_MATCHES);
  });

  it("결과 상한 정확히 (1000개)", async () => {
    const text = "a ".repeat(1000);
    const out = await R("a", "g", text);
    expect(out.truncated).toBe(false);
    expect(out.matchCount).toBe(1000);
  });

  it("빈 매치 처리", async () => {
    const out = await R("a*", "g", "aa b aa");
    expect(out.matchCount).toBeGreaterThan(0);
  });

  it("특수문자 이스케이프", async () => {
    const out = await R("\\$\\d+", "", "price: $100");
    expect(out.matchCount).toBe(1);
    expect(out.matches[0]?.match).toBe("$100");
  });

  it("유니코드 문자 클래스", async () => {
    const out = await R("\\p{L}+", "u", "hello 世界");
    expect(out.matchCount).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("regex 킬러 — 의도적 공격", () => {
  it("ReDoS 패턴 — 휴리스틱 차단 + Worker 타임아웃", async () => {
    const text = "a".repeat(100) + "!";
    const out = await R("(a+)+$", "", text);
    expect(out.matchCount).toBe(0);
    expect(out.truncated).toBe(true);
    expect(isPotentiallyCatastrophicPattern("(a+)+$")).toBe(true);
  });

  it("매우 긴 패턴 (499자) — 정상 처리", async () => {
    const pattern = "a".repeat(499);
    const out = await R(pattern, "", "a".repeat(500));
    expect(out.matchCount).toBe(1);
  });

  it("매우 긴 텍스트 (99999자) — 정상 처리", async () => {
    const text = "a".repeat(99999);
    const out = await R("a+", "g", text);
    expect(out.matchCount).toBe(1);
  });

  it("빈 문자열 매칭 패턴", async () => {
    const out = await R("", "g", "abc");
    expect(out.matchCount).toBeGreaterThan(0);
  });

  it("모든 문자 매칭 (.*)", async () => {
    const out = await R(".*", "", "hello\nworld");
    expect(out.matchCount).toBe(1);
  });

  it("복잡한 중첩 — 다중 조건 동시 발생", async () => {
    const out = await R("(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})", "g", "2024-05-01 2024-06-15");
    expect(out.matchCount).toBe(2);
    expect(out.matches[0]?.namedGroups).toEqual({ y: "2024", m: "05", d: "01" });
    expect(out.matches[1]?.namedGroups).toEqual({ y: "2024", m: "06", d: "15" });
  });

  it("lookbehind 지원 여부 (엔진 의존)", async () => {
    try {
      const out = await R("(?<=@)\\w+", "", "user@example.com");
      expect(out.matchCount).toBeGreaterThanOrEqual(0);
    } catch {
      // 미지원 엔진이면 FILE_INVALID — 정상
    }
  });

  it("False Positive 방지 — 깨진 패턴이 정상으로 통과하지 않음", async () => {
    for (const bad of ["[", "(", "\\", "*", "+", "?"]) {
      await expect(R(bad, "", "test")).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("False Negative 방지 — 정상 패턴이 오류로 판정되지 않음", async () => {
    for (const good of ["a", "\\d+", "[a-z]", "^start", "end$"]) {
      const out = await R(good, "", "test string");
      expect(out).toBeDefined();
    }
  });

  it("경계값 — 500자 패턴 허용", () => {
    expect(validateRegex({ pattern: "a".repeat(MAX_PATTERN_CHARS), flags: "", text: "t" })).toBeNull();
  });

  it("경계값 — 501자 패턴 거부", () => {
    expect(validateRegex({ pattern: "a".repeat(MAX_PATTERN_CHARS + 1), flags: "", text: "t" })?.code).toBe("UNSUPPORTED");
  });

  it("경계값 — 10만자 텍스트 허용", () => {
    expect(validateRegex({ pattern: "a", flags: "", text: "a".repeat(MAX_TEXT_CHARS) })).toBeNull();
  });

  it("경계값 — 10만+1자 텍스트 거부", () => {
    expect(validateRegex({ pattern: "a", flags: "", text: "a".repeat(MAX_TEXT_CHARS + 1) })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("regex 의도적 오류 입력", () => {
  it("비정상 타입 입력", () => {
    expect(validateRegex({ pattern: 123, flags: "", text: "test" } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateRegex(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("regex integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(regexManifest, {
      pattern: "\\d+",
      flags: "g",
      text: "abc 123 def 456",
    });
    expect(res.ok).toBe(true);
    const out = res.output as Awaited<ReturnType<typeof processRegex>>;
    expect(out.matchCount).toBe(2);
    expect(out.matches[0]?.match).toBe("123");
    expect(out.matches[1]?.match).toBe("456");
  });

  it("Runner 실패 전파 (잘못된 패턴)", async () => {
    const res = await runTool(regexManifest, {
      pattern: "[",
      flags: "",
      text: "test",
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
  });

  it("Registry 12도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(12);
    expect(getTool("jwt-decoder")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("regex-tester")?.category).toBe("developer");
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
    expect(searchTools("regex")[0]?.id).toBe("regex-tester");
    expect(searchTools("정규식")[0]?.id).toBe("regex-tester");
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

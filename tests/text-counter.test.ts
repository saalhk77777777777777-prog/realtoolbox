import { describe, it, expect } from "vitest";
import {
  validateTextCounter,
  processTextCounter,
  MAX_TEXT_CHARS,
} from "../src/tools/text/text-counter/processor.ts";
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

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("text-counter 하 — 기본 정상", () => {
  it("ASCII 정확도: hello world", async () => {
    const out = await processTextCounter({ text: "hello world" });
    expect(out.characters).toBe(11);
    expect(out.charactersWithoutSpaces).toBe(10);
    expect(out.words).toBe(2);
    expect(out.lines).toBe(1);
    expect(out.paragraphs).toBe(1);
    expect(out.utf8Bytes).toBe(11);
    expect(out.graphemes).toBe(11);
  });

  it("단일 문자", async () => {
    const out = await processTextCounter({ text: "a" });
    expect(out.characters).toBe(1);
    expect(out.words).toBe(1);
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("text-counter 중 — 다양한 입력·경계·예외", () => {
  it("한글 + 이모지: code point와 UTF-8 바이트", async () => {
    const out = await processTextCounter({ text: "한글 🎉" });
    expect(out.characters).toBe(4);
    expect(out.graphemes).toBe(4);
    expect(out.charactersWithoutSpaces).toBe(3);
    expect(out.utf8Bytes).toBe(3 + 3 + 1 + 4);
  });

  it("CRLF 정규화 + 줄/문단", async () => {
    const out = await processTextCounter({ text: "a\r\nb\rc\n\nd" });
    expect(out.lines).toBe(5);
    expect(out.paragraphs).toBe(2);
  });

  it("빈 입력 거부", () => {
    expect(validateTextCounter({ text: "" })?.code).toBe("USER_INPUT");
    expect(validateTextCounter(null)?.code).toBe("USER_INPUT");
    expect(validateTextCounter({ text: 123 })?.code).toBe("USER_INPUT");
  });

  it("과대 입력 거부 (safe mode)", () => {
    const big = "a".repeat(MAX_TEXT_CHARS + 1);
    expect(validateTextCounter({ text: big })?.code).toBe("UNSUPPORTED");
    expect(validateTextCounter({ text: "a".repeat(MAX_TEXT_CHARS) })).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("text-counter 상 — 복잡한 입력·극단 경계", () => {
  it("여러 문단", async () => {
    const out = await processTextCounter({ text: "para1\n\npara2\n\npara3" });
    expect(out.paragraphs).toBe(3);
  });

  it("공백만 있는 텍스트", async () => {
    const out = await processTextCounter({ text: "   \n   \n   " });
    expect(out.characters).toBe(11);
    expect(out.charactersWithoutSpaces).toBe(0);
  });

  it("매우 긴 단어 (1000자)", async () => {
    const out = await processTextCounter({ text: "a".repeat(1000) });
    expect(out.characters).toBe(1000);
    expect(out.words).toBe(1);
  });

  it("유니코드 혼합 (한글+영어+이모지+특수문자)", async () => {
    const out = await processTextCounter({ text: "Hello 세계 🌍! @#$%" });
    expect(out.characters).toBeGreaterThan(10);
    expect(out.utf8Bytes).toBeGreaterThan(out.characters);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("text-counter 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 빈 입력이 정상으로 통과하지 않음", () => {
    expect(validateTextCounter({ text: "" })?.code).toBe("USER_INPUT");
    expect(validateTextCounter(null)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    expect(validateTextCounter({ text: "hello" })).toBeNull();
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateTextCounter({ text: "a".repeat(MAX_TEXT_CHARS) })).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(validateTextCounter({ text: "a".repeat(MAX_TEXT_CHARS + 1) })?.code).toBe("UNSUPPORTED");
  });

  it("비정상 타입 입력", () => {
    expect(validateTextCounter({ text: 123 })?.code).toBe("USER_INPUT");
    expect(validateTextCounter({ text: null })?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("text-counter 의도적 오류 입력", () => {
  it("숫자 타입 입력 거부", () => {
    expect(validateTextCounter({ text: 123 })?.code).toBe("USER_INPUT");
  });

  it("null 입력 거부", () => {
    expect(validateTextCounter(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("text-counter integration", () => {
  it("Runner 계약을 통한 end-to-end (하드코딩 아님)", async () => {
    const res = await runTool(textCounterManifest, { text: "one two three" });
    expect(res.ok).toBe(true);
    const out = res.output as Awaited<ReturnType<typeof processTextCounter>>;
    expect(out.words).toBe(3);
    expect(out.characters).toBe(13);
  });

  it("Runner: 빈 입력은 실패 + 해결 메시지", async () => {
    const res = await runTool(textCounterManifest, { text: "" });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("USER_INPUT");
    expect(res.error?.how).toContain("입력하세요");
  });

  it("Registry 2도구 공존 + 기존 검색 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    expect(listTools()).toHaveLength(2);
    expect(getTool("file-size-checker")?.slug).toBe("file-size-checker");
    expect(getToolBySlug("file-size-checker")?.version).toBe("0.13.3");
    expect(getTool("text-counter")?.slug).toBe("text-counter");
    expect(getToolBySlug("text-counter")?.category).toBe("text");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
    expect(searchTools("word count")[0]?.id).toBe("text-counter");
  });
});

import { describe, it, expect } from "vitest";
import {
  validateJson,
  processJson,
  locateError,
  scanJson,
  MAX_JSON_CHARS,
} from "../src/tools/developer/json-formatter/processor.ts";
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

const P = (text: string, mode: "pretty" | "minify" | "validate" = "pretty", indent: 2 | 4 | "tab" = 2) =>
  processJson({ text, mode, indent });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("json 하 — 기본 정상", () => {
  it("정상 object pretty", async () => {
    const out = await P('{"b":2,"a":1}');
    expect(out.valid).toBe(true);
    expect(out.formattedText).toBe('{\n  "b": 2,\n  "a": 1\n}');
    expect(out.warnings).toHaveLength(0);
  });

  it("정상 array", async () => {
    const out = await P('[1,2,3]');
    expect(out.valid).toBe(true);
    expect(JSON.parse(out.formattedText)).toEqual([1, 2, 3]);
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("json 중 — 다양한 입력·경계·예외", () => {
  it("nested object", async () => {
    const out = await P('{"a":{"b":[1,{"c":null}]}}');
    expect(out.valid).toBe(true);
    expect(out.maxDepth).toBe(4);
    expect(JSON.parse(out.formattedText)).toEqual({ a: { b: [1, { c: null }] } });
  });

  it("원시값: 문자열·숫자·boolean·null", async () => {
    expect((await P('"str"')).formattedText).toBe('"str"');
    expect((await P("123")).formattedText).toBe("123");
    expect((await P("true")).formattedText).toBe("true");
    expect((await P("null")).formattedText).toBe("null");
  });

  it("Minify", async () => {
    const out = await P('{\n  "b": 2,\n  "a": 1\n}', "minify");
    expect(out.formattedText).toBe('{"b":2,"a":1}');
  });

  it("indentation 4/tab", async () => {
    expect((await P('{"a":1}', "pretty", 4)).formattedText).toBe('{\n    "a": 1\n}');
    expect((await P('{"a":1}', "pretty", "tab")).formattedText).toBe('{\n\t"a": 1\n}');
  });

  it("validate 모드는 텍스트 미생성", async () => {
    const out = await P('{"a":1}', "validate");
    expect(out.valid).toBe(true);
    expect(out.formattedText).toBe("");
  });

  it("빈 입력 거부", () => {
    expect(validateJson({ text: "   ", mode: "pretty", indent: 2 })?.code).toBe("USER_INPUT");
    expect(validateJson(null)?.code).toBe("USER_INPUT");
  });

  it("trailing comma 거부", async () => {
    await expect(P('{"a":1,}')).rejects.toMatchObject({ code: "FILE_INVALID" });
    await expect(P('[1,2,]')).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("single quote 거부", async () => {
    await expect(P("{'a':1}")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("comment 거부", async () => {
    await expect(P('{"a":1 /* x */}')).rejects.toMatchObject({ code: "FILE_INVALID" });
    await expect(P('// c\n{"a":1}')).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("undefined·NaN·Infinity 거부", async () => {
    await expect(P('{"a":undefined}')).rejects.toMatchObject({ code: "FILE_INVALID" });
    await expect(P('{"a":NaN}')).rejects.toMatchObject({ code: "FILE_INVALID" });
    await expect(P('{"a":Infinity}')).rejects.toMatchObject({ code: "FILE_INVALID" });
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("json 상 — 복잡한 입력·극단 경계", () => {
  it("한글·이모지·특수문자 왕복", async () => {
    const src = '{"k":"한글 🎉 &<>\\"\\/"}';
    const out = await P(src);
    expect(JSON.parse(out.formattedText)).toEqual(JSON.parse(src));
  });

  it("큰 입력: 40만자 정상", async () => {
    const big = `[${"1,".repeat(200000)}1]`;
    const out = await P(big, "minify");
    expect(out.valid).toBe(true);
    expect(out.characters).toBe(big.length);
  });

  it("깊은 중첩 (100단)", async () => {
    let deep = "1";
    for (let i = 0; i < 100; i++) deep = `{"a":${deep}}`;
    const out = await P(deep);
    expect(out.valid).toBe(true);
    expect(out.maxDepth).toBe(100);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("json 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 JSON이 정상으로 통과하지 않음", async () => {
    const bad = ['{"a":}', '{"a"', "{'a':1}", '{"a":1,}', "[1,2,]", '{"a":undefined}', '{"a":NaN}'];
    for (const b of bad) {
      await expect(P(b)).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("False Negative 방지 — 정상 JSON이 오류로 판정되지 않음", async () => {
    const good = ['{"a":1}', "[1,2,3]", '"str"', "123", "true", "null"];
    for (const g of good) {
      const out = await P(g);
      expect(out.valid).toBe(true);
    }
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateJson({ text: "a".repeat(MAX_JSON_CHARS), mode: "pretty", indent: 2 })).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(validateJson({ text: "a".repeat(MAX_JSON_CHARS + 1), mode: "pretty", indent: 2 })?.code).toBe("UNSUPPORTED");
  });

  it("locateError: position 있으면 line/column, 없으면 null", () => {
    const withPos = locateError('{"a":}\nxx', "Unexpected token } in JSON at position 5");
    expect(withPos).toMatchObject({ line: 1, column: 6 });
    const noPos = locateError('{"a":}', "Unexpected end of JSON input");
    expect(noPos.line).toBeNull();
    expect(noPos.column).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("json 의도적 오류 입력", () => {
  it("비정상 모드 입력", () => {
    expect(validateJson({ text: "{}", mode: "bogus", indent: 2 } as never)?.code).toBe("USER_INPUT");
  });

  it("숫자 타입 입력", () => {
    expect(validateJson({ text: 123, mode: "pretty", indent: 2 } as never)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 경고 테스트
// ─────────────────────────────────────────────
describe("json warnings", () => {
  it("중복 key 검출 + path", async () => {
    const out = await P('{"a":1,"a":2}');
    expect(out.valid).toBe(true);
    expect(out.warnings.some((w) => w.type === "duplicate-key" && w.path === "a")).toBe(true);
  });

  it("중첩 경로 + escape 디코드 비교", async () => {
    const out = await P('{"x":{"y":1,"y":2}}');
    expect(out.warnings.some((w) => w.type === "duplicate-key" && w.path === "x.y")).toBe(true);
  });

  it("16자리 이상 숫자 정밀도 경고", async () => {
    const big = await P('{"n":123456789012345678}');
    expect(big.warnings.some((w) => w.type === "precision")).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("json integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(jsonManifest, { text: '{"a":1}', mode: "pretty", indent: 2 });
    expect(res.ok).toBe(true);
    expect((res.output as Awaited<ReturnType<typeof processJson>>).formattedText).toBe(
      '{\n  "a": 1\n}',
    );
  });

  it("Runner 실패 전파 (trailing comma)", async () => {
    const res = await runTool(jsonManifest, { text: '{"a":1,}', mode: "pretty", indent: 2 });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
  });

  it("Registry 7도구 공존 + 기존 계약 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    registerTool(hashManifest);
    registerTool(jsonManifest);
    expect(listTools()).toHaveLength(7);
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getTool("hash-generator")?.version).toBe("0.13.3");
    expect(getToolBySlug("json-formatter")?.category).toBe("developer");
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
    expect(searchTools("json")[0]?.id).toBe("json-formatter");
    expect(searchTools("json 검증")[0]?.id).toBe("json-formatter");
    expect(searchTools("hash")[0]?.id).toBe("hash-generator");
    expect(searchTools("timestamp")[0]?.id).toBe("timestamp-converter");
    expect(searchTools("base64")[0]?.id).toBe("base64");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
  });
});

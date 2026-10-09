import { describe, it, expect } from "vitest";
import {
  validateCsv,
  processCsv,
  toCsv,
  MAX_CSV_CHARS,
} from "../src/tools/data/csv-cleaner/processor.ts";
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

const P = (text: string, opts: Partial<Parameters<typeof processCsv>[0]> = {}) =>
  processCsv({ text, delimiter: ",", removeEmptyRows: true, removeDuplicateRows: true, trimWhitespace: true, ...opts });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("csv 하 — 기본 정상", () => {
  it("정상 CSV 파싱", async () => {
    const out = await P("name,age\nAlice,30\nBob,25");
    expect(out.headers).toEqual(["name", "age"]);
    expect(out.rows).toHaveLength(2);
    expect(out.rows[0]).toEqual(["Alice", "30"]);
  });

  it("빈 행 제거", async () => {
    const out = await P("a,b\n1,2\n\n3,4");
    expect(out.rows).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("csv 중 — 다양한 입력·경계·예외", () => {
  it("중복 행 제거", async () => {
    const out = await P("a,b\n1,2\n1,2\n3,4");
    expect(out.rows).toHaveLength(2);
  });

  it("공백 제거", async () => {
    const out = await P("a,b\n 1 , 2 ");
    expect(out.rows[0]).toEqual(["1", "2"]);
  });

  it("빈 입력 거부", () => {
    expect(validateCsv({ text: "", delimiter: "," })?.code).toBe("USER_INPUT");
    expect(validateCsv(null)?.code).toBe("USER_INPUT");
  });

  it("초과 입력 거부", () => {
    expect(validateCsv({ text: "a".repeat(MAX_CSV_CHARS + 1), delimiter: "," })?.code).toBe("UNSUPPORTED");
  });

  it("TSV 구분자", async () => {
    const out = await P("a\tb\n1\t2", { delimiter: "\t" });
    expect(out.headers).toEqual(["a", "b"]);
    expect(out.rows[0]).toEqual(["1", "2"]);
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("csv 상 — 복잡한 입력·극단 경계", () => {
  it("따옴표 포함 CSV", async () => {
    const out = await P('a,b\n"hello, world",2');
    expect(out.rows[0]).toEqual(["hello, world", "2"]);
  });

  it("큰 CSV (1000행)", async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => `val${i},${i}`).join("\n");
    const out = await P(`a,b\n${rows}`);
    expect(out.rows).toHaveLength(1000);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("csv 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", () => {
    expect(validateCsv({ text: "", delimiter: "," })?.code).toBe("USER_INPUT");
    expect(validateCsv(null)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    const out = await P("a,b\n1,2");
    expect(out.headers).toEqual(["a", "b"]);
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateCsv({ text: "a".repeat(MAX_CSV_CHARS), delimiter: "," })).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(validateCsv({ text: "a".repeat(MAX_CSV_CHARS + 1), delimiter: "," })?.code).toBe("UNSUPPORTED");
  });

  it("중복 헤더 진단", async () => {
    const out = await P("a,a\n1,2");
    expect(out.diagnostics.some((d) => d.type === "duplicate-header")).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("csv 의도적 오류 입력", () => {
  it("비정상 구분자 입력", () => {
    expect(validateCsv({ text: "a,b", delimiter: ";" } as never)?.code).toBe("USER_INPUT");
  });

  it("숫자 타입 입력", () => {
    expect(validateCsv({ text: 123, delimiter: "," } as never)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("csv integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(csvManifest, {
      text: "a,b\n1,2\n\n1,2",
      delimiter: ",",
      removeEmptyRows: true,
      removeDuplicateRows: true,
      trimWhitespace: true,
    });
    expect(res.ok).toBe(true);
    const out = res.output as Awaited<ReturnType<typeof processCsv>>;
    expect(out.rows).toHaveLength(1);
  });

  it("Runner 실패 전파 (빈 입력)", async () => {
    const res = await runTool(csvManifest, {
      text: "",
      delimiter: ",",
      removeEmptyRows: true,
      removeDuplicateRows: true,
      trimWhitespace: true,
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("USER_INPUT");
  });

  it("Registry 13도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(13);
    expect(getTool("regex-tester")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("csv-cleaner")?.category).toBe("data");
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
    expect(searchTools("csv")[0]?.id).toBe("csv-cleaner");
    expect(searchTools("csv 정리")[0]?.id).toBe("csv-cleaner");
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

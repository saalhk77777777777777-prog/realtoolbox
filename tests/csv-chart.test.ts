import { describe, it, expect } from "vitest";
import {
  validateChart,
  processChart,
  MAX_CHART_CHARS,
} from "../src/tools/data/csv-chart/processor.ts";
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

const P = (text: string, x: string, y: string, type: "bar" | "line" | "pie" = "bar") =>
  processChart({ text, xColumn: x, yColumn: y, chartType: type });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("chart 하 — 기본 정상", () => {
  it("bar 차트 기본", async () => {
    const out = await P("name,value\nAlice,30\nBob,25", "name", "value", "bar");
    expect(out.chartType).toBe("bar");
    expect(out.labels).toEqual(["Alice", "Bob"]);
    expect(out.values).toEqual([30, 25]);
    expect(out.rowCount).toBe(2);
  });

  it("line 차트", async () => {
    const out = await P("x,y\n1,10\n2,20", "x", "y", "line");
    expect(out.chartType).toBe("line");
    expect(out.values).toEqual([10, 20]);
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("chart 중 — 다양한 입력·경계·예외", () => {
  it("pie 차트", async () => {
    const out = await P("name,value\nA,10\nB,20\nC,30", "name", "value", "pie");
    expect(out.chartType).toBe("pie");
    expect(out.values).toEqual([10, 20, 30]);
  });

  it("빈 입력 거부", () => {
    expect(validateChart({ text: "", xColumn: "a", yColumn: "b", chartType: "bar" })?.code).toBe("USER_INPUT");
    expect(validateChart(null)?.code).toBe("USER_INPUT");
  });

  it("잘못된 열 이름 거부", async () => {
    await expect(P("a,b\n1,2", "x", "y")).rejects.toMatchObject({ code: "USER_INPUT" });
  });

  it("Y축 비숫자 값 거부", async () => {
    await expect(P("a,b\n1,abc", "a", "b")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("데이터 행 없음 거부", async () => {
    await expect(P("a,b", "a", "b")).rejects.toMatchObject({ code: "USER_INPUT" });
  });

  it("초과 입력 거부", () => {
    expect(validateChart({ text: "a".repeat(MAX_CHART_CHARS + 1), xColumn: "a", yColumn: "b", chartType: "bar" })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("chart 상 — 복잡한 입력·극단 경계", () => {
  it("큰 CSV (1000행)", async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => `val${i},${i}`).join("\n");
    const out = await P(`a,b\n${rows}`, "a", "b");
    expect(out.rowCount).toBe(1000);
  });

  it("음수 값 포함", async () => {
    const out = await P("a,b\n1,-10\n2,20", "a", "b");
    expect(out.values).toEqual([-10, 20]);
  });

  it("소수 값 포함", async () => {
    const out = await P("a,b\n1,1.5\n2,2.5", "a", "b");
    expect(out.values).toEqual([1.5, 2.5]);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("chart 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", async () => {
    await expect(P("a,b\n1,abc", "a", "b")).rejects.toMatchObject({ code: "FILE_INVALID" });
    await expect(P("a,b\n1,2", "x", "y")).rejects.toMatchObject({ code: "USER_INPUT" });
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    const out = await P("a,b\n1,2", "a", "b");
    expect(out.values).toEqual([2]);
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateChart({ text: "a".repeat(MAX_CHART_CHARS), xColumn: "a", yColumn: "b", chartType: "bar" })).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(validateChart({ text: "a".repeat(MAX_CHART_CHARS + 1), xColumn: "a", yColumn: "b", chartType: "bar" })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("chart 의도적 오류 입력", () => {
  it("비정상 차트 타입 입력", () => {
    expect(validateChart({ text: "a,b\n1,2", xColumn: "a", yColumn: "b", chartType: "scatter" } as never)?.code).toBe("USER_INPUT");
  });

  it("숫자 타입 입력", () => {
    expect(validateChart({ text: 123, xColumn: "a", yColumn: "b", chartType: "bar" } as never)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("chart integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(chartManifest, {
      text: "name,value\nAlice,30\nBob,25",
      xColumn: "name",
      yColumn: "value",
      chartType: "bar",
    });
    expect(res.ok).toBe(true);
    const out = res.output as Awaited<ReturnType<typeof processChart>>;
    expect(out.labels).toEqual(["Alice", "Bob"]);
    expect(out.values).toEqual([30, 25]);
  });

  it("Runner 실패 전파 (비숫자 Y값)", async () => {
    const res = await runTool(chartManifest, {
      text: "a,b\n1,abc",
      xColumn: "a",
      yColumn: "b",
      chartType: "bar",
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
  });

  it("Registry 14도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(14);
    expect(getTool("csv-cleaner")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("csv-chart")?.category).toBe("data");
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
    expect(searchTools("csv chart")[0]?.id).toBe("csv-chart");
    expect(searchTools("차트")[0]?.id).toBe("csv-chart");
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

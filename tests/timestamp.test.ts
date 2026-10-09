import { describe, it, expect } from "vitest";
import {
  validateTimestamp,
  processTimestamp,
  formatInZone,
} from "../src/tools/developer/timestamp-converter/processor.ts";
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

const D = (text: string, unit: "seconds" | "milliseconds" | "auto" = "seconds") =>
  processTimestamp({ text, direction: "toDate", unit, zone: "UTC" });
const T = (text: string, zone: "UTC" | "KST" | "local" = "UTC") =>
  processTimestamp({ text, direction: "toTimestamp", unit: "seconds", zone });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("timestamp 하 — 기본 정상", () => {
  it("epoch 0 (seconds)", async () => {
    const out = await D("0");
    expect(out.unixSeconds).toBe(0);
    expect(out.unixMilliseconds).toBe(0);
    expect(out.utcIso).toBe("1970-01-01T00:00:00.000Z");
    expect(out.kst).toBe("1970-01-01 09:00:00 (UTC+9, KST)");
    expect(out.resolvedUnit).toBe("seconds");
  });

  it("양수 seconds + KST 병기", async () => {
    const out = await D("1700000000");
    expect(out.utcIso).toBe("2023-11-14T22:13:20.000Z");
    expect(out.kst).toBe("2023-11-15 07:13:20 (UTC+9, KST)");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("timestamp 중 — 다양한 입력·경계·예외", () => {
  it("음수 timestamp", async () => {
    const out = await D("-1");
    expect(out.utcIso).toBe("1969-12-31T23:59:59.000Z");
    expect(out.unixSeconds).toBe(-1);
  });

  it("milliseconds 입력", async () => {
    const out = await D("1700000000000", "milliseconds");
    expect(out.utcIso).toBe("2023-11-14T22:13:20.000Z");
    expect(out.resolvedUnit).toBe("milliseconds");
  });

  it("auto 자릿수 규칙 (10→초, 11·13→밀리초, 14→오류)", async () => {
    expect((await D("1700000000", "auto")).resolvedUnit).toBe("seconds");
    expect((await D("12345678901", "auto")).resolvedUnit).toBe("milliseconds");
    expect((await D("1700000000000", "auto")).resolvedUnit).toBe("milliseconds");
    await expect(D("12345678901234", "auto")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("소수·비숫자 timestamp 거부", async () => {
    await expect(D("1700000000.5")).rejects.toMatchObject({ code: "FILE_INVALID" });
    await expect(D("abc")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("빈 입력 거부", () => {
    expect(
      validateTimestamp({ text: "   ", direction: "toDate", unit: "seconds", zone: "UTC" })?.code,
    ).toBe("USER_INPUT");
    expect(validateTimestamp(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("timestamp 상 — 복잡한 입력·극단 경계", () => {
  it("offset 포함 ISO는 절대시각 그대로", async () => {
    const out = await T("2024-05-01T12:00:00+09:00");
    expect(out.utcIso).toBe("2024-05-01T03:00:00.000Z");
  });

  it("Zulu ISO", async () => {
    const out = await T("2024-05-01T12:00:00Z");
    expect(out.utcIso).toBe("2024-05-01T12:00:00.000Z");
  });

  it("zone 없는 입력은 선택 zone으로 해석 (KST vs UTC 차이)", async () => {
    const kst = await T("2024-05-01 12:00", "KST");
    const utc = await T("2024-05-01 12:00", "UTC");
    expect(kst.utcIso).toBe("2024-05-01T03:00:00.000Z");
    expect(utc.utcIso).toBe("2024-05-01T12:00:00.000Z");
  });

  it("date-only는 자정", async () => {
    expect((await T("2024-05-01", "UTC")).utcIso).toBe("2024-05-01T00:00:00.000Z");
  });

  it("양방향 round-trip", async () => {
    const d = await D("1700000000");
    const back = await T(d.utcIso);
    expect(back.unixSeconds).toBe(1700000000);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("timestamp 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", async () => {
    for (const bad of ["abc", "1700000000.5", "2024-02-30", "not-a-date"]) {
      await expect(D(bad)).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    for (const good of ["0", "1700000000", "1700000000000"]) {
      const out = await D(good);
      expect(out).toBeDefined();
    }
  });

  it("존재하지 않는 날짜 거부", async () => {
    await expect(T("2024-02-30", "UTC")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("숫자 단독 입력은 방향 오류로 거부", async () => {
    await expect(T("1700000000", "UTC")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("DST 존: 하계/동계 오프셋이 다르게 표시", () => {
    expect(formatInZone(new Date("2024-07-01T12:00:00Z"), "America/New_York")).toBe("2024-07-01 08:00:00");
    expect(formatInZone(new Date("2024-01-01T12:00:00Z"), "America/New_York")).toBe("2024-01-01 07:00:00");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("timestamp 의도적 오류 입력", () => {
  it("비정상 방향 입력", () => {
    expect(
      validateTimestamp({ text: "123", direction: "bogus", unit: "seconds", zone: "UTC" } as never)?.code,
    ).toBe("USER_INPUT");
  });

  it("비정상 단위 입력", () => {
    expect(
      validateTimestamp({ text: "123", direction: "toDate", unit: "bogus", zone: "UTC" } as never)?.code,
    ).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("timestamp integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(timestampManifest, {
      text: "0",
      direction: "toDate",
      unit: "seconds",
      zone: "UTC",
    });
    expect(res.ok).toBe(true);
    expect((res.output as Awaited<ReturnType<typeof processTimestamp>>).utcIso).toBe(
      "1970-01-01T00:00:00.000Z",
    );
  });

  it("Runner 실패 전파", async () => {
    const res = await runTool(timestampManifest, {
      text: "2024-02-30",
      direction: "toTimestamp",
      unit: "seconds",
      zone: "UTC",
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
  });

  it("Registry 6도구 공존 + 기존 계약 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    expect(listTools()).toHaveLength(5);
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getTool("text-counter")?.version).toBe("0.13.3");
    expect(getTool("base64")?.version).toBe("0.13.3");
    expect(getTool("url-encoder")?.version).toBe("0.13.3");
    expect(getToolBySlug("timestamp-converter")?.category).toBe("developer");
  });

  it("Search 발견 + 기존 의도 유지", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    registerTool(textCounterManifest);
    registerTool(base64Manifest);
    registerTool(urlCoderManifest);
    registerTool(timestampManifest);
    expect(searchTools("timestamp")[0]?.id).toBe("timestamp-converter");
    expect(searchTools("타임스탬프")[0]?.id).toBe("timestamp-converter");
    expect(searchTools("base64")[0]?.id).toBe("base64");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
  });
});

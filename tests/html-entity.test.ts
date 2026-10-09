import { describe, it, expect } from "vitest";
import {
  validateEntity,
  processEntity,
  encodeEntities,
  decodeEntities,
  MAX_ENTITY_CHARS,
} from "../src/tools/developer/html-entity/processor.ts";
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

const E = (text: string) => processEntity({ text, direction: "encode" });
const D = (text: string) => processEntity({ text, direction: "decode" });

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("entity 하 — 기본 정상", () => {
  it("&", async () => {
    expect((await E("&")).result).toBe("&amp;");
  });

  it("<", async () => {
    expect((await E("<")).result).toBe("&lt;");
  });

  it(">", async () => {
    expect((await E(">")).result).toBe("&gt;");
  });

  it('"', async () => {
    expect((await E('"')).result).toBe("&quot;");
  });

  it("'", async () => {
    expect((await E("'")).result).toBe("&#39;");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("entity 중 — 다양한 입력·경계·예외", () => {
  it("일반 문자·공백·한글·이모지는 그대로", async () => {
    expect((await E("abc 123 가나 🎉")).result).toBe("abc 123 가나 🎉");
    expect((await E("abc 123 가나 🎉")).changed).toBe(false);
  });

  it("특수문자 전체 + changed 플래그", async () => {
    const out = await E('&<>"\'');
    expect(out.result).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(out.changed).toBe(true);
  });

  it("이중 encode는 의도된 동작 (&amp; → &amp;amp;)", async () => {
    expect((await E("&amp;")).result).toBe("&amp;amp;");
    expect(encodeEntities("&lt;div&gt;")).toBe("&amp;lt;div&amp;gt;");
  });

  it("&nbsp; → U+00A0", async () => {
    const out = await D("&nbsp;");
    expect(out.result).toHaveLength(1);
    expect(out.result.charCodeAt(0)).toBe(0xa0);
  });

  it("decimal reference", async () => {
    expect((await D("&#65;")).result).toBe("A");
    expect((await D("&#1048;")).result).toBe("И");
    expect((await D("&#1071;")).result).toBe("Я");
  });

  it("hexadecimal reference (대소문자 x)", async () => {
    expect((await D("&#x41;")).result).toBe("A");
    expect((await D("&#X41;")).result).toBe("A");
    expect((await D("&#x1F389;")).result).toBe("🎉");
  });

  it("malformed 수치 참조는 FILE_INVALID", async () => {
    for (const bad of ["&#;", "&#x;", "&#xZZ;", "&#abc;", "&#0;", "&#x110000;", "&#1114112;", "&#xD800;"]) {
      await expect(D(bad)).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("미지원 named는 원문 + warning (성공伪装 없음)", async () => {
    const copy = await D("&copy; 2026");
    expect(copy.result).toBe("&copy; 2026");
    expect(copy.warnings).toHaveLength(1);
    expect(copy.warnings[0]?.type).toBe("unsupported-entity");
  });

  it("세미콜론 없는 형태는 원문 + warning", async () => {
    const out = await D("&amp test");
    expect(out.result).toBe("&amp test");
    expect(out.warnings).toHaveLength(1);
  });

  it("빈 입력·상한 거부", () => {
    expect(validateEntity({ text: "", direction: "encode" })?.code).toBe("USER_INPUT");
    expect(validateEntity(null)?.code).toBe("USER_INPUT");
    expect(
      validateEntity({ text: "a".repeat(MAX_ENTITY_CHARS + 1), direction: "encode" })?.code,
    ).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("entity 상 — 복잡한 입력·극단 경계", () => {
  it("핵심 round-trip: encode → decode", async () => {
    for (const src of ['<div>Hello & "world"</div>', "안녕 & 타비 🎉", "& < > \" '"]) {
      const enc = await E(src);
      const back = await D(enc.result);
      expect(back.result).toBe(src);
    }
  });

  it("decode → encode 동일성 미주장 (&nbsp; 비대칭 문서화)", async () => {
    const dec = await D("&nbsp;");
    const re = await E(dec.result);
    expect(re.result).toHaveLength(1);
    expect(re.result).not.toBe("&nbsp;");
  });

  it("script 입력도 텍스트로만", () => {
    const out = decodeEntities("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(out.text).toBe("<script>alert(1)</script>");
    expect(out.text).not.toContain("&lt;");
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("entity 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 입력이 정상으로 통과하지 않음", async () => {
    for (const bad of ["&#;", "&#x;", "&#xZZ;", "&#abc;", "&#0;", "&#x110000;", "&#xD800;"]) {
      await expect(D(bad)).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("False Negative 방지 — 정상 입력이 오류로 판정되지 않음", async () => {
    for (const good of ["&amp;", "&lt;", "&gt;", "&quot;", "&#39;", "&nbsp;", "&#65;", "&#x41;"]) {
      const out = await D(good);
      expect(out.result).toBeDefined();
    }
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateEntity({ text: "a".repeat(MAX_ENTITY_CHARS), direction: "encode" })).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(validateEntity({ text: "a".repeat(MAX_ENTITY_CHARS + 1), direction: "encode" })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("entity 의도적 오류 입력", () => {
  it("비정상 방향 입력", () => {
    expect(validateEntity({ text: "x", direction: "bogus" } as never)?.code).toBe("USER_INPUT");
  });

  it("숫자 타입 입력", () => {
    expect(validateEntity({ text: 123, direction: "encode" } as never)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("entity integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(entityManifest, { text: "<a>", direction: "encode" });
    expect(res.ok).toBe(true);
    expect((res.output as Awaited<ReturnType<typeof processEntity>>).result).toBe("&lt;a&gt;");
  });

  it("Runner 실패 전파 (malformed 수치)", async () => {
    const res = await runTool(entityManifest, { text: "&#xZZ;", direction: "decode" });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
  });

  it("Registry 9도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(9);
    expect(getTool("uuid-generator")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("html-entity")?.category).toBe("developer");
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
    expect(searchTools("html entity")[0]?.id).toBe("html-entity");
    expect(searchTools("엔티티")[0]?.id).toBe("html-entity");
    expect(searchTools("uuid")[0]?.id).toBe("uuid-generator");
    expect(searchTools("json")[0]?.id).toBe("json-formatter");
    expect(searchTools("hash")[0]?.id).toBe("hash-generator");
    expect(searchTools("timestamp")[0]?.id).toBe("timestamp-converter");
    expect(searchTools("base64")[0]?.id).toBe("base64");
    expect(searchTools("파일 크기")[0]?.id).toBe("file-size-checker");
    expect(searchTools("글자")[0]?.id).toBe("text-counter");
  });
});

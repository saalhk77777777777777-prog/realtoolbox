import { describe, it, expect } from "vitest";
import {
  validateJwt,
  processJwt,
  base64UrlToBytes,
  MAX_JWT_CHARS,
} from "../src/tools/developer/jwt-decoder/processor.ts";
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

const D = (text: string) => processJwt({ text });

const DUMMY_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c";

function b64url(obj: unknown): string {
  const json = typeof obj === "string" ? obj : JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("jwt 하 — 기본 정상", () => {
  it("정상 HS256 형태 JWT 전체 디코드", async () => {
    const out = await D(DUMMY_JWT);
    expect(out.valid).toBe(true);
    expect(out.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(out.payload).toEqual({
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    });
    expect(out.signatureBytes).toBe(31);
    expect(out.signatureHex).toHaveLength(62);
    expect(out.signatureEmpty).toBe(false);
  });

  it("Header decode — alg/typ", async () => {
    const out = await D(DUMMY_JWT);
    expect(out.metadata.algorithm).toBe("HS256");
    expect(out.metadata.type).toBe("JWT");
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("jwt 중 — 다양한 입력·경계·예외", () => {
  it("Payload decode — iss/sub/aud/exp/nbf/iat/jti", async () => {
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "key-1" }));
    const payload = b64url(
      JSON.stringify({
        iss: "https://auth.example.com",
        sub: "user-42",
        aud: ["api1", "api2"],
        exp: 1893456000,
        nbf: 1516239022,
        iat: 1516239022,
        jti: "abc-123",
      }),
    );
    const out = await D(`${header}.${payload}.c2ln`);
    expect(out.metadata.issuer).toBe("https://auth.example.com");
    expect(out.metadata.subject).toBe("user-42");
    expect(out.metadata.audience).toEqual(["api1", "api2"]);
    expect(out.metadata.expiration?.value).toBe(1893456000);
    expect(out.metadata.expiration?.utc).toBe("2030-01-01T00:00:00.000Z");
    expect(out.metadata.notBefore?.value).toBe(1516239022);
    expect(out.metadata.issuedAt?.value).toBe(1516239022);
    expect(out.metadata.jwtId).toBe("abc-123");
    expect(out.metadata.keyId).toBe("key-1");
  });

  it("Signature decode — hex + byte length", async () => {
    const out = await D(DUMMY_JWT);
    expect(out.signatureHex).toMatch(/^[0-9a-f]{62}$/);
    expect(out.signatureBytes).toBe(31);
  });

  it("alg 표시만 (whitelist 없음)", async () => {
    const header = b64url(JSON.stringify({ alg: "ES256" }));
    const payload = b64url(JSON.stringify({ sub: "1" }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.metadata.algorithm).toBe("ES256");
  });

  it("alg:none 표시 (실행/우회 없음)", async () => {
    const header = b64url(JSON.stringify({ alg: "none" }));
    const payload = b64url(JSON.stringify({ sub: "1" }));
    const out = await D(`${header}.${payload}.`);
    expect(out.metadata.algorithm).toBe("none");
    expect(out.signatureEmpty).toBe(true);
  });

  it("빈 입력 거부", () => {
    expect(validateJwt({ text: "" })?.code).toBe("USER_INPUT");
    expect(validateJwt({ text: "   " })?.code).toBe("USER_INPUT");
    expect(validateJwt(null)?.code).toBe("USER_INPUT");
  });

  it("2 segments 거부", async () => {
    await expect(D("a.b")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("4 segments 거부", async () => {
    await expect(D("a.b.c.d")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("빈 header/payload 거부", async () => {
    await expect(D(".payload.sig")).rejects.toMatchObject({ code: "FILE_INVALID" });
    await expect(D("header..sig")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("malformed Base64URL 거부", async () => {
    await expect(D("!!!.payload.sig")).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("invalid JSON header 거부", async () => {
    const badHeader = b64url("not-json");
    await expect(D(`${badHeader}.payload.sig`)).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("invalid JSON payload 거부", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const badPayload = b64url("not-json");
    await expect(D(`${header}.${badPayload}.sig`)).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("oversized 입력 거부", () => {
    const big = "a".repeat(MAX_JWT_CHARS + 1);
    expect(validateJwt({ text: big })?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("jwt 상 — 복잡한 입력·극단 경계", () => {
  it("unicode payload", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify({ name: "한글 테스트" }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.payload).toEqual({ name: "한글 테스트" });
  });

  it("emoji payload", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify({ emoji: "🎉🚀" }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.payload).toEqual({ emoji: "🎉🚀" });
  });

  it("nested JSON payload", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify({ user: { name: "John", roles: ["admin", "user"] } }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.payload).toEqual({ user: { name: "John", roles: ["admin", "user"] } });
  });

  it("array payload — 최상위가 배열이면 invalid", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify([1, 2, 3]));
    await expect(D(`${header}.${payload}.sig`)).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("unknown claims 보존", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify({ custom: "value", another: 42 }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.payload).toEqual({ custom: "value", another: 42 });
  });

  it("timestamp claim — 숫자 아니면 변환 없음", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify({ exp: "not-a-number" }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.metadata.expiration).toBeUndefined();
  });

  it("timestamp claim — 범위 밖이면 원본만", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify({ exp: 99999999999999999 }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.metadata.expiration?.value).toBe(99999999999999999);
    expect(out.metadata.expiration?.utc).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("jwt 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 깨진 JWT가 정상으로 통과하지 않음", async () => {
    for (const bad of ["a.b", "a.b.c.d", ".payload.sig", "header..sig", "!!!.payload.sig"]) {
      await expect(D(bad)).rejects.toMatchObject({ code: "FILE_INVALID" });
    }
  });

  it("False Negative 방지 — 정상 JWT가 오류로 판정되지 않음", async () => {
    const out = await D(DUMMY_JWT);
    expect(out.valid).toBe(true);
  });

  it("script 문자열 payload — 텍스트로만 취급", async () => {
    const header = b64url(JSON.stringify({ alg: "HS256" }));
    const payload = b64url(JSON.stringify({ name: "<script>alert(1)</script>" }));
    const out = await D(`${header}.${payload}.sig`);
    expect(out.payload).toEqual({ name: "<script>alert(1)</script>" });
    expect(typeof out.payload).toBe("object");
  });

  it("경계값 — 100만자 허용", () => {
    expect(validateJwt({ text: "a".repeat(MAX_JWT_CHARS) })).toBeNull();
  });

  it("경계값 — 100만+1자 거부", () => {
    expect(validateJwt({ text: "a".repeat(MAX_JWT_CHARS + 1) })?.code).toBe("UNSUPPORTED");
  });

  it("Base64URL - → +", () => {
    const bytes = base64UrlToBytes("a-b", "test");
    expect([...bytes]).toEqual([107, 230]);
  });

  it("Base64URL _ → /", () => {
    const bytes = base64UrlToBytes("a_b", "test");
    expect([...bytes]).toEqual([107, 246]);
  });

  it("missing padding 복원", () => {
    const bytes = base64UrlToBytes("eyJhbGciOiJIUzI1NiJ9", "test");
    expect(bytes.length).toBeGreaterThan(0);
    const text = new TextDecoder().decode(bytes);
    expect(text).toBe('{"alg":"HS256"}');
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("jwt 의도적 오류 입력", () => {
  it("비정상 타입 입력", () => {
    expect(validateJwt({ text: 123 } as never)?.code).toBe("USER_INPUT");
  });

  it("null 입력", () => {
    expect(validateJwt(null)?.code).toBe("USER_INPUT");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("jwt integration", () => {
  it("Runner 실제 입력 처리", async () => {
    const res = await runTool(jwtManifest, { text: DUMMY_JWT });
    expect(res.ok).toBe(true);
    const out = res.output as Awaited<ReturnType<typeof processJwt>>;
    expect(out.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(out.payload.sub).toBe("1234567890");
  });

  it("Runner 실패 전파 (2 segments)", async () => {
    const res = await runTool(jwtManifest, { text: "a.b" });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("FILE_INVALID");
  });

  it("Registry 11도구 공존 + 기존 계약 유지", () => {
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
    expect(listTools()).toHaveLength(11);
    expect(getTool("url-parser")?.version).toBe("0.13.3");
    expect(getTool("file-size-checker")?.version).toBe("0.13.3");
    expect(getToolBySlug("jwt-decoder")?.category).toBe("developer");
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
    expect(searchTools("jwt")[0]?.id).toBe("jwt-decoder");
    expect(searchTools("jwt 디코딩")[0]?.id).toBe("jwt-decoder");
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

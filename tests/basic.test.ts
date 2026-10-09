import { describe, it, expect } from "vitest";
import { validateSizeChecker, processSizeChecker } from "../src/tools/file/file-size-checker/processor.ts";
import { validateFiles, formatBytesShort } from "../src/core/fileManager.ts";
import { sanitizeFilename } from "../src/core/downloadManager.ts";
import { searchTools } from "../src/search/searchIndex.ts";
import { registerTool, __clearRegistryForTests, listTools } from "../src/core/toolRegistry.ts";
import { fileSizeCheckerManifest } from "../src/tools/file/file-size-checker/manifest.ts";

function fakeFile(name: string, size: number, type: string): File {
  const bytes = new Uint8Array(Math.max(0, Math.min(size, 1024)));
  const f = new File([bytes], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

// ─────────────────────────────────────────────
// 하: 기본 정상 입력
// ─────────────────────────────────────────────
describe("file-size-checker 하 — 기본 정상", () => {
  it("정상 파일 분석 (내용을 읽지 않음)", async () => {
    const f = fakeFile("사진.jpg", 2048000, "image/jpeg");
    expect(validateSizeChecker({ files: [f] })).toBeNull();
    const out = await processSizeChecker({ files: [f] });
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].bytes).toBe(2048000);
    expect(out.rows[0].extension).toBe("jpg");
    expect(out.rows[0].mimeMismatch).toBe(false);
  });

  it("여러 파일 동시 분석", async () => {
    const a = fakeFile("a.txt", 100, "text/plain");
    const b = fakeFile("b.png", 200, "image/png");
    const out = await processSizeChecker({ files: [a, b] });
    expect(out.rows).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────
// 중: 다양한 입력, 경계값, 예상 가능한 예외
// ─────────────────────────────────────────────
describe("file-size-checker 중 — 다양한 입력·경계·예외", () => {
  it("확장자/MIME 불일치 표시", async () => {
    const f = fakeFile("evil.jpg", 100, "application/pdf");
    const out = await processSizeChecker({ files: [f] });
    expect(out.rows[0].mimeMismatch).toBe(true);
  });

  it("0 byte / 한글 파일명 / 점 여러 개 / 확장자 없음", async () => {
    const a = fakeFile("빈.txt", 0, "text/plain");
    const b = fakeFile("한글 파일명.csv", 10, "text/csv");
    const c = fakeFile("a.b.c.png", 10, "image/png");
    const d = fakeFile("noext", 5, "");
    const out = await processSizeChecker({ files: [a, b, c, d] });
    expect(out.rows[0].decimal).toContain("B");
    expect(out.rows[2].extension).toBe("png");
    expect(out.rows[3].extension).toBe("");
  });

  it("빈 입력 거부", () => {
    expect(validateSizeChecker({ files: [] })?.code).toBe("USER_INPUT");
    expect(validateSizeChecker(null)?.code).toBe("USER_INPUT");
  });

  it("개수 제한 초과 거부", () => {
    const many = Array.from({ length: 11 }, (_, i) => fakeFile(`${i}.txt`, 1, "text/plain"));
    expect(validateFiles(many)?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 상: 복잡한 입력, 극단 경계
// ─────────────────────────────────────────────
describe("file-size-checker 상 — 복잡한 입력·극단 경계", () => {
  it("대용량 파일 (200MB)", async () => {
    const f = fakeFile("big.zip", 200 * 1024 * 1024, "application/zip");
    const out = await processSizeChecker({ files: [f] });
    expect(out.rows[0].bytes).toBe(200 * 1024 * 1024);
  });

  it("특수문자 파일명", async () => {
    const f = fakeFile("file with spaces & symbols.txt", 10, "text/plain");
    const out = await processSizeChecker({ files: [f] });
    expect(out.rows[0].name).toBe("file with spaces & symbols.txt");
  });

  it("매우 긴 파일명", async () => {
    const longName = "a".repeat(200) + ".txt";
    const f = fakeFile(longName, 10, "text/plain");
    const out = await processSizeChecker({ files: [f] });
    expect(out.rows[0].name).toBe(longName);
  });
});

// ─────────────────────────────────────────────
// 킬러: 의도적 공격, 까다로운 입력
// ─────────────────────────────────────────────
describe("file-size-checker 킬러 — 의도적 공격", () => {
  it("False Positive 방지 — 빈 입력이 정상으로 통과하지 않음", () => {
    expect(validateSizeChecker({ files: [] })?.code).toBe("USER_INPUT");
    expect(validateSizeChecker(null)?.code).toBe("USER_INPUT");
  });

  it("False Negative 방지 — 정상 파일이 오류로 판정되지 않음", async () => {
    const f = fakeFile("normal.txt", 100, "text/plain");
    expect(validateSizeChecker({ files: [f] })).toBeNull();
  });

  it("경계값 — 10개 파일 허용 (상한)", () => {
    const ten = Array.from({ length: 10 }, (_, i) => fakeFile(`${i}.txt`, 1, "text/plain"));
    expect(validateFiles(ten)).toBeNull();
  });

  it("경계값 — 11개 파일 거부", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => fakeFile(`${i}.txt`, 1, "text/plain"));
    expect(validateFiles(eleven)?.code).toBe("UNSUPPORTED");
  });
});

// ─────────────────────────────────────────────
// 의도적 오류 입력
// ─────────────────────────────────────────────
describe("file-size-checker 의도적 오류 입력", () => {
  it("비정상 타입 입력", () => {
    expect(validateSizeChecker({ files: "not-an-array" as never })?.code).toBe("USER_INPUT");
  });

  it("파일 크기 음수 — processor가 처리 (validateFiles는 음수 검증 안 함)", async () => {
    const f = fakeFile("neg.txt", -1, "text/plain");
    const out = await processSizeChecker({ files: [f] });
    expect(out.rows[0].bytes).toBe(-1);
  });
});

// ─────────────────────────────────────────────
// Core 모듈 테스트
// ─────────────────────────────────────────────
describe("fileManager core", () => {
  it("formatBytesShort decimal/binary", () => {
    expect(formatBytesShort(0)).toBe("0 B");
    expect(formatBytesShort(2048000)).toContain("MB");
  });

  it("sanitizeFilename 경로 제거", () => {
    expect(sanitizeFilename("../../etc/passwd")).not.toContain("/");
  });
});

// ─────────────────────────────────────────────
// 통합
// ─────────────────────────────────────────────
describe("file-size-checker integration", () => {
  it("등록/검색", () => {
    __clearRegistryForTests();
    registerTool(fileSizeCheckerManifest);
    expect(listTools()).toHaveLength(1);
    const res = searchTools("파일 크기");
    expect(res[0]?.id).toBe("file-size-checker");
    expect(searchTools("jwt")).toHaveLength(0);
  });
});

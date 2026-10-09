import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { collectRealInputs } from "./helpers/realInputCorpus.ts";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function looksLikeImage(bytes: Uint8Array, extension: string): boolean {
  if (extension === ".jpg" || extension === ".jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (extension === ".png") {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
      bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
      bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (extension === ".webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

describe("real-input corpus — v0.14.0", () => {
  it("실제 파일 확장자를 자동 수집한다", async () => {
    const files = await collectRealInputs();
    expect(files.length).toBeGreaterThan(0);

    const imageFiles = files.filter((file) => IMAGE_EXTENSIONS.has(file.extension));
    expect(imageFiles.length).toBeGreaterThan(0);

    console.log(
      `[REAL INPUT] scanned=${files.length}, images=${imageFiles.length}, extensions=${[...new Set(files.map((f) => f.extension))].join(", ")}`,
    );
  });

  it("이미지 확장자와 파일 시그니처가 실제로 일치한다", async () => {
    const files = await collectRealInputs();
    const imageFiles = files.filter((file) => IMAGE_EXTENSIONS.has(file.extension)).slice(0, 20);

    expect(imageFiles.length).toBeGreaterThan(0);

    for (const file of imageFiles) {
      const bytes = new Uint8Array(await readFile(file.path));
      expect(bytes.length, file.path).toBeGreaterThan(0);
      expect(looksLikeImage(bytes, file.extension), file.path).toBe(true);
    }
  });

  it("실제 입력 파일 크기 정보가 유효하다", async () => {
    const files = await collectRealInputs();
    for (const file of files.slice(0, 100)) {
      expect(file.size, file.path).toBeGreaterThan(0);
    }
  });
});

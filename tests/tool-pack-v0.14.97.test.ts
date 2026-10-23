import { describe, expect, it } from "vitest";
import { processGeneric, validateGeneric } from "../src/tools/shared/pack-v0.14.97.ts";
import { manifest as lineNumberer } from "../src/tools/text/text-line-numberer/manifest.ts";
import { manifest as repeater } from "../src/tools/text/text-repeater/manifest.ts";

describe("TOOLBOX v0.14.97 text utilities", () => {
  it("numbers lines with aligned prefixes", () => {
    expect(processGeneric("text-line-numberer", { text: "alpha\nbeta" })).toMatchObject({
      result: "1. alpha\n2. beta", lineCount: 2
    });
  });
  it("preserves a trailing empty line when numbering", () => {
    expect(processGeneric("text-line-numberer", { text: "alpha\n" })).toMatchObject({
      result: "1. alpha\n2. ", lineCount: 2
    });
  });
  it("repeats text the requested number of times", () => {
    expect(processGeneric("text-repeater", { text: "go", count: 3 })).toMatchObject({
      result: "go\ngo\ngo", repetitions: 3, characters: 6
    });
  });
  it("rejects repeat counts outside 1..1000", () => {
    expect(() => processGeneric("text-repeater", { text: "x", count: 0 })).toThrow();
    expect(() => processGeneric("text-repeater", { text: "x", count: 1001 })).toThrow();
  });
  it("rejects output larger than 1 MB", () => {
    expect(() => processGeneric("text-repeater", { text: "x".repeat(1001), count: 1000 })).toThrow();
  });
  it("registers unique local tools", () => {
    expect(lineNumberer.slug).toBe("text-line-numberer");
    expect(repeater.slug).toBe("text-repeater");
    expect(lineNumberer.localProcessing && repeater.localProcessing).toBe(true);
  });
  it("validates required text input", () => {
    expect(validateGeneric("text-line-numberer", { text: "" })).not.toBeNull();
  });
});

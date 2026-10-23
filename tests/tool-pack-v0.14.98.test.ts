import { describe, expect, it } from "vitest";
import { processGeneric, validateGeneric } from "../src/tools/shared/pack-v0.14.98.ts";
import { manifest as prefixSuffix } from "../src/tools/text/text-prefix-suffix/manifest.ts";
import { manifest as textWrap } from "../src/tools/text/text-wrap/manifest.ts";

describe("TOOLBOX v0.14.98 text tools", () => {
  it("adds prefix and suffix to every line", () => {
    expect(processGeneric("text-prefix-suffix", { text: "one\ntwo", prefix: "- ", suffix: ";" })).toMatchObject({
      result: "- one;\n- two;", lines: 2
    });
  });
  it("preserves blank lines when decorating", () => {
    expect(processGeneric("text-prefix-suffix", { text: "a\n\nb", prefix: ">", suffix: "" })).toMatchObject({
      result: ">a\n>\n>b", lines: 3
    });
  });
  it("wraps long text to the requested width", () => {
    expect(processGeneric("text-wrap", { text: "one two three four", width: 10 })).toMatchObject({
      result: "one two\nthree four", width: 10
    });
  });
  it("rejects invalid wrap widths", () => {
    expect(() => processGeneric("text-wrap", { text: "some words", width: 3 })).toThrow();
    expect(() => processGeneric("text-wrap", { text: "some words", width: 501 })).toThrow();
  });
  it("rejects missing text", () => {
    expect(validateGeneric("text-wrap", { text: "" })?.code).toBe("USER_INPUT");
  });
  it("registers local tools", () => {
    expect(prefixSuffix.slug).toBe("text-prefix-suffix");
    expect(textWrap.slug).toBe("text-wrap");
    expect(prefixSuffix.localProcessing && textWrap.localProcessing).toBe(true);
  });
});
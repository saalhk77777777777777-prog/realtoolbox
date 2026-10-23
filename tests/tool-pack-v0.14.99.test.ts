import { describe, expect, it } from "vitest";
import { processGeneric, validateGeneric } from "../src/tools/shared/pack-v0.14.99.ts";
import { manifest as textToJson } from "../src/tools/text/text-to-json-array/manifest.ts";
import { manifest as jsonToLines } from "../src/tools/text/json-array-to-lines/manifest.ts";

describe("TOOLBOX v0.14.99 JSON/text conversion", () => {
  it("converts each line into a JSON string array", () => {
    expect(processGeneric("text-to-json-array", { text: "apple\nbanana\nhello \"world\"" })).toMatchObject({
      result: '[\n  "apple",\n  "banana",\n  "hello \\"world\\""\n]', count: 3
    });
  });
  it("round-trips a string array to lines", () => {
    expect(processGeneric("json-array-to-lines", { json: '["apple","banana","grape"]' })).toMatchObject({
      result: "apple\nbanana\ngrape", count: 3
    });
  });
  it("rejects invalid JSON", () => {
    expect(() => processGeneric("json-array-to-lines", { json: "[broken" })).toThrow("Invalid JSON");
  });
  it("rejects non-array JSON roots", () => {
    expect(() => processGeneric("json-array-to-lines", { json: '{"a":1}' })).toThrow("JSON root must be an array");
  });
  it("rejects nested object values for line conversion", () => {
    expect(() => processGeneric("json-array-to-lines", { json: '[{"a":1}]' })).toThrow("Only primitive array values are supported");
  });
  it("registers both tools as local processing", () => {
    expect(textToJson.localProcessing).toBe(true);
    expect(jsonToLines.localProcessing).toBe(true);
  });
  it("requires source input", () => {
    expect(validateGeneric("text-to-json-array", { text: "" })?.code).toBe("USER_INPUT");
  });
});

import { describe, expect, it } from "vitest";
import { process as compareSchemas, validate as validateSchemas } from "../src/tools/data/json-schema-compatibility/processor.ts";
import { manifest as schemaManifest } from "../src/tools/data/json-schema-compatibility/manifest.ts";
import { process as inspectBits, validate as validateBits } from "../src/tools/developer/bit-field-inspector/processor.ts";
import { manifest as bitManifest } from "../src/tools/developer/bit-field-inspector/manifest.ts";
import { process as simulateBackoff, validate as validateBackoff } from "../src/tools/utility/retry-backoff-simulator/processor.ts";
import { manifest as backoffManifest } from "../src/tools/utility/retry-backoff-simulator/manifest.ts";

describe("TOOLBOX v0.15.0 new tools", () => {
  it("detects breaking schema changes and non-breaking additions", () => {
    const result = compareSchemas({ before: JSON.stringify({ type: "object", properties: { name: { type: "string" } } }), after: JSON.stringify({ type: "object", properties: { name: { type: "number" }, age: { type: "integer" } }, required: ["age"] }) }) as any;
    expect(result.compatible).toBe(false);
    expect(result.breakingChanges).toBe(2);
    expect(result.changes.some((c: any) => c.kind === "property-added")).toBe(true);
  });
  it("rejects invalid schema JSON", () => {
    expect(() => compareSchemas({ before: "{", after: "{}" })).toThrow();
    expect(validateSchemas({ before: "", after: "{}" })?.code).toBe("USER_INPUT");
  });
  it("inspects bit positions correctly", () => {
    expect(inspectBits({ value: 42, width: 8 })).toMatchObject({ binary: "00101010", setBitPositionsFromLeastSignificant: [1, 3, 5], setBitCount: 3 });
  });
  it("rejects a value that exceeds its selected width", () => {
    expect(validateBits({ value: 256, width: 8 })?.code).toBe("USER_INPUT");
  });
  it("simulates capped exponential backoff", () => {
    expect(simulateBackoff({ retries: 5, initialDelay: 500, multiplier: 2, maxDelay: 3000 })).toMatchObject({ totalWaitMs: 9500, schedule: [{ delayMs: 500 }, { delayMs: 1000 }, { delayMs: 2000 }, { delayMs: 3000 }, { delayMs: 3000 }] });
  });
  it("validates retry bounds", () => {
    expect(validateBackoff({ retries: 21, initialDelay: 1, multiplier: 2, maxDelay: 100 })?.code).toBe("USER_INPUT");
  });
  it("registers all tools for local processing", () => {
    expect([schemaManifest, bitManifest, backoffManifest].every((m) => m.localProcessing && m.version === "0.15.0")).toBe(true);
  });
});

/** TOOLBOX v0.9.0 — new tool regression tests */
import { describe, expect, it } from "vitest";
import { validate as validateBase, process as processBase } from "../src/tools/developer/number-base-converter/processor.ts";
import { validate as validateJ2C, process as processJ2C } from "../src/tools/data/json-to-csv/processor.ts";
import { process as processC2J } from "../src/tools/data/csv-to-json/processor.ts";
import { process as processHtml } from "../src/tools/developer/html-formatter/processor.ts";

describe("v0.9.0 new tools", () => {
  it("base converts safely", async () => {
    expect(validateBase({ value: "FF", from: 16, to: 10 })).toBeNull();
    expect((await processBase({ value: "FF", from: 16, to: 10 })).result).toBe("255");
    expect((await processBase({ value: "-10", from: 10, to: 2 })).result).toBe("-1010");
    expect(validateBase({ value: "2", from: 2, to: 10 })).not.toBeNull();
  });
  it("JSON to CSV quotes fields", async () => {
    const input = JSON.stringify([{ a: "x,y", b: 2 }, { a: "z" }]);
    expect(validateJ2C({ text: input })).toBeNull();
    expect((await processJ2C({ text: input })).csv).toBe("a,b\r\n\"x,y\",2\r\nz,");
  });
  it("CSV to JSON parses quoted comma", async () => {
    const result = await processC2J({ text: 'name,note\r\nTabi,"hello, world"' });
    expect(result.json).toContain('"note": "hello, world"');
  });
  it("HTML formats nesting", async () => {
    const result = await processHtml({ text: '<div><p>Hello</p><br><img src="x"></div>' });
    expect(result.html).toContain("  <p>\n    Hello\n  </p>");
    expect(result.html).toContain("  <br>");
  });
});

/** TOOLBOX v0.14.51 — extreme security regression tests */
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { process as minify, validate as validateMinifier } from "../src/tools/developer/json-minifier/processor.ts";
import { process as queryBuilder } from "../src/tools/developer/query-string-builder/processor.ts";
import { process as jsonToXml, validate as validateJsonToXml } from "../src/tools/data/json-to-xml/processor.ts";
import { process as flatten } from "../src/tools/data/json-flatten-unflatten/processor.ts";
import { process as lineNumberer } from "../src/tools/text/line-numberer/processor.ts";
import { process as jsonLines } from "../src/tools/data/json-lines/processor.ts";
import { processRegex, isPotentiallyCatastrophicPattern, REGEX_TIMEOUT_MS } from "../src/tools/developer/regex-tester/processor.ts";

describe("TOOLBOX v0.14.51 — extreme security checks", () => {
  it("keeps a hostile textarea-closing payload as inert JSON output", async () => {
    const payload = JSON.stringify({ note: "</textarea><img src=x onerror=alert(1)>" });
    expect(validateMinifier({ text: payload })).toBeNull();
    expect((await minify({ text: payload })).json).toContain("</textarea>");
    const ui = await readFile(resolve("src/tools/developer/json-minifier/ui.ts"), "utf8");
    expect(ui).toContain("textarea.value = data.json");
    expect(ui).not.toMatch(/\$\{\s*data\.json\s*\}/);
    expect(ui).not.toMatch(/innerHTML\s*=.*\$\{\s*data\.json/);
  });

  it("query-string builder percent-encodes HTML metacharacters", async () => {
    const result = await queryBuilder({ pairs: [{ key: "q", value: "</textarea><script>alert(1)</script>" }] });
    expect(result.query).not.toContain("<script>");
    expect(result.query).toContain("%3C");
  });

  it("JSON-to-XML escapes text content and validates root element names", () => {
    const result = jsonToXml({ text: JSON.stringify({ value: "<script>alert(1)</script>&" }) });
    expect(result.xml).toContain("&lt;script&gt;");
    expect(result.xml).toContain("&amp;");
    expect(validateJsonToXml({ text: "{}", rootName: "bad root" })?.code).toBe("USER_INPUT");
  });

  it("JSON flattening does not pollute Object.prototype with hostile-looking keys", () => {
    const result = flatten({ text: '{"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted":"yes"}}}', mode: "flatten" });
    expect(JSON.stringify(result)).toContain("__proto__");
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
  });


  it("line-numberer keeps hostile text out of HTML parsing", async () => {
    const payload = "</textarea><svg onload=alert(1)>";
    const result = await lineNumberer({ text: payload, remove: false });
    expect(result.text).toContain(payload);
    const ui = await readFile(resolve("src/tools/text/line-numberer/ui.ts"), "utf8");
    expect(ui).toContain("textarea.value = (result.output as { text: string }).text");
    expect(ui).not.toMatch(/innerHTML\s*=.*\$\{\s*\(result\.output as any\)\.text/);
  });


  it("renders hostile error messages as text, not parsed HTML, across legacy UIs", async () => {
    const files = [
      "src/tools/data/csv-to-json/ui.ts",
      "src/tools/data/json-to-csv/ui.ts",
      "src/tools/data/json-lines/ui.ts",
      "src/tools/developer/html-formatter/ui.ts",
      "src/tools/developer/html-tag-remover/ui.ts",
      "src/tools/developer/number-base-converter/ui.ts",
      "src/tools/developer/regex-escape/ui.ts",
    ];
    for (const file of files) {
      const ui = await readFile(resolve(file), "utf8");
      expect(ui, file).not.toContain("$" + "{toUserMessage(r.error!)}");
      expect(ui, file).not.toContain("+toUserMessage(r.error!)");
      expect(ui, file).toMatch(/textContent\s*=\s*toUserMessage\(/);
    }
  });

  it("JSON Lines result retains hostile text only as a textarea value", async () => {
    const payload = "</textarea><svg onload=alert(1)>";
    const result = await jsonLines({
      text: JSON.stringify([{ note: payload }]),
      direction: "array-to-lines",
    });
    expect(result.text).toContain(payload);
    const ui = await readFile(resolve("src/tools/data/json-lines/ui.ts"), "utf8");
    expect(ui).toContain("textarea.value = resultData.text");
    expect(ui).not.toContain("$" + "{String((r.output as any).text)");
  });

  it("handles 100k+ hostile JSON output without HTML interpolation", async () => {
    const payload = JSON.stringify({ x: "</textarea>".repeat(10000) });
    expect(validateMinifier({ text: payload })).toBeNull();
    expect((await minify({ text: payload })).json.length).toBeGreaterThan(100000);
    const ui = await readFile(resolve("src/tools/developer/json-minifier/ui.ts"), "utf8");
    expect(ui).toContain("textarea.value = data.json");
  });
  it("blocks nested and ambiguous quantified regex patterns before matching", async () => {
    for (const pattern of ["(a+)+$", "((a+))+$", "([a-z]+)*$", "(a|aa)+$", "(a|aab)*$"]) {
      expect(isPotentiallyCatastrophicPattern(pattern), pattern).toBe(true);
    }
    expect(isPotentiallyCatastrophicPattern("[+*]+")).toBe(false);
    expect(isPotentiallyCatastrophicPattern("\\d{4}-\\d{2}-\\d{2}")).toBe(false);
    const result = await processRegex({ pattern: "(a|aa)+$", flags: "", text: "a".repeat(100000) + "!" });
    expect(result.truncated).toBe(true);
    expect(result.matchCount).toBe(0);
  });

  it("has a hard browser-worker deadline and terminates the worker", async () => {
    expect(REGEX_TIMEOUT_MS).toBe(750);
    const processor = await readFile(resolve("src/tools/developer/regex-tester/processor.ts"), "utf8");
    const worker = await readFile(resolve("src/tools/developer/regex-tester/regexWorker.ts"), "utf8");
    expect(processor).toContain("new Worker(new URL");
    expect(processor).toContain("worker.terminate()");
    expect(processor).toContain("setTimeout");
    expect(worker).toContain("processRegexInline(event.data)");
  });
});

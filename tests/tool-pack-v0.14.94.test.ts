/** TOOLBOX v0.14.94 — seven new tool tests. */
import { describe, it, expect } from "vitest";
import { processGeneric as p } from "../src/tools/shared/pack-v0.14.94.ts";

describe("TOOLBOX v0.14.94 tools", () => {
  it("extracts Markdown headings and line numbers", () => {
    const r = p("markdown-heading-extractor", { text: "# Title\n\n## Sub" }) as any;
    expect(r.count).toBe(2);
    expect(r.headings[1].line).toBe(3);
  });
  it("counts CSV data rows and columns", () => {
    const r = p("csv-row-counter", { csv: "name,level\nTabi,3\nTimi,2" }) as any;
    expect(r.rows).toBe(2);
    expect(r.columns).toBe(2);
  });
  it("sorts JSON object arrays by key", () => {
    const r = p("json-array-sorter", { json: '[{"n":2},{"n":1}]', key: "n", direction: "ascending" }) as any;
    expect(r.data[0].n).toBe(1);
  });
  it("extracts HTML link text and URLs", () => {
    const r = p("html-link-extractor", { html: '<a href="https://example.com">Example</a>' }) as any;
    expect(r.count).toBe(1);
    expect(r.links[0].text).toBe("Example");
  });
  it("escapes JSON values as a string literal", () => {
    const r = p("json-string-escaper", { json: '{"hello":"Tabi"}' }) as any;
    expect(JSON.parse(r.jsonString)).toBe('{"hello":"Tabi"}');
  });
  it("converts CSV to TSV", () => {
    const r = p("csv-to-tsv", { csv: "a,b\n1,2" }) as any;
    expect(r.tsv).toBe("a\tb\n1\t2");
  });
  it("calculates CSS selector specificity", () => {
    const r = p("css-specificity-calculator", { selector: "#app .card h2" }) as any;
    expect(r.results[0].specificity).toEqual([1, 1, 1]);
  });
});

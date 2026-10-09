import { describe, expect, it } from "vitest";
import { process as reverse } from "../src/tools/text/text-reverser/processor.ts";
import { process as frequency } from "../src/tools/text/character-frequency/processor.ts";
import { process as regexEscape } from "../src/tools/developer/regex-escape/processor.ts";
import { process as mdTable } from "../src/tools/developer/markdown-table-generator/processor.ts";

describe("v0.11.0 new tools", () => {
  it("reverses Unicode text by code point", async () => {
    expect((await reverse({text:"가😀나"})).text).toBe("나😀가");
  });
  it("counts characters", async () => {
    expect((await frequency({text:"aab c"})).rows).toEqual([
      {char:"a",count:2},{char:"b",count:1},{char:"c",count:1},{char:" ",count:1}
    ]);
  });
  it("escapes regex metacharacters", async () => {
    expect((await regexEscape({text:"a.b (c)+ [d]"})).text).toBe("a\.b \(c\)\+ \[d\]");
  });
  it("builds a Markdown table", async () => {
    expect((await mdTable({text:"name,age\nA,15\nB,16",delimiter:","})).markdown)
      .toBe("| name | age |\n| --- | --- |\n| A | 15 |\n| B | 16 |");
  });
});

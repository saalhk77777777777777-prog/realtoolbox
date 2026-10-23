/** TOOLBOX v0.14.92 — tests for eight new tools. */
import { describe, it, expect } from "vitest";
import { processGeneric as p } from "../src/tools/shared/pack-v0.14.92.ts";
describe("TOOLBOX v0.14.92",()=>{
 it("flattens nested JSON",()=>expect((p("json-flattener",{json:'{"user":{"level":3}}'}) as any).flattened["user.level"]).toBe(3));
 it("parses URL query parameters",()=>expect((p("url-query-parser",{url:"https://example.com/?q=tabi"}) as any).query.q).toBe("tabi"));
 it("builds encoded query parameters",()=>expect((p("url-query-builder",{url:"https://example.com",params:"q=Tabi fan"}) as any).url).toContain("q=Tabi+fan"));
 it("escapes XML special characters",()=>expect((p("xml-escape",{text:"A & B"}) as any).escaped).toBe("A &amp; B"));
 it("converts HTML to text",()=>expect((p("html-to-text",{html:"<p>Hello</p>"}) as any).text).toContain("Hello"));
 it("filters CSV rows by column",()=>expect((p("csv-row-filter",{column:2,contains:"Tabi",csv:"id,name\n1,Tabi\n2,Guest"}) as any).matched).toBe(1));
 it("inspects JSON value types",()=>expect((p("json-value-type-inspector",{json:'{"user":{"scores":[100,95]},"active":true}'}) as any).counts.number).toBe(2));
 it("generates CSS media queries",()=>expect((p("css-media-query-generator",{minWidth:480,maxWidth:1024,rules:"display: grid;"}) as any).css).toContain("@media"));
});
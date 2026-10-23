/** TOOLBOX v0.14.91 — tests for eight additional tools. */
import { describe, it, expect } from "vitest";
import { processGeneric as p } from "../src/tools/shared/pack-v0.14.91.ts";
describe("TOOLBOX v0.14.91",()=>{
 it("generates Zod schema from JSON",()=>expect((p("json-to-zod",{json:'{"name":"A","level":2}'}) as any).schema).toContain("z.object"));
 it("sorts JSON keys recursively",()=>expect((p("json-key-sorter",{json:'{"z":1,"a":2}'}) as any).json.indexOf('"a"')).toBeLessThan((p("json-key-sorter",{json:'{"z":1,"a":2}'}) as any).json.indexOf('"z"')));
 it("converts TSV to CSV",()=>expect((p("tsv-to-csv",{tsv:"a\tb\nx\ty"}) as any).csv).toContain("a,b"));
 it("validates URL lists",()=>expect((p("url-list-validator",{urls:"https://example.com\nftp://example.com"}) as any).invalid).toBe(1));
 it("formats HTTP headers",()=>expect((p("http-header-formatter",{headers:"Accept: application/json"}) as any).json).toContain("Accept"));
 it("extracts HTML attributes",()=>expect((p("html-attribute-extractor",{attribute:"href",html:'<a href="/x">x</a>'}) as any).values).toEqual(["/x"]));
 it("converts JSON to YAML",()=>expect((p("json-to-yaml",{json:'{"name":"Tabi"}'}) as any).yaml).toContain('name: "Tabi"'));
 it("generates responsive CSS clamp",()=>expect((p("css-clamp-generator",{property:"font-size",min:16,max:32,minViewport:360,maxViewport:1440}) as any).css).toContain("clamp("));
});

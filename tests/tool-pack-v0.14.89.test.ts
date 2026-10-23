/** TOOLBOX v0.14.89 — regression tests for eight new local tools. */
import{describe,it,expect}from"vitest";
import{process as toc}from"../src/tools/developer/markdown-toc-generator/processor.ts";
import{process as sql}from"../src/tools/developer/sql-in-clause-generator/processor.ts";
import{process as diff}from"../src/tools/data/json-diff/processor.ts";
import{process as stats}from"../src/tools/data/csv-column-stats/processor.ts";
import{process as hex}from"../src/tools/developer/text-hex-converter/processor.ts";
import{process as dockerfile}from"../src/tools/developer/dockerfile-generator/processor.ts";
import{process as compose}from"../src/tools/developer/docker-compose-generator/processor.ts";
import{process as mock}from"../src/tools/data/json-mock-data-generator/processor.ts";
describe("TOOLBOX v0.14.89 tools",()=>{
it("generates heading anchors and duplicate slugs",()=>{const r=toc({text:"# Intro\n## Setup\n## Setup"}) as any;expect(r.count).toBe(3);expect(r.toc).toContain("#setup-1")});
it("escapes SQL string values and deduplicates",()=>{const r=sql({column:"users.name",mode:"string",values:"O'Neil\nA\nA"}) as any;expect(r.clause).toContain("'O''Neil'");expect(r.count).toBe(2)});
it("reports nested JSON changes",()=>{const r=diff({before:'{"a":1,"b":true}',after:'{"a":2,"c":true}'}) as any;expect(r.count).toBe(3);expect(r.changes.map((c:any)=>c.kind)).toEqual(expect.arrayContaining(["changed","removed","added"]))});
it("computes missing and numeric CSV statistics",()=>{const r=stats({text:"name,age\nA,2\nB,\nC,4"}) as any;expect(r.rowCount).toBe(3);expect(r.columns[1].missing).toBe(1);expect(r.columns[1].numeric.average).toBe(3)});
it("converts text to UTF-8 hex and back",()=>{const h=hex({direction:"text-to-hex",text:"Hi"}) as any;expect(h.hex).toBe("48 69");expect((hex({direction:"hex-to-text",text:h.hex}) as any).text).toBe("Hi")});
it("generates a Dockerfile template",()=>{expect((dockerfile({kind:"node",port:3000}) as any).dockerfile).toContain("FROM node:22-alpine")});
it("generates compose port mappings",()=>{const r=compose({service:"web",image:"nginx:alpine",ports:"8080:80"}) as any;expect(r.yaml).toContain('"8080:80"')});
it("generates deterministic mock JSON",()=>{const r=mock({fields:"name:string,age:number,enabled:boolean,email:email,id:id",count:3}) as any;expect(r.data).toHaveLength(3);expect(r.data[0].email).toBe("user1@example.test")});
});

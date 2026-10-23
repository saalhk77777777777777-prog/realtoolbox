/** TOOLBOX v0.14.90 — regression tests for eight new tools. */
import{describe,it,expect}from"vitest";import{processGeneric as p}from"../src/tools/shared/pack-v0.14.90.ts";
describe("TOOLBOX v0.14.90",()=>{
it("infers TypeScript types",()=>expect((p("json-to-typescript",{json:'{"name":"A","level":2}'}) as any).typescript).toContain("interface Root"));
it("converts HTML table to CSV",()=>expect((p("html-table-to-csv",{html:"<table><tr><td>x,y</td></tr></table>"}) as any).csv).toContain('"x,y"'));
it("builds Markdown table",()=>expect((p("csv-to-markdown-table",{csv:"A,B\nx,y"}) as any).markdown).toContain("| --- | --- |"));
it("generates box shadow CSS",()=>expect((p("css-box-shadow-generator",{x:0,y:8,blur:24,spread:0,color:"rgba(0, 0, 0, 0.18)",inset:"false"}) as any).css).toContain("box-shadow: 0px 8px 24px 0px"));
it("generates Nginx config",()=>expect((p("nginx-config-generator",{kind:"static",domain:"example.com",port:3000,root:"/usr/share/nginx/html"}) as any).config).toContain("server_name example.com"));
it("formats commit message",()=>expect((p("git-commit-message-builder",{type:"feat",scope:"tools",description:"add converter",breaking:"false",body:""}) as any).subject).toBe("feat(tools): add converter"));
it("picks JSON fields",()=>expect((p("json-array-field-picker",{json:'[{"a":1,"b":2}]',fields:"b"}) as any).data[0]).toEqual({b:2}));
it("minifies SVG comments",()=>expect((p("svg-minifier",{svg:"<svg> <!-- note --> <circle cx=\"1\" /> </svg>"}) as any).svg).not.toContain("note"));
});

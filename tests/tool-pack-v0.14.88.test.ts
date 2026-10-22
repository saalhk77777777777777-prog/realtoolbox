/** TOOLBOX v0.14.88 — regression tests for eight new tools. */
import{describe,it,expect}from"vitest";
import{process as gitignore}from"../src/tools/developer/gitignore-generator/processor.ts";
import{process as semver}from"../src/tools/developer/semver-parser/processor.ts";
import{process as chmod}from"../src/tools/developer/unix-permission-calculator/processor.ts";
import{process as html}from"../src/tools/developer/html-escape-converter/processor.ts";
import{process as gradient}from"../src/tools/design/css-gradient-generator/processor.ts";
import{process as schema}from"../src/tools/data/json-schema-infer/processor.ts";
import{process as replace}from"../src/tools/text/regex-replace/processor.ts";
import{process as env}from"../src/tools/developer/env-file-validator/processor.ts";
describe("TOOLBOX v0.14.88 tools",()=>{
it("creates selected gitignore templates",()=>{const r=gitignore({stacks:"node,unity,unknown"}) as any;expect(r.text).toContain("node_modules/");expect(r.text).toContain("Library/");expect(r.unknown).toContain("unknown")});
it("compares stable semver above prerelease",()=>{const r=semver({versionA:"1.2.3-beta.1",versionB:"1.2.3"}) as any;expect(r.comparison).toBe(-1);expect(r.versionA.major).toBe(1)});
it("converts chmod octal and symbolic modes",()=>{expect((chmod({value:"755"}) as any).symbolic).toBe("rwxr-xr-x");expect((chmod({value:"rw-r--r--"}) as any).octal).toBe("0644")});
it("escapes and restores HTML special entities",()=>{expect((html({direction:"escape",text:"<a&>"}) as any).result).toBe("&lt;a&amp;&gt;");expect((html({direction:"unescape",text:"&lt;hi&gt;"}) as any).result).toBe("<hi>")});
it("generates a CSS gradient",()=>{expect((gradient({color1:"#fff",color2:"000",angle:90}) as any).css).toContain("90deg")});
it("infers object and array schema",()=>{const r=schema({json:'{"age":16,"tags":["a"]}'}) as any;expect(r.schema.type).toBe("object");expect(r.schema.properties.age.type).toBe("integer");expect(r.schema.properties.tags.type).toBe("array")});
it("replaces text with a regular expression",()=>{expect((replace({text:"a1 b2",pattern:"\\d",replacement:"X",flags:"g"}) as any).result).toBe("aX bX")});
it("detects duplicate environment keys without returning values",()=>{const r=env({text:"API_URL=https://example.com\nDEBUG=true\nAPI_URL=again"}) as any;expect(r.valid).toBe(false);expect(r.issues[0].type).toBe("duplicate-key");expect(JSON.stringify(r)).not.toContain("https://example.com")});
});

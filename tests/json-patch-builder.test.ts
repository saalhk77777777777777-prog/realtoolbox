import { describe, expect, it } from "vitest";
import { process, validate } from "../src/tools/developer/json-patch-builder/processor.ts";
import { manifest } from "../src/tools/developer/json-patch-builder/manifest.ts";
const run=(before:unknown,after:unknown)=>process({before:JSON.stringify(before),after:JSON.stringify(after)});
describe("JSON Patch Builder v0.21.0",()=>{
 it("generates operations",()=>{const out=run({a:1,b:2},{a:3,c:true});expect(out.patch).toContainEqual({op:"remove",path:"/b"});expect(out.patch).toContainEqual({op:"replace",path:"/a",value:3});expect(out.patch).toContainEqual({op:"add",path:"/c",value:true});});
 it("escapes pointer paths",()=>{expect(run({"a/b~c":1},{"a/b~c":2}).patch).toContainEqual({op:"replace",path:"/a~1b~0c",value:2});});
 it("replaces primitive roots",()=>{expect(run(1,2).patch).toEqual([{op:"replace",path:"",value:2}]);});
 it("removes array indexes descending",()=>{expect(run([1,2,3],[1]).patch).toEqual([{op:"remove",path:"/2"},{op:"remove",path:"/1"}]);});
 it("diffs one changed array value",()=>{expect(run([1,2],[1,3]).patch).toEqual([{op:"replace",path:"/1",value:3}]);});
 it("returns empty patch for equal objects",()=>{expect(run({a:1},{a:1}).patch).toEqual([]);});
 it("rejects invalid and oversized inputs",()=>{expect(validate({before:"{",after:"{}"})).not.toBeNull();expect(validate({before:"{}",after:" ".repeat(1_000_001)})).not.toBeNull();});
 it("has local processing metadata",()=>{expect(manifest.id).toBe("json-patch-builder");expect(manifest.version).toBe("0.21.0");expect(manifest.localProcessing).toBe(true);});
});

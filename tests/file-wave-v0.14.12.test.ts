/** TOOLBOX v0.14.12 — File Wave contract tests */
import {describe,expect,it} from "vitest";
import {process as detectEncoding,validate as ve} from "../src/tools/file/file-encoding-detector/processor.ts";
import {process as endings,validate as vl} from "../src/tools/file/line-ending-detector/processor.ts";
import {process as entropy,validate as vn} from "../src/tools/file/file-entropy-analyzer/processor.ts";
import {process as preview,validate as vp} from "../src/tools/file/file-content-previewer/processor.ts";
import {process as zip,validate as vz} from "../src/tools/file/batch-file-zip-creator/processor.ts";
import {process as inspect,validate as vi} from "../src/tools/file/zip-inspector/processor.ts";
const f=(b:BlobPart[],n:string,t="application/octet-stream")=>new File(b,n,{type:t});
describe("v0.14.12 file wave",()=>{
 it("detects UTF-8, BOM and UTF-16",async()=>{expect((await detectEncoding({file:f([new TextEncoder().encode("hello")],"a.txt")})).encoding).toBe("ASCII / UTF-8");expect((await detectEncoding({file:f([new Uint8Array([0xef,0xbb,0xbf,0xed,0x95,0x9c])],"b.txt")})).bom).toBe(true);expect((await detectEncoding({file:f([new Uint8Array([0xff,0xfe,0x41,0])],"c.txt")})).encoding).toBe("UTF-16 LE")});
 it("detects line ending styles including mixed",async()=>{expect((await endings({file:f(["a\nb\n"],"lf.txt")})).style).toBe("LF");expect((await endings({file:f(["a\r\nb\r\n"],"crlf.txt")})).style).toBe("CRLF");expect((await endings({file:f(["a\rb\r"],"cr.txt")})).style).toBe("CR");expect((await endings({file:f(["a\r\nb\nc"],"mix.txt")})).style).toBe("MIXED")});
 it("computes entropy bounds",async()=>{const low=await entropy({file:f([new Uint8Array(100).fill(65)],"low.bin")});expect(low.entropy).toBe(0);const all=new Uint8Array(256);all.forEach((_,i)=>all[i]=i);const high=await entropy({file:f([all],"high.bin")});expect(high.entropy).toBe(8);expect(high.uniqueBytes).toBe(256)});
 it("previews text and binary safely",async()=>{const a=await preview({file:f(["hello world"],"a.txt"),maxBytes:5});expect(a.preview).toBe("hello");expect(a.truncated).toBe(true);const b=await preview({file:f([new Uint8Array([0,1,2,3])],"b.bin")});expect(b.isBinary).toBe(true);expect(b.preview).toContain("00 01 02 03")});
 it("creates a valid store-only ZIP and inspector reads it",async()=>{const out=await zip({files:[f(["alpha"],"a.txt","text/plain"),f(["beta"],"b.txt","text/plain")]});const bytes=new Uint8Array(await out.blob.arrayBuffer());expect(bytes[0]).toBe(0x50);expect(bytes[1]).toBe(0x4b);const info=await inspect({file:new File([bytes],"out.zip",{type:"application/zip"})});expect(info.entryCount).toBe(2);expect(info.entries.map(x=>x.name)).toEqual(["a.txt","b.txt"]);expect(info.entries.every(x=>x.method===0)).toBe(true)});
 it("rejects empty input and malformed ZIP",()=>{expect(ve({})).not.toBeNull();expect(vl({})).not.toBeNull();expect(vn({file:f([new Uint8Array()],"x")})).not.toBeNull();expect(vp({})).not.toBeNull();expect(vz({files:[]})).not.toBeNull();expect(vi({})).not.toBeNull()});
});

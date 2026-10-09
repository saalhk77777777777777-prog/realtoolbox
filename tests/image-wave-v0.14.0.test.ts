/** TOOLBOX v0.14.0 — Image Wave real-input contract tests. */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { validate as validateMeta, process as processMeta } from "../src/tools/image/image-metadata-viewer/processor.ts";
import { validate as validateGray } from "../src/tools/image/image-grayscale/processor.ts";
import { validate as validateBlur } from "../src/tools/image/image-blur/processor.ts";
import { validate as validatePixel } from "../src/tools/image/image-pixelate/processor.ts";
import { validate as validateHist } from "../src/tools/image/image-histogram/processor.ts";
import { validate as validateUri, process as processUri } from "../src/tools/image/image-data-uri/processor.ts";

describe("v0.14.0 image wave",()=>{
  beforeEach(()=>{vi.restoreAllMocks()});
  it("rejects empty and invalid metadata inputs",()=>{expect(validateMeta(null)?.code).toBe("USER_INPUT");expect(validateMeta({file:new File([],"empty.png",{type:"image/png"})})?.code).toBe("FILE_INVALID")});
  it("enforces blur boundaries",()=>{const f=new File([new Uint8Array([1])],"x.png",{type:"image/png"});expect(validateBlur({file:f,radius:0})).toBeNull();expect(validateBlur({file:f,radius:20})).toBeNull();expect(validateBlur({file:f,radius:-1})?.code).toBe("USER_INPUT");expect(validateBlur({file:f,radius:21})?.code).toBe("USER_INPUT");expect(validateBlur({file:f,radius:NaN})?.code).toBe("USER_INPUT")});
  it("enforces pixel block boundaries",()=>{const f=new File([new Uint8Array([1])],"x.png",{type:"image/png"});expect(validatePixel({file:f,blockSize:2})).toBeNull();expect(validatePixel({file:f,blockSize:100})).toBeNull();expect(validatePixel({file:f,blockSize:1})?.code).toBe("USER_INPUT");expect(validatePixel({file:f,blockSize:2.5})?.code).toBe("USER_INPUT")});
  it("requires files for grayscale/histogram",()=>{expect(validateGray({} as never)?.code).toBe("USER_INPUT");expect(validateHist({} as never)?.code).toBe("USER_INPUT")});
  it("data URI round-trips bytes exactly",async()=>{const bytes=Uint8Array.from([137,80,78,71,13,10,26,10,0,255,42]);const file=new File([bytes],"한글.png",{type:"image/png"});const enc=await processUri({mode:"encode",file});expect(typeof enc.value).toBe("string");const dec=await processUri({mode:"decode",dataUri:enc.value as string,fileName:file.name});expect((dec.value as Blob).type).toBe("image/png");expect(new Uint8Array(await (dec.value as Blob).arrayBuffer())).toEqual(bytes)});
  it("rejects malformed data URI",()=>{expect(validateUri({mode:"decode",dataUri:"not-data",fileName:"x.png"})?.code).toBe("USER_INPUT")});
  it("metadata processor preserves decoded dimensions and source facts",async()=>{const file=new File([new Uint8Array([1,2,3])],"sample.webp",{type:"image/webp"});vi.stubGlobal("createImageBitmap",vi.fn(async()=>({width:17,height:9,close:vi.fn()})));const r=await processMeta({file});expect(r.width).toBe(17);expect(r.height).toBe(9);expect(r.size).toBe(3);expect(r.name).toBe("sample.webp")});
  it("six new manifests are unique, versioned, and importable", async()=>{
    const modules=await Promise.all([
      import("../src/tools/image/image-metadata-viewer/manifest.ts"),
      import("../src/tools/image/image-grayscale/manifest.ts"),
      import("../src/tools/image/image-blur/manifest.ts"),
      import("../src/tools/image/image-pixelate/manifest.ts"),
      import("../src/tools/image/image-histogram/manifest.ts"),
      import("../src/tools/image/image-data-uri/manifest.ts"),
    ]);
    const ids=modules.map(m=>m.manifest.id);
    expect(new Set(ids).size).toBe(6);
    expect(modules.every(m=>m.manifest.version==="0.14.0" && m.manifest.localProcessing)).toBe(true);
  });

});

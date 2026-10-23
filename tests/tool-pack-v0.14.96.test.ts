import { describe, it, expect } from "vitest";
import { processDiff, validateDiff } from "../src/tools/text/text-diff/processor.ts";
import { process as decode, validate as validateDecode } from "../src/tools/developer/html-entity-decoder/processor.ts";
import { htmlEntityDecoderManifest } from "../src/tools/developer/html-entity-decoder/manifest.ts";
import { diffManifest } from "../src/tools/text/text-diff/manifest.ts";

describe("TOOLBOX v0.14.96 new tools", () => {
  it("Text Diff is registered with a unique slug", () => {
    expect(diffManifest.slug).toBe("text-diff");
    expect(diffManifest.localProcessing).toBe(true);
  });
  it("compares text lines and counts changes", () => {
    expect(processDiff({left:"a\nb",right:"a\nc"})).toMatchObject({addedCount:1,removedCount:1,unchangedCount:1});
  });
  it("rejects two empty texts", () => {
    expect(validateDiff({left:"",right:""})?.code).toBe("USER_INPUT");
  });
  it("decodes named and numeric HTML entities", () => {
    expect(decode({html:"&lt;cat&gt; &#x1F431;"}).decoded).toBe("<cat> 🐱");
  });
  it("keeps invalid numeric references unchanged", () => {
    expect(decode({html:"&#x110000;"}).decoded).toBe("&#x110000;");
  });
  it("validates HTML entity input", () => {
    expect(validateDecode({html:""} )?.code).toBe("USER_INPUT");
  });
  it("HTML Entity Decoder is browser-local", () => {
    expect(htmlEntityDecoderManifest.localProcessing).toBe(true);
    expect(htmlEntityDecoderManifest.slug).toBe("html-entity-decoder");
  });
});

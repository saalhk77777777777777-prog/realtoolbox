/** TOOLBOX v0.19.0 — CSP Header Builder tests. */
import { describe, expect, it } from "vitest";
import { process, validate } from "../src/tools/developer/csp-header-builder/processor.ts";
import { manifest } from "../src/tools/developer/csp-header-builder/manifest.ts";

describe("CSP Header Builder v0.19.0",()=>{
 it("builds a standard policy header",()=>{const out=process("default-src 'self'\nimg-src 'self' data:\nobject-src 'none'");expect(out.headerName).toBe("Content-Security-Policy");expect(out.value).toContain("default-src 'self'");expect(out.directives).toHaveLength(3);});
 it("supports Report-Only mode",()=>{expect(process("default-src 'self'",true).headerName).toBe("Content-Security-Policy-Report-Only");});
 it("warns about unsafe-inline, unsafe-eval and wildcard",()=>{const out=process("default-src *\nscript-src 'unsafe-inline' 'unsafe-eval'");expect(out.warnings.some((w)=>w.includes("와일드카드"))).toBe(true);expect(out.warnings.some((w)=>w.includes("unsafe-inline"))).toBe(true);expect(out.warnings.some((w)=>w.includes("unsafe-eval"))).toBe(true);});
 it("warns when default-src and base-uri are missing",()=>{const out=process("img-src 'self'");expect(out.warnings.some((w)=>w.includes("default-src"))).toBe(true);expect(out.warnings.some((w)=>w.includes("base-uri"))).toBe(true);});
 it("rejects duplicate directives",()=>{const out=process("default-src 'self'\ndefault-src https:");expect(out.errors.some((e)=>e.includes("중복"))).toBe(true);});
 it("validates empty and oversized inputs",()=>{expect(validate(" ")).not.toBeNull();expect(validate("default-src 'self'" )).toBeNull();expect(validate("x".repeat(20_001))).not.toBeNull();});
 it("exposes local-only tool metadata",()=>{expect(manifest.id).toBe("csp-header-builder");expect(manifest.version).toBe("0.19.0");expect(manifest.localProcessing).toBe(true);});
});

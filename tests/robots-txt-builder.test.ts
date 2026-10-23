/** TOOLBOX v0.20.0 — robots.txt Builder tests. */
import { describe, expect, it } from "vitest";
import { process, validate } from "../src/tools/developer/robots-txt-builder/processor.ts";
import { manifest } from "../src/tools/developer/robots-txt-builder/manifest.ts";
const sample={userAgent:"*",allow:"/public/",disallow:"/admin/\n/private/",sitemap:"https://example.com/sitemap.xml",crawlDelay:"5"};
describe("robots.txt Builder v0.20.0",()=>{
 it("generates Allow, Disallow, Crawl-delay and Sitemap lines",()=>{const out=process(sample);expect(out.text).toContain("User-agent: *");expect(out.text).toContain("Allow: /public/");expect(out.text).toContain("Disallow: /admin/");expect(out.text).toContain("Crawl-delay: 5");expect(out.text).toContain("Sitemap: https://example.com/sitemap.xml");});
 it("warns when the whole site is disallowed",()=>{expect(process({...sample,allow:"",disallow:"/"}).warnings.some((w)=>w.includes("전체 사이트"))).toBe(true);});
 it("rejects paths not beginning with slash",()=>{expect(process({...sample,allow:"public"}).errors.some((e)=>e.includes("/로 시작"))).toBe(true);});
 it("rejects invalid sitemap protocols",()=>{expect(process({...sample,sitemap:"javascript:alert(1)"}).errors.some((e)=>e.includes("http 또는 https"))).toBe(true);});
 it("rejects invalid crawl delay",()=>{expect(process({...sample,crawlDelay:"99999"}).errors.some((e)=>e.includes("0~3600"))).toBe(true);});
 it("validates wrong shapes and oversized input",()=>{expect(validate(null)).not.toBeNull();expect(validate({...sample,allow:"x".repeat(13000)})).not.toBeNull();});
 it("rejects line breaks in user-agent",()=>{expect(validate({...sample,userAgent:"*\nDisallow: /"})).not.toBeNull();});
 it("exposes local-only metadata",()=>{expect(manifest.id).toBe("robots-txt-builder");expect(manifest.version).toBe("0.20.0");expect(manifest.localProcessing).toBe(true);});
});

/** TOOLBOX v0.17.0 — cURL Request Builder tests. */
import { describe, expect, it } from "vitest";
import { process, validate } from "../src/tools/developer/curl-request-builder/processor.ts";
import { manifest } from "../src/tools/developer/curl-request-builder/manifest.ts";

describe("cURL Request Builder v0.17.0", () => {
  it("builds cURL and fetch output from a basic request", () => {
    const result = process({ method: "GET", url: "https://api.example.com/items?q=hello", headers: [], body: "", includeBody: true });
    expect(result.curl).toContain("--request 'GET'");
    expect(result.curl).toContain("--url 'https://api.example.com/items?q=hello'");
    expect(result.fetch).toContain('fetch("https://api.example.com/items?q=hello"');
  });

  it("escapes single quotes for shell arguments", () => {
    const result = process({ method: "POST", url: "https://api.example.com", headers: [], body: "{'name':'Timi'}", includeBody: true });
    expect(result.curl).toContain("'\\''");
    expect(result.curl).toContain("--data-raw");
  });

  it("includes headers and body for POST", () => {
    const result = process({ method: "POST", url: "https://api.example.com", headers: [{ name: "Content-Type", value: "application/json" }], body: '{"ok":true}', includeBody: true });
    expect(result.curl).toContain("Content-Type: application/json");
    expect(result.fetch).toContain('"Content-Type": "application/json"');
    expect(result.fetch).toContain('"body": "{\\"ok\\":true}"');
  });

  it("does not include body for GET", () => {
    const result = process({ method: "GET", url: "https://api.example.com", headers: [], body: "ignored", includeBody: true });
    expect(result.curl).not.toContain("--data-raw");
    expect(result.fetch).not.toContain('"body"');
  });

  it("rejects non-http schemes and URL credentials", () => {
    expect(validate({ method: "GET", url: "javascript:alert(1)", headers: [], body: "", includeBody: true })).not.toBeNull();
    expect(validate({ method: "GET", url: "https://user:secret@example.com", headers: [], body: "", includeBody: true })).not.toBeNull();
  });

  it("rejects header injection and unsupported methods", () => {
    expect(validate({ method: "GET", url: "https://example.com", headers: [{ name: "X-Test", value: "ok\r\ninjected: yes" }], body: "", includeBody: true })).not.toBeNull();
    expect(validate({ method: "TRACE", url: "https://example.com", headers: [], body: "", includeBody: true })).not.toBeNull();
  });

  it("exposes a local-only developer tool manifest", () => {
    expect(manifest.id).toBe("curl-request-builder");
    expect(manifest.version).toBe("0.17.0");
    expect(manifest.localProcessing).toBe(true);
  });
});

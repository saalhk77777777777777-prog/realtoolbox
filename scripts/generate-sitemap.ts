/** TOOLBOX v0.21.4 — Generate sitemap and robots.txt for the canonical Cloudflare Pages host. */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { APP_VERSION } from "../src/version";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const CANONICAL_SITE_URL = "https://realtoolbox.pages.dev";
const configuredSiteUrl = (process.env.SITE_URL || CANONICAL_SITE_URL).trim().replace(/\/+$/, "");
const basePath = process.env.VITE_BASE_PATH || "/";

if (configuredSiteUrl !== CANONICAL_SITE_URL) {
  throw new Error(`TOOLBOX sitemap target mismatch: SITE_URL must be ${CANONICAL_SITE_URL}, received ${configuredSiteUrl}`);
}
if (basePath !== "/") {
  throw new Error(`TOOLBOX sitemap target mismatch: VITE_BASE_PATH must be "/", received ${basePath}`);
}

const paths = new Set<string>(["/", "/about", "/privacy", "/terms", "/contact"]);
function walk(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name === "manifest.ts") {
      const source = readFileSync(path, "utf8");
      const slug = source.match(/slug:\s*"([^"]+)"/)?.[1];
      if (slug) paths.add(`/tools/${slug}`);
    }
  }
}
walk(join(ROOT, "src/tools"));
const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const loc = (path: string) => escapeXml(`${CANONICAL_SITE_URL}${path}`);
const urls = [...paths].sort((a, b) => a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b));
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${loc(path)}</loc></url>`).join("\n")}\n</urlset>\n`;
writeFileSync(join(PUBLIC, "sitemap.xml"), xml, "utf8");
writeFileSync(join(PUBLIC, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${CANONICAL_SITE_URL}/sitemap.xml\n`, "utf8");
console.log(`TOOLBOX v${APP_VERSION} sitemap generated: ${urls.length} absolute routes (${CANONICAL_SITE_URL})`);

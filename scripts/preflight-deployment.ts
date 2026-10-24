/**
 * TOOLBOX v0.21.4 — Fail closed when deployment configuration or generated SEO files conflict.
 * This check does not deploy or modify remote services.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const CANONICAL_SITE_URL = "https://realtoolbox.pages.dev";
const configuredSiteUrl = (process.env.SITE_URL || CANONICAL_SITE_URL).trim().replace(/\/+$/, "");
const basePath = process.env.VITE_BASE_PATH || "/";
const failures: string[] = [];

if (configuredSiteUrl !== CANONICAL_SITE_URL) failures.push(`SITE_URL must be ${CANONICAL_SITE_URL}; received ${configuredSiteUrl}`);
if (basePath !== "/") failures.push(`VITE_BASE_PATH must be "/"; received ${basePath}`);

const index = read("index.html");
if (!index.includes('rel="canonical" href="/"')) failures.push('index.html must contain canonical placeholder href="/"');
if (!index.includes('property="og:type"')) failures.push("index.html is missing og:type");

const packageJson = JSON.parse(read("package.json"));
const versionSource = read("src/version.ts");
const appVersion = versionSource.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
if (packageJson.version !== appVersion) failures.push(`version mismatch: package.json=${packageJson.version}, APP_VERSION=${appVersion ?? "missing"}`);

const sitemap = read("public/sitemap.xml");
const robots = read("public/robots.txt");
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedStaticRoutes = ["/", "/about", "/privacy", "/terms", "/contact"];
const manifestSlugs: string[] = [];
function walk(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name === "manifest.ts") {
      const source = readFileSync(path, "utf8");
      const slug = source.match(/slug:\s*"([^"]+)"/)?.[1];
      if (slug) manifestSlugs.push(slug);
    }
  }
}
walk(join(ROOT, "src/tools"));

if (!sitemapLocs.length) failures.push("sitemap.xml contains no <loc> entries");
if (new Set(sitemapLocs).size !== sitemapLocs.length) failures.push("sitemap.xml contains duplicate URLs");
if (sitemapLocs.some((loc) => !loc.startsWith(CANONICAL_SITE_URL + "/"))) failures.push("sitemap.xml contains a URL outside the canonical host");
const sitemapPaths = new Set(sitemapLocs.map((loc) => {
  try { return new URL(loc).pathname; } catch { return ""; }
}));
for (const route of expectedStaticRoutes) {
  if (!sitemapPaths.has(route)) failures.push(`sitemap.xml is missing static route ${route}`);
}
for (const slug of manifestSlugs) {
  if (!sitemapPaths.has(`/tools/${slug}`)) failures.push(`sitemap.xml is missing tool route /tools/${slug}`);
}
if (!robots.includes(`Sitemap: ${CANONICAL_SITE_URL}/sitemap.xml`)) failures.push("robots.txt sitemap URL does not match the canonical host");
if (!/^Allow:\s*\/$/m.test(robots)) failures.push("robots.txt must allow the root path");

for (const failure of failures) console.error(`[FAIL] ${failure}`);
if (failures.length) {
  console.error(`TOOLBOX v${appVersion ?? packageJson.version} deployment preflight: FAIL (${failures.length})`);
  process.exit(1);
}
console.log(`[PASS] canonical host: ${CANONICAL_SITE_URL}`);
console.log("[PASS] base path: /");
console.log(`[PASS] version sync: ${appVersion}`);
console.log(`[PASS] sitemap routes: ${sitemapLocs.length} URLs, ${manifestSlugs.length} tool manifests`);
console.log("[PASS] robots.txt sitemap and root policy");
console.log(`TOOLBOX v${appVersion} deployment preflight: PASS`);

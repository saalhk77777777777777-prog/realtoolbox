/** TOOLBOX v0.14.66 — Generate sitemap with project base path from the current tool manifests. */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const baseCandidate = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "";
const baseUrl = baseCandidate.trim().replace(/\/+$/, "");
const basePath = (process.env.VITE_BASE_PATH || "/").replace(/\/+$/, "");
const routePath = (path: string) => `${basePath}${path === "/" ? "/" : path}`;
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
const loc = (path: string) => escapeXml(baseUrl ? `${baseUrl}${routePath(path)}` : routePath(path));
const urls = [...paths].sort((a, b) => a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b));
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${loc(path)}</loc></url>`).join("\n")}\n</urlset>\n`;
writeFileSync(join(PUBLIC, "sitemap.xml"), xml, "utf8");
writeFileSync(join(PUBLIC, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl ? `${baseUrl}${basePath}/sitemap.xml` : `${basePath || ""}/sitemap.xml`}\n`, "utf8");
console.log(`TOOLBOX v0.14.66 sitemap generated: ${urls.length} routes${baseUrl ? ` (${baseUrl})` : " (relative paths; set SITE_URL for production canonical URLs)"}`);

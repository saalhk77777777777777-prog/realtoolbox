/**
 * TOOLBOX v0.14.65 — Deployment/SEO preflight.
 * Checks deployment prerequisites; it does not guarantee AdSense approval.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const check = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

const manifestFiles: string[] = [];
function collectManifests(current: string): void {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) collectManifests(path);
    else if (entry.name === "manifest.ts") manifestFiles.push(path);
  }
}
collectManifests(join(ROOT, "src/tools"));
const manifests = manifestFiles.map((path) => {
  const source = readFileSync(path, "utf8");
  return {
    path,
    source,
    slug: source.match(/slug:\s*"([^"]+)"/)?.[1],
    version: source.match(/version:\s*"([^"]+)"/)?.[1],
    processorImports: [...source.matchAll(/import\("\.\/processor\.ts"\)/g)].length,
  };
});
const packageJson = JSON.parse(read("package.json"));
const versionSource = read("src/version.ts");
const index = read("index.html");
const main = read("src/main.ts");
const sitemap = read("public/sitemap.xml");
const robots = read("public/robots.txt");
const appVersion = versionSource.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const routeFromLoc = (loc: string) => {
  try { return new URL(loc, "https://toolbox.invalid").pathname; }
  catch { return loc; }
};

check("version-sync", appVersion === packageJson.version, `package.json=${packageJson.version}, APP_VERSION=${appVersion ?? "missing"}`);
check("index-title", /<title>[^<]+<\/title>/i.test(index), "index.html has a title");
check("index-description", /<meta\s+[^>]*name="description"[^>]*content="[^"]+"/i.test(index), "index.html has a meta description");
check("index-canonical", /<link\s+[^>]*rel="canonical"[^>]*href="[^"]+"/i.test(index), "index.html has a canonical link");
check("index-robots", /<meta\s+[^>]*name="robots"[^>]*content="[^"]+"/i.test(index), "index.html has robots metadata");
check("app-h1", /<h1>/.test(main), "main.ts renders an H1");
check("sitemap-root", /<loc>[^<]*\/?<\/loc>/.test(sitemap), "sitemap contains the home route");
check("robots-sitemap", /^Sitemap:\s*\S+sitemap\.xml$/mi.test(robots), "robots.txt points to sitemap.xml");
check("robots-allows-root", /^Allow:\s*\/$/mi.test(robots), "robots.txt allows /");

const slugs = manifests.map((item) => item.slug).filter((slug): slug is string => Boolean(slug));
const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => routeFromLoc(match[1]));
const missingSlugs = slugs.filter((slug) => !sitemapPaths.includes(`/tools/${slug}`));
check("tool-sitemap-complete", missingSlugs.length === 0, `${slugs.length} tool routes found; missing=${missingSlugs.length}${missingSlugs.length ? ": " + missingSlugs.join(", ") : ""}`);
const expectedStaticRoutes = ["/", "/about", "/privacy", "/terms", "/contact"];
check("static-routes-sitemap", expectedStaticRoutes.every((route) => sitemapPaths.includes(route)), "required static routes: " + expectedStaticRoutes.join(", "));
const registrationCount = (main.match(/register[A-Z][A-Za-z0-9_]*\(\);/g) ?? []).length;
check("registry-registration-count", registrationCount === manifests.length, `register calls=${registrationCount}, manifests=${manifests.length}`);
check("tool-dynamic-loading", manifests.every((item) => item.processorImports >= 1), `${manifests.filter((item) => item.processorImports >= 1).length}/${manifests.length} manifests dynamically load a processor`);
const missingManifestVersions = manifests.filter((item) => !item.version);
check("manifest-version-present", missingManifestVersions.length === 0, `${manifests.length - missingManifestVersions.length}/${manifests.length} manifests declare their own tool version`);
const staticProcessorImports = manifests.filter((item) => /^import .*from "\.\/processor\.ts";/m.test(item.source)).length;
const staticUiImports = manifests.filter((item) => /^import .*from "\.\/ui\.ts";/m.test(item.source)).length;
check("static-processor-imports", staticProcessorImports === 0, `static processor imports=${staticProcessorImports}`);
check("static-ui-imports", staticUiImports === 0, `static UI imports=${staticUiImports}`);

const failures = checks.filter((item) => !item.ok);
for (const item of checks) console.log(`[${item.ok ? "PASS" : "FAIL"}] ${item.name} — ${item.detail}`);
console.log(`\nTOOLBOX v${appVersion ?? packageJson.version} preflight: ${failures.length === 0 ? "PASS" : "FAIL"} (${checks.length - failures.length}/${checks.length})`);
if (failures.length > 0) process.exit(1);

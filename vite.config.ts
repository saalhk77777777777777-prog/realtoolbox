import { defineConfig } from "vite";

const CANONICAL_SITE_URL = "https://realtoolbox.pages.dev";
const configuredSiteUrl = (process.env.SITE_URL || CANONICAL_SITE_URL).trim().replace(/\/+$/, "");
const basePath = process.env.VITE_BASE_PATH || "/";

// TOOLBOX v0.21.4 — Cloudflare Pages is the canonical production target.
// Alternate deployment environments are rejected by the deployment preflight.
if (configuredSiteUrl !== CANONICAL_SITE_URL) {
  throw new Error(`TOOLBOX deployment target mismatch: SITE_URL must be ${CANONICAL_SITE_URL}, received ${configuredSiteUrl}`);
}
if (basePath !== "/") {
  throw new Error(`TOOLBOX deployment target mismatch: VITE_BASE_PATH must be "/", received ${basePath}`);
}

export default defineConfig({
  base: "/",
  plugins: [{
    name: "toolbox-deployment-canonical",
    transformIndexHtml(html) {
      let result = html.replace('rel="canonical" href="/"', `rel="canonical" href="${CANONICAL_SITE_URL}/"`);
      if (result.includes('property="og:url"')) {
        result = result.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${CANONICAL_SITE_URL}/" />`);
      } else {
        result = result.replace('<meta property="og:type" content="website" />', `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${CANONICAL_SITE_URL}/" />`);
      }
      return result;
    },
  }],
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          core: ["./src/core/toolRegistry.ts", "./src/core/toolRunner.ts"],
        },
      },
    },
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});

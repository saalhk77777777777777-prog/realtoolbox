import { defineConfig } from "vite";

const siteUrl = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "").trim().replace(/\/+$/, "");

// TOOLBOX v0.14.65 — deployment-aware canonical URL and static-first build
export default defineConfig({
  plugins: [{
    name: "toolbox-deployment-canonical",
    transformIndexHtml(html) {
      if (!siteUrl) return html;
      return html.replace('rel="canonical" href="/"', `rel="canonical" href="${siteUrl}/"`);
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

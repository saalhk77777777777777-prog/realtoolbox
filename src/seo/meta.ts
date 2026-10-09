/**
 * TOOLBOX v0.14.66 — SEO helper with project base path (§07, §113.18)
 * 각 public page에 unique title/description/canonical/H1 제공.
 */
export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  h1: string;
}

export function applyMeta(meta: PageMeta): void {
  document.title = meta.title;
  let desc = document.querySelector('meta[name="description"]');
  if (!desc) {
    desc = document.createElement("meta");
    desc.setAttribute("name", "description");
    document.head.appendChild(desc);
  }
  desc.setAttribute("content", meta.description);
  let canon = document.querySelector('link[rel="canonical"]');
  if (!canon) {
    canon = document.createElement("link");
    canon.setAttribute("rel", "canonical");
    document.head.appendChild(canon);
  }
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = meta.canonical.startsWith("/") ? meta.canonical : `/${meta.canonical}`;
  canon.setAttribute("href", `${window.location.origin}${basePath}${path === "/" ? "/" : path}`);
}

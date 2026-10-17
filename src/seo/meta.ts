/** TOOLBOX v0.14.76 — per-page SEO keyword metadata */
export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  keywords?: string[];
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
  let keywordTag = document.querySelector('meta[name="keywords"]');
  if (!keywordTag) {
    keywordTag = document.createElement("meta");
    keywordTag.setAttribute("name", "keywords");
    document.head.appendChild(keywordTag);
  }
  keywordTag.setAttribute("content", [...new Set(meta.keywords ?? [])].join(", "));
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

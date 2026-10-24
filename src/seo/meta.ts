/** TOOLBOX v0.21.3 — Keep canonical and Open Graph metadata synchronized on client-side routes. */
export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  keywords?: string[];
}

function setMetaProperty(property: string, content: string): void {
  let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function applyMeta(meta: PageMeta): void {
  document.title = meta.title;

  let desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!desc) {
    desc = document.createElement("meta");
    desc.setAttribute("name", "description");
    document.head.appendChild(desc);
  }
  desc.setAttribute("content", meta.description);

  let keywordTag = document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
  if (!keywordTag) {
    keywordTag = document.createElement("meta");
    keywordTag.setAttribute("name", "keywords");
    document.head.appendChild(keywordTag);
  }
  keywordTag.setAttribute("content", [...new Set(meta.keywords ?? [])].join(", "));

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = meta.canonical.startsWith("/") ? meta.canonical : `/${meta.canonical}`;
  const canonicalUrl = `${window.location.origin}${basePath}${path === "/" ? "/" : path}`;

  let canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canon) {
    canon = document.createElement("link");
    canon.setAttribute("rel", "canonical");
    document.head.appendChild(canon);
  }
  canon.setAttribute("href", canonicalUrl);

  setMetaProperty("og:title", meta.title);
  setMetaProperty("og:description", meta.description);
  setMetaProperty("og:url", canonicalUrl);
  setMetaProperty("og:type", "website");
}

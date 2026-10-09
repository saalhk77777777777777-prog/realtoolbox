/**
 * TOOLBOX v0.1.0 — Search Index (§36)
 * intent/category/tag 기반 client-side 검색. 문자열 매칭 + 가중치.
 */
import { listTools } from "../core/toolRegistry.ts";

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  category: string;
  score: number;
}

const norm = (s: string) => s.toLowerCase().trim();

export function searchTools(query: string, limit = 10): SearchResult[] {
  const q = norm(query);
  if (!q) return [];
  const out: SearchResult[] = [];
  for (const t of listTools()) {
    let score = 0;
    if (norm(t.title).includes(q)) score += 10;
    if (norm(t.slug).replace(/-/g, " ").includes(q)) score += 8;
    if (t.aliases.some((a) => norm(a).includes(q))) score += 6;
    if (t.keywords.some((k) => norm(k).includes(q))) score += 4;
    if (norm(t.category).includes(q)) score += 2;
    if (norm(t.description).includes(q)) score += 1;
    if (score > 0) {
      out.push({ id: t.id, slug: t.slug, title: t.title, category: t.category, score });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

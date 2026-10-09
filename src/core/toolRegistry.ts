/**
 * TOOLBOX v0.1.0 — Tool Registry (§65)
 * 모든 도구의 단일 진실 공급원. manifest 등록 → search/route/sitemap/related/test 연결.
 */
import type { ToolManifest } from "./types.ts";

const registry = new Map<string, ToolManifest>();
const slugIndex = new Map<string, string>();

export function registerTool(manifest: ToolManifest): void {
  if (registry.has(manifest.id)) {
    throw new Error(`Duplicate tool id: ${manifest.id}`);
  }
  if (slugIndex.has(manifest.slug)) {
    throw new Error(`Duplicate tool slug: ${manifest.slug}`);
  }
  registry.set(manifest.id, manifest);
  slugIndex.set(manifest.slug, manifest.id);
}

export function getTool(id: string): ToolManifest | undefined {
  return registry.get(id);
}

export function getToolBySlug(slug: string): ToolManifest | undefined {
  const id = slugIndex.get(slug);
  return id ? registry.get(id) : undefined;
}

export function listTools(): ToolManifest[] {
  return [...registry.values()];
}

export function relatedTools(id: string): ToolManifest[] {
  const tool = registry.get(id);
  if (!tool) return [];
  return tool.relatedTools
    .map((rid) => registry.get(rid))
    .filter((t): t is ToolManifest => Boolean(t));
}

export function __clearRegistryForTests(): void {
  registry.clear();
  slugIndex.clear();
}

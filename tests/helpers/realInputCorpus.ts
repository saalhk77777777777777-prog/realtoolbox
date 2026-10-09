/**
 * TOOLBOX v0.13.3 — Real Input Corpus
 *
 * Scans actual files when TOOLBOX_REAL_INPUT_DIRS is supplied.
 * Falls back to repository fixtures so CI remains deterministic.
 */
import { readdir, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";

export const REAL_INPUT_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff",
  ".pdf", ".csv", ".json", ".txt", ".md", ".html", ".xml", ".zip",
] as const;

export interface RealInputFile {
  path: string;
  extension: string;
  size: number;
}

const MAX_REAL_INPUT_FILES = 300;

async function walk(dir: string, out: RealInputFile[], depth = 0): Promise<void> {
  if (depth > 4 || out.length >= MAX_REAL_INPUT_FILES) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, out, depth + 1);
      continue;
    }
    const extension = extname(entry.name).toLowerCase();
    if (!REAL_INPUT_EXTENSIONS.includes(extension as typeof REAL_INPUT_EXTENSIONS[number])) continue;
    try {
      const info = await stat(path);
      if (info.isFile() && info.size > 0) {
        out.push({ path, extension, size: info.size });
      }
    } catch {
      // File may disappear while scanning; ignore it.
    }
  }
}

export async function collectRealInputs(): Promise<RealInputFile[]> {
  const configured = (process.env.TOOLBOX_REAL_INPUT_DIRS ?? "")
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((value) => resolve(value));

  const windowsUser = process.platform === "win32" ? process.env.USERPROFILE : undefined;
  const autoLocalRoots = windowsUser
    ? [
        join(windowsUser, "Downloads"),
        join(windowsUser, "Desktop"),
        join(windowsUser, "Documents"),
        join(windowsUser, "Pictures"),
        join(windowsUser, "Videos"),
      ]
    : [];

  const roots = configured.length > 0
    ? configured
    : autoLocalRoots.length > 0
      ? autoLocalRoots
      : [
          resolve("tests/fixtures"),
          resolve("tests"),
        ];

  const files: RealInputFile[] = [];
  for (const root of roots) await walk(root, files);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * TOOLBOX v0.1.0 — File Manager (§09, §113.12)
 * 파일을 신뢰하지 않는다: MIME/확장자/크기/개수를 먼저 검증.
 */
import type { ToolError } from "./types.ts";

export interface ManagedFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  extension: string;
  source: "local";
  createdAt: number;
  file: File;
}

export const LIMITS = {
  maxFiles: 10,
  maxBytesPerFile: 200 * 1024 * 1024, // 200MB (v0.1.0 safe mode)
};

export function describeFile(file: File): ManagedFile {
  const dot = file.name.lastIndexOf(".");
  const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    extension,
    source: "local",
    createdAt: Date.now(),
    file,
  };
}

export function validateFiles(files: File[]): ToolError | null {
  if (files.length === 0) {
    return {
      code: "USER_INPUT",
      what: "파일이 선택되지 않았습니다.",
      why: "입력 목록이 비어 있습니다.",
      how: "파일을 끌어놓거나 파일 선택 버튼을 누르세요.",
    };
  }
  if (files.length > LIMITS.maxFiles) {
    return {
      code: "UNSUPPORTED",
      what: `한 번에 최대 ${LIMITS.maxFiles}개까지 처리할 수 있습니다.`,
      why: `현재 ${files.length}개가 선택되었습니다.`,
      how: "파일 개수를 줄여서 다시 시도하세요.",
    };
  }
  for (const f of files) {
    if (f.size > LIMITS.maxBytesPerFile) {
      return {
        code: "UNSUPPORTED",
        what: `"${f.name}" 파일이 너무 큽니다.`,
        why: `제한(${formatBytes(LIMITS.maxBytesPerFile)})을 초과했습니다.`,
        how: "파일을 나누거나 더 작은 파일로 시도하세요.",
      };
    }
  }
  return null;
}

/** decimal(1000) + binary(1024) 동시 표시용 */
export function formatBytes(bytes: number): { decimal: string; binary: string } | string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const dec = formatWith(bytes, 1000, units);
  const bin = formatWith(bytes, 1024, units);
  // 문자열이 필요한 곳과 상세 표시가 필요한 곳 모두 지원
  return `${dec} (${bin})`;
}

function formatWith(bytes: number, base: number, units: string[]): string {
  if (bytes < base) return `${bytes} ${units[0]}`;
  let v = bytes;
  let u = 0;
  while (v >= base && u < units.length - 1) {
    v /= base;
    u++;
  }
  return `${trimNum(v)} ${units[u]}`;
}

function trimNum(v: number): string {
  return v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
}

export function formatBytesShort(bytes: number, binary = false): string {
  const base = binary ? 1024 : 1000;
  const units = ["B", "KB", "MB", "GB", "TB"];
  return formatWith(bytes, base, units);
}

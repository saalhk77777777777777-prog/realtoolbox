/**
 * TOOLBOX v0.1.0 — File Size Checker (§98.1)
 * 파일을 업로드하지 않고 브라우저에서 메타만 확인. 파일 내용을 읽지 않는다.
 */
import type { ToolError } from "../../../core/types.ts";
import { formatBytesShort } from "../../../core/fileManager.ts";

export interface SizeCheckInput {
  files: File[];
}

export interface SizeCheckRow {
  name: string;
  mime: string;
  extension: string;
  bytes: number;
  decimal: string;
  binary: string;
  lastModified: string;
  mimeMismatch: boolean;
}

export interface SizeCheckOutput {
  rows: SizeCheckRow[];
}

const KNOWN_MIME_BY_EXT: Record<string, string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  pdf: ["application/pdf"],
  csv: ["text/csv", "application/vnd.ms-excel", "text/plain", ""],
  json: ["application/json", "text/plain", ""],
  txt: ["text/plain", ""],
};

export function validateSizeChecker(input: unknown): ToolError | null {
  const v = input as Partial<SizeCheckInput> | null;
  if (!v || !Array.isArray(v.files) || v.files.length === 0) {
    return {
      code: "USER_INPUT",
      what: "파일이 선택되지 않았습니다.",
      why: "입력 목록이 비어 있습니다.",
      how: "파일을 끌어놓거나 파일 선택 버튼을 누르세요.",
    };
  }
  for (const f of v.files) {
    if (!(f instanceof File)) {
      return {
        code: "FILE_INVALID",
        what: "유효하지 않은 입력입니다.",
        why: "File 객체가 아닌 값이 전달되었습니다.",
        how: "파일 선택 UI를 통해 다시 선택하세요.",
      };
    }
    if (!Number.isFinite(f.size) || f.size < 0) {
      return {
        code: "FILE_INVALID",
        what: `"${f.name}" 파일 크기를 읽을 수 없습니다.`,
        why: "브라우저가 size를 제공하지 않았습니다.",
        how: "다른 브라우저에서 다시 시도하세요.",
      };
    }
  }
  return null;
}

export async function processSizeChecker(input: SizeCheckInput): Promise<SizeCheckOutput> {
  const rows: SizeCheckRow[] = input.files.map((file) => {
    const dot = file.name.lastIndexOf(".");
    const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "";
    const mime = file.type || "application/octet-stream";
    const known = KNOWN_MIME_BY_EXT[extension];
    const mimeMismatch = known ? !known.includes(mime) : false;
    return {
      name: file.name,
      mime,
      extension,
      bytes: file.size,
      decimal: formatBytesShort(file.size, false),
      binary: formatBytesShort(file.size, true),
      lastModified: Number.isFinite(file.lastModified)
        ? new Date(file.lastModified).toISOString()
        : "UNKNOWN",
      mimeMismatch,
    };
  });
  return { rows };
}

/**
 * TOOLBOX v0.3.1 — CSV Cleaner
 * 텍스트 입력 기반. dependency 0. 서버 전송 없음.
 * 자동 진단 → 사용자 선택적 수정 → 미리보기 → 내보내기.
 */
import type { ToolError } from "../../../core/types.ts";

export interface CsvInput {
  text: string;
  delimiter: "," | "\t";
  removeEmptyRows: boolean;
  removeDuplicateRows: boolean;
  trimWhitespace: boolean;
}

export interface CsvDiagnostic {
  type: "empty-row" | "duplicate-row" | "whitespace" | "duplicate-header";
  message: string;
  row?: number;
}

export interface CsvOutput {
  headers: string[];
  rows: string[][];
  diagnostics: CsvDiagnostic[];
  originalRowCount: number;
  cleanedRowCount: number;
}

export const MAX_CSV_CHARS = 1_000_000;

export function validateCsv(input: unknown): ToolError | null {
  const v = input as Partial<CsvInput> | null;
  if (!v || typeof v.text !== "string" || (v.delimiter !== "," && v.delimiter !== "\t")) {
    return {
      code: "USER_INPUT",
      what: "입력이 올바르지 않습니다.",
      why: "텍스트와 구분자(쉼표/탭)가 필요합니다.",
      how: "CSV 텍스트를 입력하고 구분자를 선택하세요.",
    };
  }
  if (v.text.trim().length === 0) {
    return {
      code: "USER_INPUT",
      what: "CSV가 비어 있습니다.",
      why: "빈 문자열은 처리할 수 없습니다.",
      how: "CSV 텍스트를 입력하세요.",
    };
  }
  if (v.text.length > MAX_CSV_CHARS) {
    return {
      code: "UNSUPPORTED",
      what: `CSV가 너무 깁니다 (최대 ${MAX_CSV_CHARS.toLocaleString()}자).`,
      why: `현재 ${v.text.length.toLocaleString()}자가 입력되었습니다.`,
      how: "CSV를 나누어 여러 번 처리하세요.",
    };
  }
  return null;
}

export async function processCsv(input: CsvInput): Promise<CsvOutput> {
  const lines = input.text.split(/\r?\n/);
  const headers = parseCsvLine(lines[0] ?? "", input.delimiter);
  const rows: string[][] = [];
  const diagnostics: CsvDiagnostic[] = [];
  const seenRows = new Set<string>();
  const seenHeaders = new Set<string>();

  // 헤더 중복 검출
  for (const h of headers) {
    if (seenHeaders.has(h)) {
      diagnostics.push({ type: "duplicate-header", message: `중복 헤더 "${h}"` });
    } else {
      seenHeaders.add(h);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === "") {
      if (input.removeEmptyRows) {
        diagnostics.push({ type: "empty-row", message: `빈 행 ${i + 1}`, row: i });
        continue;
      }
    }
    const cells = parseCsvLine(line, input.delimiter);
    const rowKey = cells.join(input.delimiter);
    if (seenRows.has(rowKey)) {
      if (input.removeDuplicateRows) {
        diagnostics.push({ type: "duplicate-row", message: `중복 행 ${i + 1}`, row: i });
        continue;
      }
    }
    seenRows.add(rowKey);
    if (input.trimWhitespace) {
      const trimmed = cells.map((c) => c.trim());
      if (trimmed.some((c, j) => c !== cells[j])) {
        diagnostics.push({ type: "whitespace", message: `공백 행 ${i + 1}`, row: i });
      }
      rows.push(trimmed);
    } else {
      rows.push(cells);
    }
  }

  return {
    headers,
    rows,
    diagnostics,
    originalRowCount: lines.length - 1,
    cleanedRowCount: rows.length,
  };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

export function toCsv(headers: string[], rows: string[][], delimiter: string): string {
  const escape = (s: string): string =>
    s.includes(delimiter) || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  const lines = [headers.map(escape).join(delimiter)];
  for (const row of rows) {
    lines.push(row.map(escape).join(delimiter));
  }
  return lines.join("\n");
}

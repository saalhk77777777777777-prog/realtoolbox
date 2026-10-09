/**
 * TOOLBOX v0.1.0 — Tool Contract (§39, §98.0.2)
 * 모든 도구는 UI와 처리 로직을 분리하고 이 contract로만 연결된다.
 */

export type ToolCategory =
  | "file"
  | "image"
  | "pdf"
  | "data"
  | "developer"
  | "text"
  | "design"
  | "utility"
  | "converter";

export type ToolStatus =
  | "idle"
  | "input-ready"
  | "validating"
  | "processing"
  | "validating-result"
  | "completed"
  | "failed"
  | "cancelling"
  | "cancelled";

export type ErrorCode =
  | "USER_INPUT"
  | "UNSUPPORTED"
  | "FILE_INVALID"
  | "MEMORY"
  | "TIMEOUT"
  | "PROCESSING"
  | "BROWSER_LIMIT"
  | "INTERNAL";

export interface ToolError {
  code: ErrorCode;
  /** 무슨 문제인지 */
  what: string;
  /** 왜 발생했는지 */
  why: string;
  /** 어떻게 해결하는지 */
  how: string;
}

export interface ToolCapability {
  /** 브라우저 API 요구사항 (예: "File", "Canvas") */
  requires: string[];
  /** Worker 사용 여부 */
  worker: boolean;
  /** 서버 전송 필요 여부 — 기본 false (Local-first) */
  serverUpload: boolean;
  /** 최대 입력 바이트 (safe mode 기준) */
  maxBytes: number;
}

export interface ToolManifest {
  id: string;
  version: string;
  title: string;
  slug: string;
  category: ToolCategory;
  description: string;
  keywords: string[];
  aliases: string[];
  inputTypes: string[];
  outputTypes: string[];
  localProcessing: boolean;
  relatedTools: string[];
  load: () => Promise<ToolModule>;
}

export interface ToolModule {
  manifest: Omit<ToolManifest, "load">;
  validate: (input: unknown) => ToolError | null;
  process: (input: unknown, ctx: ProcessorContext) => Promise<unknown>;
  render: (mount: HTMLElement) => void;
}

export interface ProcessorContext {
  signal: AbortSignal;
  onProgress?: (ratio: number, step: string) => void;
}

/** Pipeline 전달용 결과물 (§106) */
export interface ToolArtifact {
  kind: string;
  blob?: Blob;
  data?: unknown;
  metadata: Record<string, unknown>;
}

export const TOOL_CONTRACT_VERSION = "0.1.0";

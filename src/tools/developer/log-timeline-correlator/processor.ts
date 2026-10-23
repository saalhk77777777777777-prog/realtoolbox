/** TOOLBOX v0.16.0 — Log Timeline Correlator processor. */
import type { ToolError } from "../../../core/types.ts";

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEvent {
  timestamp: number | null;
  level: LogLevel;
  requestId: string;
  source: string;
  line: number;
  message: string;
  raw: string;
}

export interface LogAnalysis {
  totalEvents: number;
  timestampMissing: number;
  uniqueRequestIds: number;
  errorCount: number;
  warningCount: number;
  events: LogEvent[];
  requests: Array<{
    requestId: string;
    eventCount: number;
    firstTimestamp: number | null;
    lastTimestamp: number | null;
    durationMs: number | null;
    errorCount: number;
  }>;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5,
};

function normalizeLevel(value: unknown, fallbackText = ""): LogLevel {
  const raw = String(value ?? "").toUpperCase();
  if (raw.includes("FATAL") || raw.includes("CRITICAL")) return "FATAL";
  if (raw.includes("ERROR") || raw === "ERR") return "ERROR";
  if (raw.includes("WARN")) return "WARN";
  if (raw.includes("DEBUG")) return "DEBUG";
  if (raw.includes("TRACE")) return "TRACE";
  const match = fallbackText.match(/\b(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|ERR|CRITICAL|FATAL)\b/i);
  return match ? normalizeLevel(match[1]) : "INFO";
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Date.parse(value.trim());
  if (Number.isFinite(n)) return n;
  if (/^\d{10}(?:\.\d+)?$/.test(value.trim())) return Number(value) * 1000;
  if (/^\d{13}$/.test(value.trim())) return Number(value);
  return null;
}

function extractEvent(raw: string, source: string, line: number): LogEvent | null {
  const text = raw.trim();
  if (!text || text.startsWith("--- SOURCE:")) return null;
  let timestamp: number | null = null;
  let level: LogLevel;
  let requestId = "";
  let message = text;
  let json: Record<string, unknown> | null = null;

  if (text.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        json = parsed as Record<string, unknown>;
      }
    } catch {
      // Treat malformed JSON as ordinary text so its content is not discarded.
    }
  }

  if (json) {
    timestamp = parseTimestamp(json.timestamp ?? json.time ?? json["@timestamp"] ?? json.ts ?? json.date);
    level = normalizeLevel(json.level ?? json.severity ?? json.logLevel, text);
    requestId = String(json.request_id ?? json.requestId ?? json.correlation_id ?? json.correlationId ?? json.trace_id ?? json.traceId ?? "");
    message = String(json.message ?? json.msg ?? json.event ?? text);
  } else {
    const timeMatch = text.match(/\b\d{4}-\d{2}-\d{2}[T ][0-9:.]+(?:Z|[+-]\d{2}:?\d{2})?\b|\b\d{13}\b|\b\d{10}(?:\.\d+)?\b/);
    if (timeMatch) timestamp = parseTimestamp(timeMatch[0]);
    level = normalizeLevel(undefined, text);
    const idMatch = text.match(/\b(?:request_id|requestId|correlation_id|correlationId|trace_id|traceId)\s*[=:]\s*["']?([A-Za-z0-9._:-]+)/i);
    if (idMatch) requestId = idMatch[1];
  }

  return { timestamp, level, requestId, source, line, message, raw: text };
}

export function validate(input: unknown): ToolError | null {
  const value = input as { logs?: unknown } | null;
  if (!value || typeof value.logs !== "string" || !value.logs.trim()) {
    return {
      code: "USER_INPUT",
      what: "분석할 로그가 없습니다.",
      why: "로그 원문이 비어 있습니다.",
      how: "로그를 붙여넣거나 파일에서 복사해 입력하세요.",
    };
  }
  if (value.logs.length > 5_000_000) {
    return {
      code: "USER_INPUT",
      what: "로그 입력이 너무 큽니다.",
      why: "단일 분석 입력은 5MB까지 지원합니다.",
      how: "로그를 더 작은 구간으로 나누어 분석하세요.",
    };
  }
  return null;
}

export function process(input: unknown): LogAnalysis {
  const error = validate(input);
  if (error) throw Error(error.what + " " + error.how);
  const logs = (input as { logs: string; source?: string }).logs;
  const defaultSource = String((input as { source?: string }).source ?? "붙여넣기");
  const events: LogEvent[] = [];
  let source = defaultSource;
  let lineNo = 0;

  for (const line of logs.split(/\r?\n/)) {
    const sourceMatch = line.match(/^\s*--- SOURCE: (.+?) ---\s*$/);
    if (sourceMatch) {
      source = sourceMatch[1];
      lineNo = 0;
      continue;
    }
    lineNo++;
    const event = extractEvent(line, source, lineNo);
    if (event) events.push(event);
  }

  events.sort((a, b) => {
    if (a.timestamp === null && b.timestamp === null) return a.line - b.line;
    if (a.timestamp === null) return 1;
    if (b.timestamp === null) return -1;
    return a.timestamp - b.timestamp || a.line - b.line;
  });

  const requestMap = new Map<string, LogEvent[]>();
  for (const event of events) {
    if (!event.requestId) continue;
    const list = requestMap.get(event.requestId) ?? [];
    list.push(event);
    requestMap.set(event.requestId, list);
  }

  const requests = [...requestMap.entries()].map(([requestId, list]) => {
    const timed = list.filter((event) => event.timestamp !== null);
    const firstTimestamp = timed.length ? timed[0].timestamp : null;
    const lastTimestamp = timed.length ? timed[timed.length - 1].timestamp : null;
    return {
      requestId,
      eventCount: list.length,
      firstTimestamp,
      lastTimestamp,
      durationMs: firstTimestamp !== null && lastTimestamp !== null ? lastTimestamp - firstTimestamp : null,
      errorCount: list.filter((event) => LEVEL_RANK[event.level] >= LEVEL_RANK.ERROR).length,
    };
  }).sort((a, b) => b.eventCount - a.eventCount || a.requestId.localeCompare(b.requestId));

  return {
    totalEvents: events.length,
    timestampMissing: events.filter((event) => event.timestamp === null).length,
    uniqueRequestIds: requestMap.size,
    errorCount: events.filter((event) => LEVEL_RANK[event.level] >= LEVEL_RANK.ERROR).length,
    warningCount: events.filter((event) => event.level === "WARN").length,
    events,
    requests,
  };
}

import { describe, expect, it } from "vitest";
import { process as analyzeLogs, validate } from "../src/tools/developer/log-timeline-correlator/processor.ts";
import { manifest } from "../src/tools/developer/log-timeline-correlator/manifest.ts";

describe("TOOLBOX v0.16.0 Log Timeline Correlator", () => {
  it("parses text logs and sorts events by timestamp", () => {
    const result = analyzeLogs({ logs: [
      "2026-10-23T09:00:00.200Z ERROR api request_id=abc timeout",
      "2026-10-23T09:00:00.100Z INFO auth request_id=abc accepted",
    ].join("\n") });
    expect(result.totalEvents).toBe(2);
    expect(result.events[0].level).toBe("INFO");
    expect(result.events[1].level).toBe("ERROR");
    expect(result.uniqueRequestIds).toBe(1);
    expect(result.requests[0].durationMs).toBe(100);
    expect(result.requests[0].errorCount).toBe(1);
  });

  it("parses JSONL timestamps, levels and request identifiers", () => {
    const result = analyzeLogs({ logs: [
      JSON.stringify({ timestamp: "2026-10-23T09:00:00Z", level: "WARN", request_id: "req-1", message: "slow" }),
      JSON.stringify({ ts: 1792746000000, severity: "critical", traceId: "req-2", msg: "failed" }),
    ].join("\n") });
    expect(result.warningCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.requests.map((r) => r.requestId).sort()).toEqual(["req-1", "req-2"]);
  });

  it("keeps malformed JSON as a text event and counts missing timestamps", () => {
    const result = analyzeLogs({ logs: "{not-json}\nplain message" });
    expect(result.totalEvents).toBe(2);
    expect(result.timestampMissing).toBe(2);
  });

  it("rejects empty and oversized input", () => {
    expect(validate({ logs: "  " })?.code).toBe("USER_INPUT");
    expect(validate({ logs: "x".repeat(5_000_001) })?.code).toBe("USER_INPUT");
  });

  it("registers a local-only developer tool at v0.16.0", () => {
    expect(manifest).toMatchObject({ id: "log-timeline-correlator", version: "0.16.0", category: "developer", localProcessing: true });
  });
});

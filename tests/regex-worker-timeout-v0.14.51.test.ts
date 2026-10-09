/** TOOLBOX v0.14.51 — simulated browser Worker timeout tests */
import { afterEach, describe, expect, it, vi } from "vitest";
import { processRegex, REGEX_TIMEOUT_MS, type RegexOutput } from "../src/tools/developer/regex-tester/processor.ts";

type Reply = { ok: true; output: RegexOutput } | { ok: false; error: unknown };

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<Reply>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  posted: unknown;
  constructor(_url: URL, _options: WorkerOptions) { FakeWorker.instances.push(this); }
  postMessage(value: unknown): void { this.posted = value; }
  terminate(): void { this.terminated = true; }
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  FakeWorker.instances = [];
});

describe("TOOLBOX v0.14.51 — Regex Worker isolation", () => {
  it("terminates the Worker at the 750ms deadline and rejects with a safe error", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", FakeWorker);
    const pending = processRegex({ pattern: "a", flags: "", text: "a" });
    const worker = FakeWorker.instances[0];
    expect(worker).toBeTruthy();
    expect(worker.posted).toEqual({ pattern: "a", flags: "", text: "a" });
    const assertion = expect(pending).rejects.toMatchObject({ code: "UNSUPPORTED" });
    await vi.advanceTimersByTimeAsync(REGEX_TIMEOUT_MS);
    await assertion;
    expect(worker.terminated).toBe(true);
  });

  it("terminates the Worker after a successful reply", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const pending = processRegex({ pattern: "a", flags: "", text: "a" });
    const worker = FakeWorker.instances[0];
    const output = { matchCount: 1, truncated: false, matches: [], pattern: "a", flags: "" };
    worker.onmessage?.({ data: { ok: true, output } } as unknown as MessageEvent<Reply>);
    await expect(pending).resolves.toEqual(output);
    expect(worker.terminated).toBe(true);
  });

  it("fails closed when a browser has no Worker support", async () => {
    vi.stubGlobal("Worker", undefined);
    vi.stubGlobal("window", {});
    await expect(processRegex({ pattern: "a", flags: "", text: "a" }))
      .rejects.toMatchObject({ code: "UNSUPPORTED" });
  });
});

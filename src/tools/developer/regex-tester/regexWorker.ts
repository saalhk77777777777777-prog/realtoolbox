/** TOOLBOX v0.14.51 — isolated regex execution worker */
import { processRegexInline, type RegexInput, type RegexOutput } from "./processor.ts";

type WorkerReply =
  | { ok: true; output: RegexOutput }
  | { ok: false; error: unknown };

const workerScope = self as unknown as {
  addEventListener(type: "message", listener: (event: MessageEvent<RegexInput>) => void): void;
  postMessage(message: WorkerReply): void;
};

workerScope.addEventListener("message", async (event) => {
  try {
    const output = await processRegexInline(event.data);
    const reply: WorkerReply = { ok: true, output };
    workerScope.postMessage(reply);
  } catch (error) {
    const reply: WorkerReply = { ok: false, error };
    workerScope.postMessage(reply);
  }
});

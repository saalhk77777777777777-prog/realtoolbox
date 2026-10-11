/** TOOLBOX v0.14.70 — Video to Animated WebP validation tests */
import { describe, expect, it } from "vitest";
import { MAX_VIDEO_BYTES, validateVideoToWebP, type VideoToWebPOptions } from "../src/tools/image/video-to-webp/processor.ts";

const validOptions: VideoToWebPOptions = {
  fps: 12,
  width: 640,
  quality: 75,
  startSeconds: 0,
  durationSeconds: 3,
};

function makeVideo(overrides: Partial<File> = {}): File {
  return {
    name: "clip.mp4",
    type: "video/mp4",
    size: 1024,
    ...overrides,
  } as File;
}

describe("video-to-webp validation — v0.14.70", () => {
  it("requires a selected video", () => {
    expect(validateVideoToWebP(null, validOptions)?.code).toBe("USER_INPUT");
  });

  it("rejects empty files", () => {
    expect(validateVideoToWebP(makeVideo({ size: 0 }), validOptions)?.code).toBe("FILE_INVALID");
  });

  it("rejects files above 150MB", () => {
    expect(validateVideoToWebP(makeVideo({ size: MAX_VIDEO_BYTES + 1 }), validOptions)?.code).toBe("UNSUPPORTED");
  });

  it("rejects non-video MIME types", () => {
    expect(validateVideoToWebP(makeVideo({ type: "image/png" }), validOptions)?.code).toBe("UNSUPPORTED");
  });

  it("rejects clips longer than 15 seconds", () => {
    expect(validateVideoToWebP(makeVideo(), { ...validOptions, durationSeconds: 16 })?.code).toBe("USER_INPUT");
  });

  it("rejects unsupported FPS and quality values", () => {
    expect(validateVideoToWebP(makeVideo(), { ...validOptions, fps: 30 as VideoToWebPOptions["fps"] })?.code).toBe("USER_INPUT");
    expect(validateVideoToWebP(makeVideo(), { ...validOptions, quality: 100 })?.code).toBe("USER_INPUT");
  });

  it("accepts supported settings", () => {
    expect(validateVideoToWebP(makeVideo(), validOptions)).toBeNull();
  });
});

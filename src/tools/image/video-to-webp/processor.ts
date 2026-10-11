/** TOOLBOX v0.14.70 — Fix self-hosted FFmpeg ESM core loading */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type { ToolError } from "../../../core/types.ts";

export interface VideoToWebPOptions {
  fps: 8 | 12 | 15 | 20;
  width: 320 | 480 | 640 | 800;
  quality: number;
  startSeconds: number;
  durationSeconds: number;
}

export interface VideoToWebPResult {
  blob: Blob;
  width: number;
  height: number;
  durationSeconds: number;
  fps: number;
  quality: number;
}

export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
export const MAX_CLIP_SECONDS = 15;
let ffmpeg: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;
let converting = false;

export function validateVideoToWebP(file: File | null, options: VideoToWebPOptions): ToolError | null {
  if (!file) {
    return { code: "USER_INPUT", what: "영상 파일을 선택해 주세요.", why: "변환할 영상이 없습니다.", how: "MP4, MOV, WebM 등의 영상 파일을 선택해 주세요." };
  }
  if (file.size <= 0) {
    return { code: "FILE_INVALID", what: "파일이 비어 있습니다.", why: "선택한 파일에 데이터가 없습니다.", how: "다른 영상 파일을 선택해 주세요." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { code: "UNSUPPORTED", what: "영상 파일이 너무 큽니다.", why: "현재 최대 파일 크기는 150MB입니다.", how: "영상 길이 또는 해상도를 줄인 파일을 사용해 주세요." };
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const supportedExtensions = new Set(["mp4", "mov", "webm", "m4v", "mpeg", "mpg", "avi"]);
  if ((file.type && !file.type.startsWith("video/")) || (!file.type && !supportedExtensions.has(extension))) {
    return { code: "UNSUPPORTED", what: "영상 파일만 변환할 수 있습니다.", why: "선택한 파일 형식을 영상으로 확인하지 못했습니다.", how: "MP4, MOV, WebM 등 영상 파일을 선택해 주세요." };
  }
  if (![8, 12, 15, 20].includes(options.fps) || ![320, 480, 640, 800].includes(options.width)) {
    return { code: "USER_INPUT", what: "변환 설정을 확인해 주세요.", why: "지원하지 않는 FPS 또는 너비입니다.", how: "목록에 있는 FPS와 너비 중에서 선택해 주세요." };
  }
  if (!Number.isFinite(options.quality) || options.quality < 40 || options.quality > 95) {
    return { code: "USER_INPUT", what: "품질 값이 올바르지 않습니다.", why: "품질은 40부터 95까지 설정할 수 있습니다.", how: "품질 값을 40~95 사이로 설정해 주세요." };
  }
  if (!Number.isFinite(options.startSeconds) || options.startSeconds < 0) {
    return { code: "USER_INPUT", what: "시작 시간이 올바르지 않습니다.", why: "시작 시간은 0초 이상이어야 합니다.", how: "0 이상의 숫자를 입력해 주세요." };
  }
  if (!Number.isFinite(options.durationSeconds) || options.durationSeconds < 0.5 || options.durationSeconds > MAX_CLIP_SECONDS) {
    return { code: "USER_INPUT", what: "변환 길이를 확인해 주세요.", why: "한 번에 0.5초부터 15초까지 변환할 수 있습니다.", how: "변환 길이를 0.5~15초 사이로 설정해 주세요." };
  }
  return null;
}

async function getFFmpeg(onStatus: (message: string) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loading) return loading;

  loading = (async () => {
    onStatus("TOOLBOX에 포함된 변환 엔진을 불러오는 중입니다.");
    // v0.14.70: ESM FFmpeg 코어를 외부 CDN이 아닌 사이트 자체 정적 파일에서 불러옵니다.
    const baseURL = `${import.meta.env.BASE_URL}ffmpeg`;
    const instance = new FFmpeg();
    try {
      await instance.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });
    } catch (error) {
      instance.terminate();
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`변환 엔진을 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요. 문제가 계속되면 브라우저 콘솔에서 엔진 파일 요청 오류를 확인해 주세요. (원인: ${detail})`);
    }
    ffmpeg = instance;
    return instance;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

export async function convertVideoToAnimatedWebP(
  file: File,
  options: VideoToWebPOptions,
  onProgress: (progress: number) => void,
  onStatus: (message: string) => void,
): Promise<VideoToWebPResult> {
  if (converting) throw new Error("이미 변환 작업이 진행 중입니다. 완료될 때까지 기다려 주세요.");
  const validation = validateVideoToWebP(file, options);
  if (validation) throw new Error(`${validation.what}\n${validation.how}`);
  converting = true;
  let inputName = "toolbox-video-input";
  const outputName = "toolbox-animated-output.webp";
  let engine: FFmpeg | null = null;
  const progressListener = ({ progress }: { progress: number }) => onProgress(Math.max(0, Math.min(1, progress)));
  try {
    engine = await getFFmpeg(onStatus);
    engine.on("progress", progressListener);
    onStatus("영상을 읽는 중입니다.");
    const bytes = await fetchFile(file);
    const extension = (file.name.includes(".") ? file.name.split(".").pop() : "")?.toLowerCase().replace(/[^a-z0-9]/g, "") || (file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4");
    inputName = `toolbox-video-input.${extension}`;
    await engine.writeFile(inputName, bytes);
    onStatus("움직이는 WebP로 변환하는 중입니다.");
    const vf = `fps=${options.fps},scale='min(${options.width},iw)':-2:flags=lanczos`;
    const exitCode = await engine.exec([
      "-ss", String(options.startSeconds),
      "-t", String(options.durationSeconds),
      "-i", inputName,
      "-vf", vf,
      "-an",
      "-c:v", "libwebp_anim",
      "-quality", String(options.quality),
      "-compression_level", "4",
      "-loop", "0",
      outputName,
    ]);
    if (exitCode !== 0) throw new Error("이 영상은 변환할 수 없습니다. 다른 형식의 영상으로 다시 시도해 주세요.");
    onStatus("변환 결과를 확인하는 중입니다.");
    const data = await engine.readFile(outputName);
    if (!(data instanceof Uint8Array) || data.length === 0) throw new Error("변환 결과가 비어 있습니다. 시작 시간과 변환 길이를 확인해 주세요.");
    const blob = new Blob([data.slice().buffer as ArrayBuffer], { type: "image/webp" });
    const dimensions = await getImageDimensions(blob);
    onProgress(1);
    return { blob, width: dimensions.width, height: dimensions.height, durationSeconds: options.durationSeconds, fps: options.fps, quality: options.quality };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("변환 중 문제가 발생했습니다. 영상 파일을 확인한 뒤 다시 시도해 주세요.");
  } finally {
    if (engine) {
      engine.off("progress", progressListener);
      try { await engine.deleteFile(inputName); } catch { /* ignore cleanup failures */ }
      try { await engine.deleteFile(outputName); } catch { /* ignore cleanup failures */ }
    }
    converting = false;
  }
}

function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("결과 WebP를 읽지 못했습니다. 다시 변환해 주세요."));
    };
    image.src = url;
  });
}

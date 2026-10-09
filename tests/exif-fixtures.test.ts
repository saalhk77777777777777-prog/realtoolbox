/**
 * TOOLBOX v0.7.0 — EXIF Orientation fixture 검증 (Node 범위)
 *
 * 여기서 검증하는 것:
 *   - fixture에 실제 픽셀이 있는가 (기존 fixture는 헤더만 있었다)
 *   - 픽셀이 비대칭인가 (회전/전치/미러를 구분할 수 있는가)
 *   - EXIF Orientation 값이 정확히 1/6/8/5/7인가
 *   - EXIF 주입이 픽셀 데이터를 바꾸지 않았는가
 *   - 실제 JPEG가 shipping PDF 경로(pdf-lib embed + pdf.js)에서 열리고 회전이 반영되는가
 *
 * 여기서 검증하지 **않는** 것:
 *   - 실제 렌더링 픽셀의 방향 (시계/반시계, 미러 여부)
 *   - EXIF orientation 5/7 경로 (캔버스 의존이라 Node에서 실행 불가)
 *
 * 위 항목들은 이후 Chromium 154 브라우저에서 shipping 모듈로 직접 검증했다.
 * 1~8 전부 실제 렌더 픽셀이 EXIF 명세와 일치했다.
 * 상세와 확정된 결함(orientation 2/3/4가 조용히 무시되던 것)의 증거는 tests/fixtures/exif/README.md.
 * 이 파일 자체는 여전히 Node 범위만 다루므로 테스트 수·coverage는 그대로다.
 *
 * 따라서 여기서 끝까지 증명되는 건 구조까지다. 픽셀 방향 검증은 브라우저 몫이며,
 * 그 결과와 남은 한계는 tests/fixtures/exif/README.md에 기록한다.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  PATTERN_W,
  PATTERN_H,
  EXIF_ORIENTATIONS,
  MARKERS,
  decodeJpeg,
  entropyDataOf,
  readExifOrientation,
  samplePixels,
} from "./helpers/exifFixtures.ts";
import { processImageToPdf } from "../src/tools/pdf/image-to-pdf/processor.ts";

type PdfJs = typeof import("pdfjs-dist");
let pdfjs!: PdfJs;
let OPS!: PdfJs["OPS"];

beforeAll(async () => {
  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs = ((mod as { default?: unknown }).default ?? mod) as PdfJs;
  OPS = pdfjs.OPS;
});

const DIR = join(process.cwd(), "tests", "fixtures", "exif");
const read = (name: string) => new Uint8Array(readFileSync(join(DIR, name)));
const jpegOf = (o: number) => read(`orientation-${o}.jpg`);

describe("EXIF fixture — 픽셀 데이터 존재", () => {
  it("fixture 파일이 모두 존재한다", () => {
    for (const o of EXIF_ORIENTATIONS) {
      expect(existsSync(join(DIR, `orientation-${o}.jpg`)), `orientation-${o}.jpg`).toBe(true);
    }
    expect(existsSync(join(DIR, "source.jpg"))).toBe(true);
  });

  it("헤더만 있는 껍데기가 아니라 실제 픽셀 데이터를 담고 있다", () => {
    const jpeg = read("source.jpg");
    const entropy = entropyDataOf(jpeg);
    expect(entropy.length, "SOS 이후 엔트로피 데이터가 비어 있으면 픽셀이 없다").toBeGreaterThan(100);

    const img = decodeJpeg(jpeg);
    expect(img.width).toBe(PATTERN_W);
    expect(img.height).toBe(PATTERN_H);
    // 픽셀이 실제로 복원된다 (단색 이미지가 아니다)
    const distinct = new Set<string>();
    for (let i = 0; i < img.data.length; i += 4) {
      distinct.add(`${img.data[i]},${img.data[i + 1]},${img.data[i + 2]}`);
    }
    expect(distinct.size).toBeGreaterThan(20);
  });

  it("모든 fixture가 디코딩된다", () => {
    for (const o of EXIF_ORIENTATIONS) {
      const img = decodeJpeg(jpegOf(o));
      expect(img.width, `orientation-${o}`).toBe(PATTERN_W);
      expect(img.height, `orientation-${o}`).toBe(PATTERN_H);
    }
  });

  it("방향 마커 픽셀이 기대 색과 일치한다", () => {
    for (const s of samplePixels(decodeJpeg(read("source.jpg")))) {
      const [er, eg, eb] = s.expect;
      const [ar, ag, ab] = s.actual;
      // JPEG는 손실 압축이므로 여유 허용
      expect(Math.abs(er - ar), `${s.name} R`).toBeLessThanOrEqual(40);
      expect(Math.abs(eg - ag), `${s.name} G`).toBeLessThanOrEqual(40);
      expect(Math.abs(eb - ab), `${s.name} B`).toBeLessThanOrEqual(40);
    }
  });
});

describe("EXIF fixture — 비대칭성 (회전/전치/미러 구분 가능)", () => {
  const img = decodeJpeg(read("source.jpg"));
  const at = (x: number, y: number) => {
    const i = (y * img.width + x) * 4;
    return img.data[i] + img.data[i + 1] * 256 + img.data[i + 2] * 65536;
  };
  const changedRatio = (fn: (x: number, y: number) => [number, number]) => {
    let changed = 0;
    let total = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const [sx, sy] = fn(x, y);
        // 64x48 -> 48x64 로 축이 바뀌므로 대상 좌표가 범위를 벗어나면 비교 불가.
        // 이걸 그냥 세면 at()이 undefined(=NaN)를 읽어 항상 "변경됨"으로 세어져
        // 대칭인 이미지가 통과하는 false positive가 된다.
        if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) continue;
        total++;
        if (at(x, y) !== at(sx, sy)) changed++;
      }
    }
    return { ratio: total === 0 ? 1 : changed / total, total };
  };

  it("좌우 반전과 다르다", () => {
    const r = changedRatio((x, y) => [img.width - 1 - x, y]);
    expect(r.total).toBe(img.width * img.height);
    expect(r.ratio).toBeGreaterThan(0.05);
  });
  it("상하 반전과 다르다", () => {
    const r = changedRatio((x, y) => [x, img.height - 1 - y]);
    expect(r.total).toBe(img.width * img.height);
    expect(r.ratio).toBeGreaterThan(0.05);
  });
  it("전치와 다르다", () => {
    const r = changedRatio((x, y) => [y, x]);
    // 공통 유효 영역 = min(W,H)^2. 표본이 적으면 ratio가 공허해진다.
    expect(r.total, "전치 비교 표본 수").toBe(Math.min(img.width, img.height) ** 2);
    expect(r.ratio).toBeGreaterThan(0.05);
  });
  it("좌상단 마커(빨강)와 우하단 마커(초록)는 서로 다른 픽셀이다", () => {
    const tl = MARKERS.find((m) => m.name === "corner-top-left")!;
    const br = MARKERS.find((m) => m.name === "corner-bottom-right")!;
    expect(tl.expect).not.toEqual(br.expect);
  });
});

describe("EXIF fixture — Orientation 값 정확성", () => {
  it("source.jpg에는 EXIF가 없다 (픽셀 원본)", () => {
    expect(readExifOrientation(read("source.jpg"))).toBe(0);
  });

  it("각 fixture의 EXIF Orientation이 정확히 1/6/8/5/7이다", () => {
    for (const o of EXIF_ORIENTATIONS) {
      expect(readExifOrientation(jpegOf(o)), `orientation-${o}.jpg`).toBe(o);
    }
  });

  it("EXIF Orientation 1~8 전부를 갖는다", () => {
    expect([...EXIF_ORIENTATIONS].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("EXIF fixture — 픽셀 데이터 불변", () => {
  it("EXIF 주입은 SOS 이후 픽셀 데이터를 한 바이트도 바꾸지 않는다", () => {
    const baseline = entropyDataOf(read("source.jpg"));
    expect(baseline.length).toBeGreaterThan(100);
    for (const o of EXIF_ORIENTATIONS) {
      const entropy = entropyDataOf(jpegOf(o));
      expect(entropy.length, `orientation-${o}: 픽셀 데이터 길이`).toBe(baseline.length);
      let diff = 0;
      for (let i = 0; i < baseline.length; i++) {
        if (entropy[i] !== baseline[i]) diff++;
      }
      expect(diff, `orientation-${o}: 변경된 픽셀 데이터 바이트`).toBe(0);
    }
  });

  it("fixture는 원본보다 크다 (EXIF 세그먼트가 추가됨)", () => {
    const src = read("source.jpg").length;
    for (const o of EXIF_ORIENTATIONS) {
      expect(jpegOf(o).length, `orientation-${o}`).toBeGreaterThan(src);
    }
  });
});

describe("shipping 경로 — 실제 픽셀 fixture가 image-to-pdf를 통과한다", () => {
  const asJpegFile = (bytes: Uint8Array) =>
    new File([bytes as BlobPart], "photo.jpg", { type: "image/jpeg" });

  /** pdf.js(독립 파서)로 열어 첫 페이지 치수와 회전 여부를 본다 */
  async function firstPage(bytes: Uint8Array) {
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(bytes),
      useWorkerFetch: false,
      disableFontFace: true,
      verbosity: 0,
    }).promise;
    const pg = await doc.getPage(1);
    const vp = pg.getViewport({ scale: 1 });
    const ops = await pg.getOperatorList();

    // pdf.js가 연결 행렬을 여러 transform으로 나누어 내보내므로 누적해야 한다
    const mul = (a: number[], b: number[]) => [
      a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
      a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
      a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5],
    ];
    let acc = [1, 0, 0, 1, 0, 0];
    const stack: number[][] = [];
    let ctm: number[] | null = null;
    for (let i = 0; i < ops.fnArray.length; i++) {
      const op = ops.fnArray[i];
      // q/Q는 CTM 리셋이 아니라 graphics state 스택 push/pop이다.
      if (op === OPS.save) stack.push(acc);
      else if (op === OPS.restore) acc = stack.pop() ?? [1, 0, 0, 1, 0, 0];
      else if (op === OPS.transform) acc = mul(acc, ops.argsArray[i] as number[]);
      else if (op === OPS.paintImageXObject) { ctm = acc; break; }
    }
    return {
      width: vp.width,
      height: vp.height,
      rotated: !!ctm && (Math.abs(ctm[1]) > 1e-6 || Math.abs(ctm[2]) > 1e-6),
      // Math.hypot는 부호를 버린다. 미러(2/3/4)는 회전이 아니라 음수 대각 성분으로 나타나므로
      // 원래 CTM을 그대로 노출해야만 구조적으로 판별된다.
      ctm: ctm ? ([...ctm] as number[]) : null,
      drawn: ctm ? { w: Math.hypot(ctm[0], ctm[1]), h: Math.hypot(ctm[2], ctm[3]) } : null,
    };
  }

  const run = async (o: number) => {
    const out = await processImageToPdf({
      files: [asJpegFile(jpegOf(o))],
      pageSize: "image",
      margin: 0,
    });
    return firstPage(new Uint8Array(await (out.blob as Blob).arrayBuffer()));
  };

  it("orientation 1 — 회전 없음, 원본 치수 유지, 대각 성분은 양수", async () => {
    const p = await run(1);
    expect(p.width).toBe(PATTERN_W);
    expect(p.height).toBe(PATTERN_H);
    expect(p.rotated).toBe(false);
    // 미러 적용이 항등 변환을 깨지 않았는지 확인 (mirror 기본값이 [1,1]인 회귀 방어)
    expect(p.ctm?.[0]).toBeCloseTo(PATTERN_W, 3);
    expect(p.ctm?.[3]).toBeCloseTo(PATTERN_H, 3);
  });

  it("orientation 6 — shipping 파서가 EXIF를 읽어 축을 바꾼다", async () => {
    const p = await run(6);
    expect(p.width).toBe(PATTERN_H);
    expect(p.height).toBe(PATTERN_W);
    expect(p.rotated).toBe(true);
    // 축이 뒤집히지 않았는지: 그려지는 bounding box도 48x64여야 한다
    expect(p.drawn?.w).toBeCloseTo(PATTERN_H, 3);
    expect(p.drawn?.h).toBeCloseTo(PATTERN_W, 3);
  });

  it("orientation 8 — shipping 파서가 EXIF를 읽어 축을 바꾼다", async () => {
    const p = await run(8);
    expect(p.width).toBe(PATTERN_H);
    expect(p.height).toBe(PATTERN_W);
    expect(p.rotated).toBe(true);
    expect(p.drawn?.w).toBeCloseTo(PATTERN_H, 3);
    expect(p.drawn?.h).toBeCloseTo(PATTERN_W, 3);
  });

  it("orientation 2/3/4 — 미러·180°가 음수 대각 성분으로 나타난다", async () => {
    // 2 = 좌우 미러, 3 = 180°, 4 = 상하 미러. 축이 바뀌지 않으므로 "회전"이 아니다.
    // 따라서 rotated 검사로는 절대 잡히지 않는다(CTM의 b·c가 0). 부호로 판별해야 한다.
    const expected: Record<number, [number, number]> = { 2: [-1, 1], 3: [-1, -1], 4: [1, -1] };
    for (const [key, [sx, sy]] of Object.entries(expected)) {
      const o = Number(key);
      const p = await run(o);
      expect(p.width, `orientation-${o} 가로 유지`).toBe(PATTERN_W);
      expect(p.height, `orientation-${o} 세로 유지`).toBe(PATTERN_H);
      expect(p.rotated, `orientation-${o} 는 회전이 아니다`).toBe(false);
      const ctm = p.ctm!;
      expect(Math.sign(ctm[0]), `orientation-${o} a 부호`).toBe(sx);
      expect(Math.abs(ctm[0]), `orientation-${o} a 크기`).toBeCloseTo(PATTERN_W, 3);
      expect(Math.sign(ctm[3]), `orientation-${o} d 부호`).toBe(sy);
      expect(Math.abs(ctm[3]), `orientation-${o} d 크기`).toBeCloseTo(PATTERN_H, 3);
      expect(ctm[1], `orientation-${o} b`).toBeCloseTo(0, 6);
      expect(ctm[2], `orientation-${o} c`).toBeCloseTo(0, 6);
    }
  });

  it("미러는 bbox 크기를 바꾸지 않는다 — hypot 검사는 미러를 놓친다", async () => {
    // 회귀 방어: drawn.w/h는 Math.hypot라 부호를 잃는다. 2와 4는 drawn 값이 1과 같다.
    // 그래서 drawn 크기만 보는 검사는 "2/3/4 미처리" 상태를 통과시킨다.
    const one = await run(1);
    const two = await run(2);
    expect(two.drawn?.w).toBeCloseTo(one.drawn?.w as number, 3);
    expect(two.drawn?.h).toBeCloseTo(one.drawn?.h as number, 3);
    // 그런데 CTM 부호는 다르다 — 이 차이만이 미러 적용의 증거다
    expect(Math.sign(two.ctm![0])).toBeLessThan(0);
    expect(Math.sign(one.ctm![0])).toBeGreaterThan(0);
  });

  it("orientation 5/7은 캔버스 경로로 분기한다 — 방향은 브라우저에서 검증됨", async () => {
    for (const o of [5, 7]) {
      // createImageBitmap을 타므로 Node에서는 여기서 멈춘다.
      // 즉 raw embed로 넘어가지 않고 미러 전치를 캔버스에 맡긴다는 뜻이다.
      // 이 경로의 실제 방향 검증은 브라우저에서 해야 한다.
      await expect(run(o)).rejects.toThrow(/createImageBitmap/);
    }
  });
});
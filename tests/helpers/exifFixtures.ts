/**
 * TOOLBOX v0.7.0 — EXIF Orientation 검증용 비대칭 픽셀 fixture 생성기
 *
 * 왜 이게 필요한가:
 * 기존 pdf-cross-validate fixture는 SOI + APP1/EXIF + SOF0 + EOI 헤더만이라
 * **실제 픽셀이 없다**. 그래서 "회전 행렬이 들어갔다"까지만 증명되고
 * "사람이 봤을 때 올바른 방향으로 렌더링되는가"는 증명할 수 없다.
 *
 * 여기서는 실제 픽셀을 담은 JPEG를 만들어 EXIF 태그만 주입한다.
 * 픽셀이 좌우/상하/대각으로 구분되도록 비대칭 패턴을 쓴다 —
 * 정사각형이나 좌우 대칭 도형으로는 전치·미러·회전을 구분할 수 없다.
 *
 * 주의: 이 모듈은 fixture를 "만들고" 회귀 테스트가 "검증"한다.
 *      브라우저 렌더링 검증은 하지 않는다. (createImageBitmap 기본 imageOrientation
 *      동작 확인 포함 — 브라우저가 필요해 이 세션 범위 밖이다)
 */
import { encode, decode } from "jpeg-js";

export const PATTERN_W = 64;
export const PATTERN_H = 48; // 정사각형이 아니다 — 회전하면 치수가 바뀌어야 구조적으로 판별 가능하다

/** 회전/전치/미러를 모두 구분할 수 있는 비대칭 패턴의 기준 색 */
export const COLORS = {
  bg: [24, 24, 48] as const, // 어두운 남색 배경
  f: [255, 255, 255] as const, // "F" 문자 — 흰색
  tl: [255, 0, 0] as const, // 좌상단 마커 — 빨강
  br: [0, 255, 0] as const, // 우하단 마커 — 초록
  diag: [255, 220, 0] as const, // 좌상→우하 대각선 — 노랑
};

export interface Marker {
  name: string;
  x: number;
  y: number;
  expect: readonly [number, number, number];
}

/**
 * 픽셀 샘플 지점. 회전/전치/미러가 일어나면 이 좌표의 색이 서로 뒤바뀌므로
 * "방향이 뒤집혔는지"를 픽셀로 판별할 수 있다.
 */
export const MARKERS: Marker[] = [
  { name: "f-vertical-stem", x: 8, y: 24, expect: COLORS.f },
  { name: "f-top-arm", x: 20, y: 10, expect: COLORS.f },
  { name: "f-bottom-arm", x: 16, y: 24, expect: COLORS.f },
  { name: "corner-top-left", x: 4, y: 4, expect: COLORS.tl },
  { name: "corner-bottom-right", x: 60, y: 44, expect: COLORS.br },
  { name: "diagonal-mid", x: 32, y: 24, expect: COLORS.diag },
  { name: "background-mid-right", x: 56, y: 8, expect: COLORS.bg },
];

/** RGBA 픽셀 배열을 만든다 (jpeg-js 입력 포맷). */
export function buildOrientationPattern(): Uint8Array {
  const px = new Uint8Array(PATTERN_W * PATTERN_H * 4);
  const put = (x: number, y: number, c: readonly [number, number, number]) => {
    if (x < 0 || y < 0 || x >= PATTERN_W || y >= PATTERN_H) return;
    const i = (y * PATTERN_W + x) * 4;
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
    px[i + 3] = 255;
  };

  for (let y = 0; y < PATTERN_H; y++) {
    for (let x = 0; x < PATTERN_W; x++) put(x, y, COLORS.bg);
  }

  // "F" — 세로줄 + 위쪽/가운데 팔. 좌우·상하가 뒤집히면 형태가 달라진다.
  for (let y = 6; y < 42; y++) for (let x = 6; x < 14; x++) put(x, y, COLORS.f); // stem
  for (let y = 6; y < 14; y++) for (let x = 6; x < 34; x++) put(x, y, COLORS.f); // top arm
  for (let y = 20; y < 28; y++) for (let x = 6; x < 28; x++) put(x, y, COLORS.f); // mid arm

  // 좌상→우하 대각선 (두께 2). 전치/미러면 대각선 방향이 반대가 된다.
  for (let y = 0; y < PATTERN_H; y++) {
    const x = Math.round((y * (PATTERN_W - 1)) / (PATTERN_H - 1));
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(x + dx, y + dy, COLORS.diag);
  }

  // 좌상단 빨강 / 우하단 초록 마커 — 미러면 서로 교환된다.
  // 대각선보다 나중에 그려야 대각선이 마커를 덮지 않는다.
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) put(x, y, COLORS.tl);
  for (let y = PATTERN_H - 8; y < PATTERN_H; y++)
    for (let x = PATTERN_W - 8; x < PATTERN_W; x++) put(x, y, COLORS.br);

  return px;
}

/** 기준 JPEG (EXIF 없음). 이 픽셀이 모든 fixture의 공통 원본이다. */
export function encodeBaselineJpeg(quality = 95): Uint8Array {
  const data = buildOrientationPattern();
  const out = encode({ data, width: PATTERN_W, height: PATTERN_H, quality, useTArray: true });
  return new Uint8Array(out.data);
}

/** SOS(0xFFDA) 이후 = 실제 엔트로피 부호화 픽셀 데이터. EXIF 주입으로 바뀌면 안 된다. */
export function entropyDataOf(jpeg: Uint8Array): Uint8Array {
  for (let i = 0; i < jpeg.length - 1; i++) {
    if (jpeg[i] === 0xff && jpeg[i + 1] === 0xda) return jpeg.slice(i);
  }
  return new Uint8Array(0);
}

/**
 * SOI 바로 뒤에 APP1/EXIF 세그먼트를 삽입해 Orientation만 설정한다.
 * 픽셀 데이터(SOS 이후)는 바이트 단위로 그대로 보존된다.
 */
export function injectExifOrientation(jpeg: Uint8Array, orientation: number): Uint8Array {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error("SOI가 없습니다. JPEG가 아닙니다.");

  // "Exif\0\0" + TIFF little-endian 헤더 + IFD0 엔트리 1개(Orientation) + 다음 IFD=0
  const tiff = [
    0x49, 0x49, 0x2a, 0x00, // "II" + 42
    0x08, 0x00, 0x00, 0x00, // IFD0 오프셋 8
    0x01, 0x00, // 엔트리 1개
    0x12, 0x01, // 태그 0x0112 = Orientation
    0x03, 0x00, // 타입 SHORT
    0x01, 0x00, 0x00, 0x00, // 개수 1
    orientation & 0xff, (orientation >> 8) & 0xff, 0x00, 0x00, // 값(인라인)
    0x00, 0x00, 0x00, 0x00, // 다음 IFD = 0
  ];
  const payload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff]; // "Exif\0\0"
  const app1Len = payload.length + 2; // 길이 필드 2바이트 포함
  const app1 = [0xff, 0xe1, (app1Len >> 8) & 0xff, app1Len & 0xff, ...payload];

  return new Uint8Array([jpeg[0], jpeg[1], ...app1, ...jpeg.slice(2)]);
}

/** 주입된 EXIF Orientation 값을 다시 읽는다 (생성 경로와 독립적인 판독 경로). */
export function readExifOrientation(jpeg: Uint8Array): number {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return 0;
  let off = 2;
  while (off + 4 <= jpeg.length) {
    if (jpeg[off] !== 0xff) {
      off++;
      continue;
    }
    const marker = jpeg[off + 1];
    const size = (jpeg[off + 2] << 8) | jpeg[off + 3];
    if (marker === 0xe1 && off + 10 <= jpeg.length) {
      const isExif =
        jpeg[off + 4] === 0x45 && jpeg[off + 5] === 0x78 && jpeg[off + 6] === 0x69 && jpeg[off + 7] === 0x66;
      if (isExif && jpeg[off + 8] === 0 && jpeg[off + 9] === 0) {
        return readTiffOrientation(jpeg, off + 10);
      }
    }
    if (marker === 0xda) return 0;
    off += 2 + size;
  }
  return 0;
}

function readTiffOrientation(jpeg: Uint8Array, tiff: number): number {
  if (tiff + 8 > jpeg.length) return 0;
  const le = jpeg[tiff] === 0x49 && jpeg[tiff + 1] === 0x49;
  if (!le) return 0; // 이 fixture는 little-endian만 생성한다
  const u16 = (p: number) => (jpeg[p] | (jpeg[p + 1] << 8)) & 0xffff;
  const u32 = (p: number) => (jpeg[p] | (jpeg[p + 1] << 8) | (jpeg[p + 2] << 16) | (jpeg[p + 3] << 24)) >>> 0;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > jpeg.length) return 0;
  for (let i = 0, n = u16(ifd); i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > jpeg.length) break;
    if (u16(e) === 0x0112) return u16(e + 8);
  }
  return 0;
}

/** 디코딩해서 픽셀이 살아있는지 확인 (fixture가 "헤더만 있는 껍데기"가 아닌지). */
export function decodeJpeg(jpeg: Uint8Array): { data: Uint8ClampedArray; width: number; height: number } {
  const out = decode(jpeg, { useTArray: true, formatAsRGBA: true, tolerantDecoding: true });
  return { data: out.data as Uint8ClampedArray, width: out.width, height: out.height };
}

/** 브라우저 렌더링 검증에서 "방향이 맞는지" 판별할 때 쓸 수 있는 픽셀 표본 목록. */
export function samplePixels(img: { data: Uint8ClampedArray; width: number; height: number }) {
  return MARKERS.map((m) => {
    const i = (m.y * img.width + m.x) * 4;
    return { name: m.name, expect: m.expect, actual: [img.data[i], img.data[i + 1], img.data[i + 2]] };
  });
}

export const EXIF_ORIENTATIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

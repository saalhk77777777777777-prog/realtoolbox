/**
 * EXIF Orientation fixture 생성기 — 브라우저 검증 전에 1회 실행해 픽셀 JPEG를 만들어둔다.
 *   npx tsx scripts/generate-exif-fixtures.ts
 *
 * 회귀 테스트(tests/exif-fixtures.test.ts)가 이 파일들을 *다시 생성하지 않고 검증*한다.
 * 픽셀이 바뀌면 테스트가 실패하므로, 여기서 리제네레이션해야 의도한 픽셀이 유지된다.
 *
 * 브라우저 렌더링 검증은 하지 않는다. 픽셀 데이터 준비까지만이 이 스크립트의 책임이다.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  PATTERN_W,
  PATTERN_H,
  EXIF_ORIENTATIONS,
  encodeBaselineJpeg,
  injectExifOrientation,
  readExifOrientation,
  entropyDataOf,
  decodeJpeg,
  samplePixels,
} from "../tests/helpers/exifFixtures.ts";

const OUT_DIR = join(process.cwd(), "tests", "fixtures", "exif");
mkdirSync(OUT_DIR, { recursive: true });

const baseline = encodeBaselineJpeg();
const baselineEntropy = entropyDataOf(baseline);

if (baselineEntropy.length === 0) {
  throw new Error("기준 JPEG에 픽셀 데이터(SOS 이후)가 없습니다 — 헤더만 있는 fixture가 됨");
}

// 기준 이미지(EXIF 없음) = 픽셀 원본 JPEG. 모든 fixture의 공통 원본.
writeFileSync(join(OUT_DIR, "source.jpg"), baseline);

const decoded = decodeJpeg(baseline);
if (decoded.width !== PATTERN_W || decoded.height !== PATTERN_H) {
  throw new Error(`디코딩 크기 불일치: ${decoded.width}x${decoded.height}`);
}

console.log(`기준 JPEG: ${baseline.length}바이트, 픽셀 데이터 ${baselineEntropy.length}바이트`);
console.log(`디코딩 샘플 픽셀 (${decoded.width}x${decoded.height}):`);
for (const s of samplePixels(decoded)) {
  const [er, eg, eb] = s.expect;
  const [ar, ag, ab] = s.actual;
  const tol = 40; // JPEG는 손실이므로 여유를 둔다
  const ok = Math.abs(er - ar) <= tol && Math.abs(eg - ag) <= tol && Math.abs(eb - ab) <= tol;
  console.log(`  ${ok ? "OK " : "!! "} ${s.name.padEnd(20)} expect=${s.expect.join(",")} actual=${s.actual.join(",")}`);
}

for (const o of EXIF_ORIENTATIONS) {
  // orientation 1도 명시적으로 주입한다. 카메라가 1을 기록하는 경우가 있고,
  // "EXIF 값이 정확히 1/6/8/5/7인지" 검증하려면 태그가 있어야 한다.
  const jpeg = injectExifOrientation(baseline, o);
  const read = readExifOrientation(jpeg);
  if (read !== o) throw new Error(`orientation ${o} 주입 후 판독 결과가 ${read}`);
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error(`orientation ${o}: SOI 깨짐`);

  // 픽셀 데이터 보존 확인
  const entropy = entropyDataOf(jpeg);
  if (entropy.length !== baselineEntropy.length) {
    throw new Error(`orientation ${o}: 픽셀 데이터 길이 변경 ${baselineEntropy.length} -> ${entropy.length}`);
  }
  for (let i = 0; i < entropy.length; i++) {
    if (entropy[i] !== baselineEntropy[i]) {
      throw new Error(`orientation ${o}: 픽셀 데이터 ${i}바이트에서 변경됨`);
    }
  }

  writeFileSync(join(OUT_DIR, `orientation-${o}.jpg`), jpeg);
  console.log(`orientation-${o}.jpg  ${jpeg.length}바이트  EXIF=${read}  픽셀데이터 보존 OK`);
}

console.log(`\n생성 위치: ${OUT_DIR}`);

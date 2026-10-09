# EXIF Orientation 검증 fixture

브라우저 렌더링 검증에 대비해 **픽셀 데이터가 담긴 JPEG fixture**를 준비한 곳이다.

## 왜 필요했나

기존 `tests/pdf-cross-validate.test.ts`의 fixture는 `SOI + APP1/EXIF + SOF0 + EOI` 헤더만이었다.
**실제 픽셀이 없다.** 그래서 증명할 수 있었던 것은 "EXIF 태그를 읽고 PDF에 변환 행렬을 넣었다"까지였고,
"사람이 봤을 때 올바른 방향으로 렌더링되는가"는 증명할 수 없었다.

## 픽셀 패턴 (64×48, 비대칭)

| 요소 | 색 | 역할 |
| --- | --- | --- |
| "F" 문자 (세로줄 + 위/가운데 팔) | 흰색 | 좌우·상하가 뒤집히면 형태가 달라짐 |
| 좌상단 정사각형 | 빨강 | 미러면 우하단과 교환됨 |
| 우하단 정사각형 | 초록 | 미러면 좌상단과 교환됨 |
| 좌상→우하 대각선 | 노랑 | 전치/미러면 대각선 방향이 반대가 됨 |
| 배경 | 어두운 남색 | 대비 기준 |

- **정사각형이 아니다** (64×48). 회전하면 치수가 바뀌어야 구조적으로 회전 여부를 판별할 수 있다.
- 좌우 반전 / 상하 반전 / 전치는 픽셀 변경 비율로 구분된다 (`tests/exif-fixtures.test.ts`).
  측정값: 좌우 87.50% · 상하 71.09% · 전치 83.33% (기준 5%)

### 전치 비교의 표본 수 제한

전치는 `64×48 → 48×64` 로 축이 바뀌므로 유효 좌표는 공통 영역인 `48×48 = 2304` 픽셀뿐이다.
테스트는 **범위를 벗어난 좌표를 건너뛰고** `total === 48²` 인지 확인한다.

이 제한이 없으면 `at()`이 범위 밖에서 `undefined`를 읽어 `NaN`이 되고, `at(x,y) !== NaN`이 항상 참이어서
**대칭인 이미지가 "변경됨"으로 집계되어 통과하는 false positive**가 된다. 수정 전 실제로 그랬다.

### 대칭이면 0으로 보고되는지 확인

같은 비교 함수를 항등 변환에 적용하면 변경 비율이 `0.00%`로 측정된다.
즉 이 검사는 대칭 이미지에서 실제로 실패한다(공허 통과 아님).

## 파일

| 파일 | 내용 |
| --- | --- |
| `source.jpg` | EXIF 없는 픽셀 원본 JPEG (모든 fixture의 기준) |
| `orientation-1.jpg` | Orientation = 1 (정상) |
| `orientation-2.jpg` | Orientation = 2 (좌우 미러) |
| `orientation-3.jpg` | Orientation = 3 (180°) |
| `orientation-4.jpg` | Orientation = 4 (상하 미러) |
| `orientation-5.jpg` | Orientation = 5 (전치) |
| `orientation-6.jpg` | Orientation = 6 (시계 90°) |
| `orientation-7.jpg` | Orientation = 7 (전차) |
| `orientation-8.jpg` | Orientation = 8 (시계 270°) |

## 재생성

```powershell
npx tsx scripts/generate-exif-fixtures.ts
```

회귀 테스트는 이 파일들을 **다시 생성하지 않고 검증만** 한다. 픽셀이 바뀌면 테스트가 실패하므로
의도한 픽셀을 유지하려면 위 스크립트를 다시 돌려야 한다.

생성은 결정적이다. 재실행해도 8개 파일이 모두 byte-identical로 유지된다 (SHA-256 확인).

## ✅ 여기서 검증됨 (Node)

- fixture 파일 존재
- **실제 픽셀 데이터 존재** — SOS 이후 엔트로피 데이터 > 100바이트, 디코딩 후 색상 20종 이상
- **비대칭 패턴** — 좌우/상하 반전·전치와 각각 다름 (변경 비율 87.50% / 71.09% / 83.33%)
- 마커 픽셀이 기대 색과 일치 (JPEG 손실 허용 오차 40)
- **EXIF Orientation 값이 정확히 1~8 전부** (`readExifOrientation` — 주입 경로와 독립된 판독 경로)
- **픽셀 불변** — EXIF 주입이 SOS 이후 픽셀 데이터를 한 바이트도 바꾸지 않음
- **shipping 경로 통과** — 실제 픽셀 fixture가 `image-to-pdf`를 거쳐 pdf-lib embed + pdf.js로 열림
  - orientation 1: 회전 없음, 64×48 유지, CTM 대각 성분이 양수
  - orientation 6 / 8: 축이 교환되고(48×64) 회전 행렬이 들어가며 bounding box도 48×64
  - orientation 2 / 3 / 4: 축은 그대로고 **CTM 대각 성분의 부호**로 미러가 표현됨
  - orientation 5 / 7: 캔버스 경로로 분기함을 확인

### 미러는 hypot 검사로는 잡히지 않는다

CTM의 `drawn.w/h`는 `Math.hypot`로 계산되는데, 이는 **부호를 버린다**.
2와 4는 회전(`b`·`c`)이 아니라 음수 대각 성분으로 나타나므로 `rotated`가 false이고
`drawn` 크기는 orientation 1과 동일하다.

즉 크기·회전만 보는 검사는 "2/3/4 미처리" 상태를 통과시킨다. 이 함정이 실제로 작동했다.
그래서 `firstPage()`가 원래 CTM을 그대로 노출하게 하고 부호로 판별한다.

## ✅ 여기서 검증됨 (실제 브라우저, Chromium 154)

Vite 개발 서버(`localhost:5173`)에 shipping 모듈을 그대로 dynamic import해 실행했다.
검증 대상은 테스트용 재현 코드가 아니라 **실제로 배포되는 경로**다.

```
processImageToPdf(JPEG fixture) → PDF → processPdfToImage(pdf.js) → PNG → 픽셀 판정
```

`scale: 4`로 렌더한 결과다.

| fixture | 렌더 크기 | 모서리 (TL/TR/BL/BR) | EXIF 명세 예측 | 결과 |
| --- | --- | --- | --- | --- |
| orientation-1 | 256×192 가로 | red/–/–/green | 빨강 TL · 초록 BR | 통과 |
| orientation-2 | 256×192 가로 | –/red/green/– | 빨강 TR · 초록 BL | 통과 |
| orientation-3 | 256×192 가로 | green/–/–/red | 초록 TL · 빨강 BR | 통과 |
| orientation-4 | 256×192 가로 | –/green/red/– | 초록 TR · 빨강 BL | 통과 |
| orientation-5 | 192×256 세로 | red/–/–/green | 빨강 TL · 초록 BR | 통과 |
| orientation-6 | 192×256 세로 | –/red/green/– | 빨강 TR · 초록 BL | 통과 |
| orientation-7 | 192×256 세로 | green/–/–/red | 초록 TL · 빨강 BR | 통과 |
| orientation-8 | 192×256 세로 | –/green/red/– | 초록 TR · 빨강 BL | 통과 |

**8/8 통과.** 크기까지 함께 검사하므로 축 교환(1/2/3/4 = 가로, 5/6/7/8 = 세로)도 검증된다.
5/1, 6/2, 7/3, 8/4는 모서리 배치가 같아 크기로만 구분된다.

문자 지도에서 "F"의 방향과 노랑 대각선의 방향까지 EXIF 명세와 일치한다.
행렬만으로는 "회전임과 미러임이 구별되지 않는다"는 한계가 이제 **픽셀로 해소**됐다.

### `createImageBitmap` 기본 동작 (Chromium 154)

| 항목 | 관찰 |
| --- | --- |
| PNG `imageOrientation: "flipY"` | 반영됨 → 옵션 plumbing 유효 |
| EXIF=6 JPEG + `none` / `"from-image"` / `"flipY"` | **모두** 48×64 |
| `<img>` `naturalWidth×naturalHeight` | 48×64 |

즉 Chromium은 JPEG EXIF를 `imageOrientation` 값과 무관하게 항상 적용한다.
orientation 5/7 캔버스 경로의 전제("`createImageBitmap`이 EXIF를 적용한다")가 이 브라우저에서 참임을 확인했다.

### 두 경로가 실제로 갈라졌는지

PDF 크기가 경로를 드러낸다.

| fixture | PDF 크기 | 경로 |
| --- | --- | --- |
| orientation 1 / 2 / 3 / 4 / 6 / 8 | 2.4 KB | 원본 JPEG 무손실 embed |
| orientation 5 / 7 | 4.0 KB | 캔버스 경유 PNG embed |

**orientation 5/7은 여기서 처음 실행됐고** 올바른 방향으로 나왔다.
또한 6/8이 "원본 embed + PDF 회전"인데도 이중 회전이 없다 → pdf.js가 JPEG EXIF를 추가로 적용하지 않음을 확인했다.

## 🐛→✅ 수정됨: orientation 2 / 3 / 4 가 조용히 무시되던 결함

### 결함의 증거 (수정 전)

`image-to-pdf/processor.ts`가 회전하는 값은 6/8뿐이고(`processor.ts:168`),
캔버스 경로로 보내는 값은 5/7뿐이다(`processor.ts:166`).
2/3/4는 `rotate = 0` + 원본 embed로 떨어지고, pdf.js는 JPEG EXIF를 적용하지 않으므로
**오류 없이 잘못된 방향으로 출력되었다.**

리포지토리 파일을 추가하지 않고, `source.jpg`에 APP1/EXIF만 주입해 shipping 경로로 돌렸다.

- **통제 검사**: 주입한 orientation 6이 디스크 fixture와 크기·모서리·픽셀 서명까지 동일 → 주입기가 유효
- 주입한 orientation 1 / 2 / 3 / 4가 **모두** 256×192 가로 · 빨강 TL · 초록 BR로 동일하게 렌더됨
- EXIF 명세로는 2는 빨강이 TR, 3은 BR, 4는 BL로 이동해야 한다 → 세 값 모두 무시
- 주입한 orientation 3이 orientation 1과 **바이트 동일**한 점이 결정적 증거

### 수정

음수 scale로 미러를 표현한다. pdf-lib의 `scale(sx, sy)`는 음수 크기를 거부하지 않고
그대로 `cm(sx, 0, 0, sy, 0, 0)`로 내보내므로, 축이 그대로인 2/3/4를 정확히 표현할 수 있다.

| Orientation | 부호 (sx, sy) | drawImage |
| --- | --- | --- |
| 1 | (+1, +1) | `x=left, y=bottom, w, h` (변경 없음) |
| 2 | (−1, +1) | `x=right, y=bottom, −w, h` |
| 3 | (−1, −1) | `x=right, y=top, −w, −h` |
| 4 | (+1, −1) | `x=left, y=top, w, −h` |

원점은 `mirror[i] > 0 ? left/right : pageW − left`로 반대쪽 끝에 붙여,
페이지 안에서 뒤집힌 그림이 보이게 한다. 5/7 캔버스 경로와 6/8 회전 경로는 건드리지 않았다.

### 수정 후

- Node: `firstPage()`가 원래 CTM을 노출하고, 2/3/4의 **대각 성분 부호**로 검증한다.
- 브라우저: 위 표대로 **8/8 통과**. 2/3/4 모두 명세 위치로 마커가 이동한다.
- 회귀 테스트 `36 files / 687 tests` 통과 (기존 685 + 미러 판별 2)

## ❌ 여기서 검증되지 않음

| 항목 | 이유 |
| --- | --- |
| Safari / Firefox 동작 | Chromium 154만 측정. 5/7이 `createImageBitmap`의 EXIF 적용에 의존하므로 브라우저별 확인 필요 |
| Chrome 기본 PDF 뷰어 vs 앱 pdf.js | 앱 렌더러만 측정 |
| 실사용 JPEG (카메라 원본) | 압축·EXIF 배치가 다른 실파일은 미측정 |

## 현재 EXIF 기능 상태

**Orientation 1~8 전부 실제 브라우저 픽셀로 검증됨 (Chromium 154)**

- 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8: 렌더 크기·모서리 마커가 EXIF 명세와 일치
- 2 / 3 / 4: 음수 scale 미러로 수정 완료
- 5 / 7: 캔버스 경로가 브라우저에서 실제로 동작함을 확인
- 6 / 8: 원본 embed + PDF 회전, 이중 회전 없음

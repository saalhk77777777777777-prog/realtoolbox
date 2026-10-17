## v0.14.79 — 2026-10-17 — APK visual preview, ZIP/Unity archive explorer, AdSense integration
- Added a phone-shaped home-screen preview and best-effort app icon discovery from image resources in APKs.
- Added APK image resource selection and browser-local preview for common raster image types.
- Added a generic ZIP-based archive explorer for ZIP-compatible OBB/AAB/archive exports, including filtered file list, text/image preview, resource replacement, and modified ZIP export.
- Explicitly identifies unsupported UnityFS/native Unity bundle formats instead of claiming universal Unity extraction.
- Added opt-in AdSense Auto ads loader, gated behind a valid `VITE_ADSENSE_CLIENT_ID`; no publisher ID is hardcoded.
- Expanded privacy copy for the potential use of Google advertising cookies/technologies and added `ADSENSE_SETUP.md`.
- APK output remains unsigned and the phone mock is not a runtime emulator.
- Version: `0.14.79`.

## v0.14.78 — 2026-10-17 — APK Editor Manifest editing and resource safety
- Added editable package name, versionName, and versionCode for plain-text XML AndroidManifest.xml files; values are validated and XML-escaped before being queued as a replacement.
- Binary AndroidManifest AXML remains read-only; no binary XML compiler, APK signing, or ZIP alignment is claimed.
- Added ZIP metadata-based decompressed-size guardrails (128 MiB per entry, 512 MiB total) and 128 MiB replacement-file limit.
- Clarified that ZIP size metadata is a defensive heuristic, not complete malicious-archive detection.
- Added tests for text-manifest edits, XML escaping, and invalid values.
- Version: `0.14.78`.

## v0.14.77 — 2026-10-17 — Browser-local APK Editor MVP
- Added APK ZIP structure inspection, basic text-manifest metadata extraction, best-effort binary-manifest string inspection, DEX header/string analysis, and resource-file replacement.
- All selected APK contents are processed locally in the browser; APK size limit is 200 MiB.
- Export rebuilds an unsigned ZIP package and removes stale JAR signature files. AndroidManifest binary editing/compilation, DEX decompilation, APK v2/v3 signing, and ZIP alignment are explicitly not supported in this browser-only MVP.
- Added focused processor tests and JSZip dependency.
- Version: `0.14.77`.

## v0.14.76 — 2026-10-17 — SEO keyword improvements
- Updated homepage title and description to naturally target free online tools, file conversion, image compression, PDF, JSON, CSV, text, and developer tools.
- Added per-page keyword metadata derived from each tool's title, manifest keywords, and category.
- Expanded WebApplication structured data with a description and feature list.
- Note: Google ignores the meta keywords tag for ranking; page titles, descriptions, and useful visible content are the primary focus.
- Version: `0.14.76`.

## v0.14.75 — 2026-10-17 — Remove homepage hero panel
- Removed the large introductory hero box from the initial homepage view so tool sections appear immediately.
- Kept the global header search, category sidebar, quick-start/favorites/recent sections, and all tools intact.
- Version: `0.14.75`.

## v0.14.74 — 2026-10-17 — Search UI, Tabi photo shortcut, and WebP engine reliability
- Fixed the global search input overflowing its header by overriding generic form-control styles and tightening responsive flex sizing.
- Typing `tabi` now opens the same final photo reward as the footer easter egg; the footer button label stays exactly `아무 의미 없는 버튼` without counters or renaming.
- Improved self-hosted FFmpeg loading with explicit base-path URL resolution and Blob URL handling for the ESM core/WASM, with retry-safe failure cleanup.
- Improved video preview error handling and object-URL cleanup when replacing selected files.
- Version: `0.14.74`; run typecheck, tests, SEO preflight, and production build before deploying.


## v0.14.71 — 2026-10-16 — UI polish and custom branding
- Replaced the plain T brand mark with a custom geometric toolbox symbol in the header and favicon.
- Reduced excessive shadows and rounded surfaces; introduced a calmer slate/blue accent palette.
- Added subtle content/card entrance motion and clearer hover/press feedback.
- Preserved reduced-motion preferences and all existing tool functionality.

## v0.14.70 — 2026-10-11 — Fix video-to-WebP engine loading
- Fixed the FFmpeg core format mismatch: the module worker dynamically imports the core as an ES module, so the self-hosted core file now uses the ESM build rather than the UMD build.
- Kept the existing self-hosted WASM engine and paths; no external CDN is required for the engine.
- Added a clearer Korean engine-load error with the underlying cause for troubleshooting.
- Updated the UI privacy/help text to accurately describe the first-run ~31 MB local engine download.
- Validation: `npm run build` passed; `tests/video-to-webp.test.ts` passed (7/7); ESM core syntax check and `git diff --check` passed. Actual browser conversion and production deployment still need verification.

## v0.14.69 — 2026-10-10 — Naver Search Advisor verification
- Added the user-provided Naver site-verification HTML file at `public/naver232c2a95c11a1eb42171c442f76609be.html` so Vite copies it to the deployed site root.
- Preserved the verification filename and token exactly as provided.
- No application UI or tool behavior changed.

## v0.14.68 — 2026-10-10 — Google Search Console verification
- Added the exact Google-provided verification file at `public/google66bb344ab51b92b5.html` so the build publishes it at the site root.
- Kept the original verification token and filename unchanged.
- No application UI or tool behavior changed.

## v0.14.67 — 2026-10-10 — UI scale, contact, and feedback collection
- Changed: footer tagline “가능한 작업은 브라우저 안에서 처리합니다” 제거 및 중복 사이드바 상태 문구 제거
- Changed: 데스크톱 전체 UI 125% 확대, 모바일 반응형 레이아웃은 원래 배율 유지
- Added: 문의 페이지에 saalhk77777777777777@gmail.com 및 mailto “메일로 문의하기” 링크
- Added: 서로 다른 도구 3개를 연 뒤 1회 피드백 팝업, 불편 사항·도구 아이디어·기타 의견·선택 이메일 수집
- Added: Netlify Forms 정적 폼 정의 파일 `public/__forms.html`, URL-encoded AJAX 제출 및 스팸 허니팟
- Privacy: 피드백은 사용자가 직접 제출한 내용만 전송; 도구 파일이나 파일 내용은 수집하지 않음
- Verification: `npm run build` passed; `npm test` passed (55 files, 795 tests); `git diff --check` passed

## v0.14.66 — GitHub Pages Project Path Support
- Configured Vite for the existing `TOOLBOX` repository path (`/TOOLBOX/`) rather than assuming a user-site root.
- Updated in-app links, client-side routing, canonical URLs, sitemap/robots paths, manifest assets, the Tabi Easter-egg asset, and 404 recovery for project-site deployment.
- Updated GitHub Actions to build and publish with the correct repository subpath.
- Kept existing Netlify configuration and all tools intact.

## v0.14.65 — GitHub Pages Deployment Preparation
- Added a GitHub Actions workflow that runs typecheck, all tests, deployment preflight, production build, and GitHub Pages deployment on pushes to `main`.
- Added the GitHub Pages `404.html` route-recovery fallback and client-side restoration for deep links.
- Added `.nojekyll` and standard local build/dependency ignores.
- Preserved the existing Netlify configuration; GitHub Pages uses the account root-site URL `https://<username>.github.io`.
- Bumped the app/package version to v0.14.65.

## v0.14.64 — Deployment Preparation
- Added explicit Netlify build/publish settings and pinned the build runtime to Node.js 22.
- Generate sitemap.xml and robots.txt from all tool manifests, with absolute URLs when `SITE_URL` or the Netlify site URL is available.
- Set the canonical homepage URL during production builds when a site URL is available.
- Corrected deployment preflight checks: each tool keeps its own introduction version, and some PDF tools intentionally import their processor more than once.
- Updated README deployment and verification instructions.

## v0.14.63 — Self-hosted FFmpeg Core
- Bundled FFmpeg core JavaScript and WebAssembly files under `public/ffmpeg/` so conversion no longer depends on an external CDN at runtime.
- Updated the converter to load the engine from TOOLBOX's own static asset path, respecting Vite's base URL.
- Included upstream license notices for the bundled core; deployment size increases by about 31 MB.

## v0.14.61 — Video to Animated WebP
- Added a dedicated video-to-animated-WebP tool with clip start/duration, FPS, width, and quality controls.
- Converts video locally in the browser with FFmpeg WebAssembly; the video itself is not uploaded. The conversion engine is fetched from jsDelivr on first use.
- Added animated preview, progress/status feedback, output-size details, and WebP download.
- Limits input files to 150MB and clips to 15 seconds to reduce browser memory pressure.

## v0.14.59 — Text Field Styling
- Refined text inputs, search fields, and textareas with a warm surface, clearer borders, and a restrained blue focus ring.
- No changes to buttons, cards, navigation, layout, or tool behavior.

## v0.14.58 — Natural Korean Copy
- Replaced the generic English landing-page eyebrow and casual slogan with direct, polite Korean copy.
- Updated homepage, search placeholders, category headings, empty states, and related-tool helper text to use consistent 존댓말.
- Kept tool-specific descriptions tied to each tool's actual function instead of replacing them with generic promotional phrases.

## v0.14.57 — UI Cleanup & Crafted Visual Refresh
- Removed the mistakenly added Tabi photo shelf from the home screen, including its upload logic and styles.
- Refined the global interface with a warmer paper-like background, restrained blue accents, tighter radii, simpler shadows, clearer typography, and more consistent card/navigation states.
- Preserved tool behavior and the separate 66-click Tabi reward photo feature.

## v0.14.56 — Tabi Reward Confirm Screen
- The 66-click reward remains visible until the confirmation link is selected.
- The final screen shows the reward photo, a **확인** link to Tabi's Chzzk channel, and underlined **진짜 확인버튼** text below it.
- Hides the usual close button, backdrop dismissal, and Escape dismissal on the final reward screen.

## v0.14.55 — Tabi Easter Egg Reward Photo Folder

- Added public/images/tabi/ as the dedicated folder for the 66-click “개귀여운 타비 사진” reward image.
- The reward modal now tries /images/tabi/cute-tabi.png and falls back to the existing original Tabi-inspired SVG if the image is missing or fails to load.
- Added public/images/tabi/README.md with exact filename and replacement instructions.

## v0.14.54 — Tabi Photo Shelf

- Added a dedicated “타비 사진 보관함” section on the TOOLBOX home page with image preview, replace, and remove controls.
- Selected images stay in browser localStorage only; no image upload or network request is made by this feature.
- Restricted selection to image MIME types and 2 MiB maximum to reduce local-storage failures; shows status feedback when storage is unavailable/full.
- Added responsive desktop/mobile layout and accessible labels/status messaging.

## v0.14.53 — Tabi Secret Expedition Easter Eggs

- Added the persistent “아무 의미 없는 버튼 (의미 있음)” sequence: milestone messages at 10, 30, 50, 51, 61, 64, and 66 clicks, then the final Tabi-style chibi reveal and disabled button.
- Added discoverable secrets: triple-click the TOOLBOX logo for sky-blue explorer mode, triple-click the footer note for a clue, type “tabi”, enter the Konami code, search for “101번째 도구”, or enter Tabi’s sky-blue hex color.
- Added an original locally hosted SVG chibi illustration inspired by Tabi’s sky-blue twin tails, goggles, explorer outfit, and compass motif.
- Easter egg discovery progress is stored locally only; no network calls, analytics events, or user-input collection were added.
- Added responsive, keyboard-dismissable modal and toast styling.

## v0.14.52 — Global Error UI Injection Hardening

- Replaced remaining raw error-message HTML concatenation across file/text/developer tools with DOM textContent rendering.
- Rebuilt Number Extractor, URL Extractor, and Whitespace Visualizer output paths to use textarea.value.
- Query String Builder now renders generated query data through textarea.value and errors through textContent.
- Added repository-wide regression scanning for HTML sinks that interpolate error messages.

## v0.14.51 — ReDoS Isolation Hardening

- Regex Tester runs browser regex evaluation in a dedicated module Worker with a 750ms timeout and terminates the Worker on completion, timeout, or error.
- Expanded conservative ReDoS heuristics to cover nested quantifiers and quantified alternations.
- If browser Workers are unavailable, the tool fails closed instead of executing arbitrary regex on the UI thread.
- Added isolated Worker entrypoint, adversarial ReDoS tests, and simulated timeout/success/fail-closed Worker lifecycle tests.

## v0.14.50 — Extreme Error-Rendering Hardening

- CSV → JSON, JSON → CSV, HTML Formatter, Number Base Converter, Regex Escape, HTML Tag Remover, and JSON Lines now render error messages through textContent instead of interpolating them into HTML.
- Rebuilt JSON Lines UI to assign transformed user data through textarea.value, avoiding HTML parsing.
- Added coverage for hostile error messages and output payloads.

## v0.14.49 — Extreme UI Injection Hardening

- Line Numberer: removed raw user text interpolation into a textarea HTML template; output now uses DOM value assignment.
- Added regression coverage for SVG/onload and textarea breakout payloads.
- Upgraded Vitest to 5.0.3 and patched source-map-js via npm audit fix; current full dependency audit reports 0 vulnerabilities.

## v0.14.48 — Extreme Security Regression Hardening

- JSON Minifier: textarea-closing payload could be parsed as HTML when output was interpolated into innerHTML; fixed with DOM value assignment.
- Added adversarial regression tests for textarea breakout, HTML metacharacters, prototype-looking JSON keys, invalid XML root names, and 100k+ hostile payloads.
- JSON Minifier placeholder corrected to avoid malformed HTML attribute markup.

## v0.14.47 — PDF-to-Image Preflight Validation

- PDF → Image는 렌더링 전에 공통 PDF 파서로 구조를 검증해 header-only 파일을 차단.
- pdf.js의 복구 동작 차이로 구조 오류가 내부 예외로 노출되는 문제 방지.

## v0.14.46 — PDF Encryption Fixture Final Fix

- 암호화 PDF fixture가 마지막 EOF 치환 과정에서 /Encrypt marker를 다시 잃지 않도록 보장.
- PDF 오류 테스트 helper가 정상 PDF를 암호화 fixture로 오인하지 않도록 강화.

## v0.14.45 — PDF Encryption Test Fixture Fix

- 1페이지 PDF 테스트 fixture에서 /Encrypt 주입이 누락되는 경우를 보완.
- 테스트 helper가 성공적으로 거절되는지 명확히 검증하도록 수정.

## v0.14.45 — PDF Encryption Test Fixture Fix

- 1페이지 PDF 테스트 fixture에서 /Encrypt 주입이 무시되는 경우를 수정.
- 정상 PDF가 암호화 오류 검증에 섞여 들어가던 테스트 결함 제거.

## v0.14.44 — PDF Encryption Detection Fix

- PDF의 전체 byte view에서 /Encrypt marker를 확인해 1페이지 fixture에서 빠지던 탐지 수정.
- PDF → Image와 공통 PDF 로더가 암호화/손상 입력을 파서 실행 전에 차단.

## v0.14.43 — PDF Encryption Detection Hardening

- /Encrypt 탐지를 trailer 끝부분 전용에서 전체 PDF의 reference pattern 검사로 강화.
- 큰 파일/재작성된 trailer에서 암호화 감지가 누락되는 문제 수정.

## v0.14.42 — PDF Encryption Validation

- 공통 PDF 로더에서 /Encrypt 감지를 파싱 전에 실행해 손상/암호화 PDF의 자동 복구 우회를 방지.
- PDF 도구 전체가 일관된 사용자용 오류를 반환하도록 강화.

## v0.14.41 — PDF Error Handling Fix

- PDF → Image: /Encrypt 딕셔너리를 Canvas/pdf.js 실행 전에 감지해 구조화된 오류로 거절.
- 잘못된 암호화 PDF가 Canvas 오류로 빠지는 회귀를 수정.

## v0.14.40 — 100 Tools QA Fixes

- PDF Compare 매니페스트를 동적 로딩 방식으로 통일해 회귀 규약 복구.
- PDF Text Search의 하이픈 복합어 whole-word 경계 수정.
- 검색 테스트 기대값을 fixture의 실제 단어 출현 수에 맞게 정정.
- 유틸리티 카테고리를 사이드바 카테고리 메타데이터에 추가.
- 전체 도구 등록 목표 100개 유지.

## v0.14.39 — Final 100 Tools Wave

- EXIF Remover: 브라우저에서 이미지 재인코딩으로 메타데이터 제거.
- YAML/XML/SQL/CSS/JS-TS 포맷 도구와 Cron 표현식 생성기 추가.
- HEX/RGB/HSL 색상 변환, HTTP 상태 코드 설명 도구 추가.
- 날짜 계산기 및 길이/질량/온도 단위 변환기 추가.
- 전체 도구 등록 목표 89 → 100.
- 일부 포매터는 휴리스틱 기반이며 복잡한 문법을 완전 검증하지 않음.

## v0.14.28 — Data Wave

- JSON → XML, XML → JSON 변환 도구 추가.
- CSV Transpose, Filter, Sorter, Column Selector 추가.
- JSON Path Query 및 JSON Flatten / Unflatten 추가.
- 잘못된 JSON, 없는 열, 경로 미일치 입력 처리 추가.
- 81 → 89개 도구.

## v0.14.20 — Text Wave

- Word Frequency Analyzer, Sentence Counter, Reading Time Calculator 추가.
- Line Trim Tool, Indent / Unindent, Prefix / Suffix Adder, Newline Converter 추가.
- Unicode Inspector 추가.
- 텍스트 빈 입력, 유니코드 코드 포인트, 줄바꿈과 단어 통계 검사 추가.
- 73 → 81개 도구.

## v0.14.12 — File Wave 69–74

- File Encoding Detector, Line Ending Detector, File Entropy Analyzer 추가.
- File Content Previewer, Batch File ZIP Creator, ZIP Inspector 추가.
- BOM/UTF-8, LF/CRLF/CR, Shannon entropy, binary preview, ZIP 구조 QA 계약 추가.
- 67 → 73개 도구.

## v0.14.6 — PDF Compare

- PDF Compare 추가.
- SHA-256, 바이트 크기, 페이지 수, 동일 파일 판정.
- 빈 입력·대용량·동일·상이·페이지 수 차이 QA 추가.
- 67개 도구.

## v0.14.4 — PDF Text Search

- PDF Text Search 추가.
- 대소문자/단어 단위 검색 및 페이지별 hit 집계.
- 빈 입력, 대용량, 0건, 다중 페이지 검색 QA 추가.
- 65개 도구.

## v0.14.3 — PDF Image Extraction

- PDF Image Extractor 추가.
- JPEG/PNG XObject를 직접 추출하고 원본 바이트를 보존.
- 출력 이미지 재디코딩/시그니처 검증을 QA 대상으로 추가.
- 64개 도구.

## v0.14.1 — PDF Page Wave

- PDF Text Extractor, PDF Page Reorder, PDF Page Rotate 추가.
- PDF 입력/손상 파일 검증과 출력 PDF 재파싱 QA 강화.
- 58 → 61개 도구.

## v0.14.0 — TOOLBOX 100-Wave 시작

- 52 → 58개 도구로 확장 시작.
- Image Metadata Viewer, Grayscale, Blur, Pixelate, Histogram, Data URI Converter 추가.
- 새 이미지 도구 processor에 실제 파일/경계값/round-trip 계약 테스트 추가.
- 버전 표기와 테스트 corpus 기준을 v0.14.0으로 승격.
- 100개까지 남은 도구: 42개.

## [0.13.3] - 2026-10-08

### Test / QA
- Added: 실제 로컬 사용자 폴더(Downloads/Desktop/Documents/Pictures/Videos)를 읽기 전용으로 자동 스캔하는 real-input corpus 테스트.
- Added: 실제 파일 확장자와 파일 시그니처(JPEG/PNG/WebP) 일치 검증.
- Added: 이미지 압축 결과가 원본보다 커지는 실사용 회귀 테스트.
- Added: PNG 재인코딩 결과가 원본보다 크면 원본을 유지하는 계약 검증.
- Improved: 테스트에서 실제 파일을 최대 300개, 디렉터리 깊이 4단계까지 수집하여 과도한 디스크 스캔 방지.

## [0.13.0] - 2026-10-08

### UI/UX
- 홈 화면을 작업공간형 UI로 전면 개편.
- 상단 고정 글로벌 검색창과 `/` 단축키 검색 지원.
- 파일/이미지/PDF/데이터/개발자/텍스트 카테고리 사이드바 추가.
- 도구 카드에 카테고리 아이콘, 설명, 즐겨찾기 추가 기능 적용.
- 즐겨찾기와 최근 사용 도구를 브라우저 localStorage에 저장.
- 홈에 빠른 시작/즐겨찾기/최근 사용 섹션 추가.
- 도구 상세 화면을 전용 작업 화면으로 개편하고 Local processing 상태와 관련 도구 표시 추가.
- 모바일/태블릿 반응형 레이아웃 강화.

# CHANGELOG — TOOLBOX

## v0.12.0 — 2026-10-08 — File 카테고리 확장

- Added: File Checksum
- Added: Duplicate Finder
- Added: File Signature Checker
- Added: File Name Analyzer
- Added: 52개 manifest 실제 import/load 전수 검증용 ultra-hard regression
- Verified: 전체 회귀 39 test files / 703 tests, preflight 16/16, typecheck, production build

## v0.11.0 — 2026-10-07 — 생산성 도구 확장

- Added: Text Reverser
- Added: Character Frequency
- Added: Regex Escape
- Added: Markdown Table Generator
- Improved: 모든 48개 도구 manifest 버전/동적 로딩 계약 유지


## v0.10.2 — 2026-10-07 — 로딩 계약 강화

- Fixed: 남아 있던 4개 도구의 정적 processor/UI import 제거
- Added: manifest/package 버전 동기화 및 정적 import를 preflight에서 검사


## v0.10.1 — 2026-10-07 — 버전 계약 강화

- Fixed: 신규 4개 도구 manifest의 버전 표기가 package 버전과 어긋나던 문제 수정
- Added: 모든 tool manifest의 package version 동기화를 preflight에서 강제


## v0.10.0 — 2026-10-07 — 텍스트 작업 확장

- Added: Number Extractor
- Added: URL Extractor
- Added: HTML Tag Remover
- Added: Whitespace Visualizer
- Verified: manifest registry, sitemap, dynamic loading 계약을 44개 도구로 확장


## v0.9.2 — 2026-10-07 — 탐색 UX 개선

- Improved: 40개 도구를 개별 링크 40개로 나열하던 상단 네비게이션을 카테고리 기반으로 단순화
- Added: 홈 URL의 category 필터 (file/image/pdf/data/developer/text)
- Improved: 검색창에 입력하는 즉시 검색 결과 갱신
- Verified: 40개 도구 registry/sitemap/dynamic-loading 계약 유지


## v0.9.1 — 2026-10-07 — UX 안정화

- Fixed: 전역 링크 클릭 핸들러가 메인 영역에서 중복 등록되던 문제 제거
- Improved: 홈 화면을 40개 도구 카드 그리드로 개편
- Improved: 도구 모듈 로딩 실패 시 빈 화면 대신 사용자용 오류 UI 표시
- Verified: 버전 동기화 및 기존 tool contract 유지


## v0.9.0 — 2026-10-07 — 도구 확장

- Added: Number Base Converter (2/8/10/16진수)
- Added: JSON → CSV 변환기
- Added: CSV → JSON 변환기 (따옴표/쉼표 필드 파서)
- Added: HTML Formatter
- Improved: 36개 도구 모두 manifest 기반 dynamic loading 유지


## v0.8.1 — 2026-10-07 — 초기 로딩 최적화

- Changed: 32개 도구 manifest가 processor/UI를 정적 import하던 구조를 제거하고 실제 dynamic import로 전환
- Improved: 홈/초기 진입 시 모든 도구 UI와 processor를 한꺼번에 번들에 포함하지 않도록 코드 스플리팅 적용
- Changed: 앱/빌드 설정 버전 주석을 v0.8.1로 정리하고 APP_VERSION/package.json 동기화
- Fixed: 사용하지 않는 scroll 상태 변수 제거
- Added: SEO preflight에 도구 dynamic-loading 계약 검사 추가
- Verified: 32개 manifest 모두 dynamic processor import 적용
- Verified: production build 성공 및 개별 core 테스트 18/18 통과


## v0.8.0 — 2026-10-07 — 프로젝트 기준선 정리 및 개발 재개

- Fixed:  버전이 의 APP_VERSION과 으로 불일치하던 문제 → 모두 **0.8.0**으로 동기화
- Fixed: Linux 개발 환경에서 npm optional dependency 누락으로 Vitest/Vite가 시작되지 않던 문제 → 플랫폼별 optional dependency 계약은 유지하고 현재 환경의 native package만 복구
- Added:  실제 SEO/사이트 구조 검사 — 버전 동기화, title/description/canonical/robots, H1, sitemap, robots, 도구↔sitemap 일치, registry 등록 수 검증
- Changed: README가 v0.1.0 Foundation 설명에 머물던 문제를 현재 v0.8.0 구조/검증 절차로 갱신
- Fixed: 홈의 하드코딩된  표시를 APP_VERSION 기반으로 변경
- Verified: TypeScript typecheck 통과
- Verified: **36 test files / 689 tests 통과**
- Verified: production build 통과 (296 modules)
- Note: build의 >600 kB chunk 경고는 기능 실패가 아니며 이후 성능 최적화 작업 대상으로 남김


## v0.7.0 — 2026-09-27 ~ 2026-10-03 — PDF 카테고리 실제 동작 복구 (기능 있는 PDF 도구)
PDF 도구 6개는 이전에 "validator만 통과하는 껍데기"였다. 정규식으로 PDF를 편집하거나 `canvas.toBlob("application/pdf")`를 호출해 실제 파일이 나오지 않았다. 전부 실제 동작으로 교체했다.

> 이 항목은 **fixture 생성·검증·회귀 정리(2026-10-03)**까지 포함한다. 앱 버전은 실제로 bump 되었다
> (`src/version.ts` APP_VERSION, `package.json` 모두 0.7.0). 작업 상태용 표기가 아니다.

- Fixed: PDF Merge — 바이트 단순 연결(열리지도 않음) → `pdf-lib` copyPages 실제 병합
- Fixed: PDF Split — 원본 Blob 반환, 미분할 → 페이지 인덱스 지정 추출. 원본 불변 확인
- Fixed: PDF Compress가 실제로 압축하지 않으면서 3단계를 광고하던 결함 → **PDF 메타데이터 제거**로 계약 정정. 실측 근거: `level`은 압축에 쓰이지 않고 metadata 제거에만 쓰였고(`processor.ts:60`), `save({useObjectStreams:true})`에 level 분기가 없어 3단계 출력이 동일했으며 `strong`은 `medium`과 완전히 같음. 고엔트로피 900×700 실측에서 PNG 53.8KB → 53.8 / JPEG 533.5KB → 533.5 (−0.1% 이하) — 이미지 스트림이 이미 DCTDecode/Flate라 pdf-lib 재직렬화로는 압축 불가. 변경: 표시명 `PDF 압축` → `PDF 메타데이터 제거 — 개인정보 정리`, `level: light|medium|strong` → `mode: keep|strip` 2단계, 버튼 `압축하기` → `정리하기`, 키워드에서 `pdf 용량 줄이기` 제거, 선택지 아래 "이미지 크기는 줄이지 않습니다" 고지 추가, FAQ에 "왜 2개뿐인가" 명시. `id`/`slug`는 `pdf-compress` 유지(24도구 registry·search 계약·URL 유지). 브라우저 실측: keep은 작성자·주제·제조사·키워드 보존, strip은 제거, title은 두 모드 모두 보존(라벨과 일치), 두 출력 바이트 다름. 후속 정정: 다운로드 파일명 `compressed.pdf` → `cleaned.pdf`, 출력 필드 `compressedSize` → `outputSize`(`image-compressor`의 동명 필드는 진짜 압축이라 유지), PDF 5개 도구의 "다음 작업" 링크 `PDF Compress` → `PDF 정보 제거`
- Verified: PDF 카테고리 전체 브라우저 실동작 (Chromium 154, shipping 모듈 dynamic import) — Metadata(3페이지·1.7·producer=TOOLBOX) / Merge(2파일→6페이지) / Split(all 6·odd 3·even 3·range 2-4 3) / Compress(두 모드 모두 3페이지 유지·유효 PDF) / PDF to Image / Image to PDF + EXIF 1~8 전부 통과. Node 회귀 10 files / 143 tests
- Fixed: PDF Compress — 정규식 치환으로 바이너리 손상 → `save({useObjectStreams})` 재작성. 파일이 커지는 경우도 정직하게 표시
- Fixed: PDF Metadata — 정규식 파싱이 object stream 속 페이지를 놓침 → `getPageCount()` + Info dict
- Fixed: PDF to Image — 파일명만 쓴 자리표시자 이미지 → `pdf.js` 실제 렌더링. 페이지 범위(1,3-5)·배율 지원
- Fixed: Image to PDF — `toBlob("application/pdf")`로 PDF 미생성 → `pdf-lib` embedJpg/embedPng. JPEG는 무손실 원본 embed
- Fixed: PDF to Image이 여러 페이지 변환 시 마지막 1페이지만 다운로드되던 데이터 유실 → 전체 페이지 미리보기 + 개별 다운로드
- Added: `src/tools/pdf/shared/loadPdf.ts` — pdf-lib이 손상 PDF를 "0페이지 성공"으로 복구해 조용히 통과시키는 것을 차단
- Added: split range 정수·범위 검증, pdf-to-image scale/pageNumbers 입력, 이미지 위장·빈 파일·헤더만 있는 파일 거부
- Added: tests/pdf-functional.test.ts (31개) — 산출물을 다시 열어 페이지 수·크기·픽셀까지 검증. tests/helpers/pdfFixtures.ts
- Fixed: 손상·암호화 PDF에서 pdf-lib 내부 예외가 그대로 노출되던 문제 (`why: "Cannot read properties of undefined (reading 'Pages')"`, `"load(..., { ignoreEncryption: true }) if you wish"`). 이제 암호화는 안내 문구, 손상은 원인을 말하지 않는 문구로 통일. pdf.js 경로도 같은 문구 사용
- Fixed: PDF to Image에 헤더 검증·오류 정규화가 전혀 없어 pdf.js 원문이 사용자에게 나던 문제. 이제 1.2MB 라이브러리를 로드하기 *전에* 거짓 파일을 거절
- Fixed: Image to PDF가 EXIF 회전을 무시해 스마트폰 세로 사진이 90° 기울어져 출력되던 문제. 회전 없는 JPEG는 계속 무손실 원본 embed 유지
- Added: tests/pdf-error-messages.test.ts (7개) — 내부 문자열 유입 금지 검증
- Added: tests/pdf-cross-validate.test.ts (8개) — pdf-lib가 아니라 pdf.js(별개 구현)로 산출물 교차검증, 회전 행렬·경계상자까지 확인
- Added: tests/exif-fixtures.test.ts (17개) + tests/fixtures/exif/ — 실제 픽셀(64×48 비대칭: F 문자·좌상단 빨강·우하단 초록·대각선)이 담긴 JPEG fixture 5종(EXIF 1/6/8/5/7). 기존 fixture는 헤더만이라 픽셀이 없었다
- Added: scripts/generate-exif-fixtures.ts, tests/helpers/exifFixtures.ts — fixture 생성/검증. jpeg-js를 devDependency로 추가(런타임 번들 무영향, 의존성 0개)
- Fixed: fixture 전치 검사 false positive — `64×48` 이미지에서 전치 대상 좌표가 범위 밖을 읽으면 `NaN`이 되어 **범위 밖 768픽셀(전체의 25%)이 무조건 "변경됨"으로 집계**됐다. 즉 전치 대칭 이미지도 통과하는 검사였다. 유효 좌표만 비교(`total === 48²` 가드)하도록 수정. 실제 변경 비율: 좌우 87.50% / 상하 71.09% / 전치 83.33%
- Fixed: shipping 경로 CTM 누적에서 `q`(OPS.save)를 CTM 리셋으로 취급. 실제로는 graphics state 스택 push이므로 stack push/pop으로 교정 (회전 판정의 근거 행렬)
- Tests: 689개 통과 (기존 622 + 31 + 15 + 19 + 2). tsc/build 통과
- Verified: fixture 생성은 결정적 — 재생성 시 8개 파일 모두 byte-identical (SHA-256)
- Verified: EXIF 회전의 실제 렌더 픽셀을 Chromium 154에서 확인 — shipping `processImageToPdf` → PDF → shipping `processPdfToImage`(pdf.js) 경로로 fixture 1~8을 렌더해 크기·모서리·대각선이 EXIF 명세와 일치. **orientation 5/7 캔버스 경로가 처음 실행되었으며** 정상 동작. 6/8은 원본 embed + PDF 회전인데도 이중 회전이 없음(→ pdf.js는 JPEG EXIF를 추가 적용하지 않음). `createImageBitmap`은 Chromium에서 JPEG EXIF를 `imageOrientation` 값과 무관하게 항상 적용함(PNG `flipY` 대조로 옵션 plumbing 유효 확인). PDF 크기로도 경로 분기가 확인됨(1/2/3/4/6/8 = 2.4KB 원본 embed, 5/7 = 4.0KB 캔버스 PNG)
- Fixed: EXIF orientation 2/3/4가 조용히 무시되어 잘못된 방향으로 출력되던 결함. 축이 그대로인 미러·180°를 pdf-lib 음수 scale로 표현한다 — `scale()`은 음수 크기를 거부하지 않고 그대로 `cm(sx,0,0,sy,0,0)`로 내보낸다. 2=`(−1,+1)` 우측 하단 기준점, 3=`(−1,−1)` 우측 상단, 4=`(+1,−1)` 좌측 상단. 5/7 캔버스 경로와 6/8 회전 경로는 그대로 유지. Chromium에서 1~8 전부 명세와 일치 확인
- Fixed: 미러를 회전 검사로는 잡을 수 없음 — CTM의 `drawn.w/h`가 `Math.hypot`로 부호를 버리고, 미러는 회전(`b`·`c` = 0)이 아니라 음수 대각 성분으로 나타나므로 크기·회전만 보는 검사는 "미리 처리되지 않은 2/3/4"를 통과시킴. 이 함정이 실제로 작동했음. `firstPage()`가 원래 CTM을 노출하게 하고 부호로 판별하도록 보강
- Added: tests/exif-fixtures.test.ts (19개) 및 JPEG fixture 5종 → 8종(EXIF 1~8 전부)
- Verified: 브라우저 실동작 확인 — PDF→PNG 3페이지 렌더링(사각형 높이 200/400/600pt에 비례해 픽셀 47k/87k/110k), PNG→PDF→PNG 왕복에서 4사분면 색상 원본과 일치
- Dependency: pdf-lib, pdfjs-dist 추가 (PDF 포맷을 손으로 다루는 것은 구조적으로 불가능). dependency 0 원칙 예외
- Rollback: PDF 도구 원복 시 6개 processor.ts + shared/loadPdf.ts 삭제, pdf-lib/pdfjs-dist 제거

## v0.6.6 — 2026-09-27 — Text Diff (Text 카테고리 마지막 도구)
- Added: Text Diff (id `text-diff`, category `text`, slug `/tools/text-diff`) — LCS 기반 줄 단위 비교, 3000줄 초과 시 위치별 비교 폴백
- Fixed: slug-generator separator를 RegExp에 직접 삽입하던 결함 제거 (`\`·`(`·`+` 등 입력 시 SyntaxError). `-`/`_`만 허용하고 split/join으로 collapse
- Changed: slug-generator 구분자 입력을 select(`-`/`_`)로 변경, main.ts 등록+nav, sitemap에 /tools/text-diff 추가, APP_VERSION 0.6.6
- Tests: slug-generator separator 특수문자·공백·collapse·비ASCII·빈 결과, text-diff LCS 삽입/삭제/재배열/폴백 → 전체 622개
- Rollback: Text 카테고리 6개 도구 완료, 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.6.5 — 2026-09-27 — Slug Generator (Text 카테고리 확장 다섯 번째 도구)
- Added: Slug Generator (id `slug-generator`, category `text`, slug `/tools/slug-generator`) — Unicode 정규화, 구분자 선택, 소문자 변환, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/slug-generator 추가, APP_VERSION 0.6.5
- Unchanged: 기존 30개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/slug-generator.test.ts 17개 추가 (전체 595개)
- Rollback: Text 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.6.4 — 2026-09-27 — Duplicate Line Remover (Text 카테고리 확장 네 번째 도구)
- Added: Duplicate Line Remover (id `duplicate-line-remover`, category `text`, slug `/tools/duplicate-line-remover`) — 중복 줄 제거, 첫/마지막 항목 유지 모드, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/duplicate-line-remover 추가, APP_VERSION 0.6.4
- Unchanged: 기존 29개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/duplicate-line-remover.test.ts 18개 추가 (전체 578개)
- Rollback: Text 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.6.3 — 2026-09-27 — Line Sorter (Text 카테고리 확장 세 번째 도구)
- Added: Line Sorter (id `line-sorter`, category `text`, slug `/tools/line-sorter`) — 문자열/숫자/길이/대소문자 무시 정렬, 오름차순/내림차순, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/line-sorter 추가, APP_VERSION 0.6.3
- Unchanged: 기존 28개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/line-sorter.test.ts 18개 추가 (전체 560개)
- Rollback: Text 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.6.2 — 2026-09-27 — Whitespace Cleaner (Text 카테고리 확장 두 번째 도구)
- Added: Whitespace Cleaner (id `whitespace-cleaner`, category `text`, slug `/tools/whitespace-cleaner`) — trim/다중 공백 제거/빈 줄 제거/탭 정규화/개행 정규화, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/whitespace-cleaner 추가, APP_VERSION 0.6.2
- Unchanged: 기존 27개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/whitespace-cleaner.test.ts 18개 추가 (전체 542개)
- Rollback: Text 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.6.1 — 2026-09-27 — Case Converter (Text 카테고리 확장 첫 도구)
- Added: Case Converter (id `case-converter`, category `text`, slug `/tools/case-converter`) — lower/upper/title/camelCase/PascalCase/snake_case/kebab-case, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/case-converter 추가, APP_VERSION 0.6.1
- Unchanged: 기존 26개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/case-converter.test.ts 18개 추가 (전체 522개)
- Rollback: Text 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.5.6 — 2026-09-27 — Image to PDF (PDF 카테고리 여섯 번째 도구)
- Added: Image to PDF (id `image-to-pdf`, category `pdf`, slug `/tools/image-to-pdf`) — 이미지를 PDF로 변환, A4/Letter/이미지 크기, 여백 조절, 최대 20개, 50MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/image-to-pdf 추가, APP_VERSION 0.5.6
- Unchanged: 기존 25개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/image-to-pdf.test.ts 12개 추가 (전체 498개)
- Rollback: PDF 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.5.5 — 2026-09-27 — PDF to Image (PDF 카테고리 다섯 번째 도구)
- Added: PDF to Image (id `pdf-to-image`, category `pdf`, slug `/tools/pdf-to-image`) — PDF를 이미지로 변환, PNG/JPEG 포맷, 품질 조절, 100MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/pdf-to-image 추가, APP_VERSION 0.5.5
- Unchanged: 기존 24개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/pdf-to-image.test.ts 12개 추가 (전체 486개)
- Rollback: PDF 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.5.4 — 2026-09-27 — PDF Compress (PDF 카테고리 네 번째 도구)
- Added: PDF Compress (id `pdf-compress`, category `pdf`, slug `/tools/pdf-compress`) — 메타데이터 제거/구조 최적화, light/medium/strong 수준, 100MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/pdf-compress 추가, APP_VERSION 0.5.4
- Unchanged: 기존 23개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/pdf-compress.test.ts 12개 추가 (전체 474개)
- Rollback: PDF 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.5.3 — 2026-09-27 — PDF Split (PDF 카테고리 세 번째 도구)
- Added: PDF Split (id `pdf-split`, category `pdf`, slug `/tools/pdf-split`) — 페이지 단위 분할, all/odd/even/range 모드, 100MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/pdf-split 추가, APP_VERSION 0.5.3
- Unchanged: 기존 22개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/pdf-split.test.ts 12개 추가 (전체 462개)
- Rollback: PDF 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.5.2 — 2026-09-27 — PDF Merge (PDF 카테고리 두 번째 도구)
- Added: PDF Merge (id `pdf-merge`, category `pdf`, slug `/tools/pdf-merge`) — 여러 PDF 병합, 최대 10개 파일, 100MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/pdf-merge 추가, APP_VERSION 0.5.2
- Unchanged: 기존 21개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/pdf-merge.test.ts 11개 추가 (전체 450개)
- Rollback: PDF 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.5.1 — 2026-09-27 — PDF Metadata (PDF 카테고리 첫 도구)
- Added: PDF Metadata (id `pdf-metadata`, category `pdf`, slug `/tools/pdf-metadata`) — PDF 메타데이터 추출, 페이지 수/제목/작성자/생성일 확인, 100MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/pdf-metadata 추가, APP_VERSION 0.5.1
- Unchanged: 기존 20개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/pdf-metadata.test.ts 12개 추가 (전체 439개)
- Rollback: PDF 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.4.6 — 2026-09-27 — Crop / Rotate / Flip (Image 카테고리 여섯 번째 도구)
- Added: Crop / Rotate / Flip (id `crop-rotate-flip`, category `image`, slug `/tools/crop-rotate-flip`) — Canvas 기반 변환, 90/180/270도 회전, 좌우/상하 반전, Crop 영역 선택, 50MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/crop-rotate-flip 추가, APP_VERSION 0.4.6
- Unchanged: 기존 19개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/crop-rotate-flip.test.ts 13개 추가 (전체 427개)
- Rollback: Image 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.4.5 — 2026-09-27 — Color Extractor (Image 카테고리 다섯 번째 도구)
- Added: Color Extractor (id `color-extractor`, category `image`, slug `/tools/color-extractor`) — Canvas 기반 색상 추출, 팔레트 12색, HEX/RGB/HSL 변환, 50MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/color-extractor 추가, APP_VERSION 0.4.5
- Unchanged: 기존 18개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/color-extractor.test.ts 12개 추가 (전체 415개)
- Rollback: Image 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.4.4 — 2026-09-27 — Target Size Compressor (Image 카테고리 네 번째 도구)
- Added: Target Size Compressor (id `target-size-compressor`, category `image`, slug `/tools/target-size-compressor`) — 목표 크기 이하 압축, 이진 탐색 품질 조절, KB/MB 단위, 50MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/target-size-compressor 추가, APP_VERSION 0.4.4
- Unchanged: 기존 17개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/target-size-compressor.test.ts 13개 추가 (전체 404개)
- Rollback: Image 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.4.3 — 2026-09-27 — Image Converter (Image 카테고리 세 번째 도구)
- Added: Image Converter (id `image-converter`, category `image`, slug `/tools/image-converter`) — Canvas 기반 포맷 변환, JPEG/PNG/WebP 간 변환, 투명도 처리, 50MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/image-converter 추가, APP_VERSION 0.4.3
- Unchanged: 기존 16개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/image-converter.test.ts 13개 추가 (전체 392개)
- Rollback: Image 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.4.3 — 2026-09-27 — Image Converter (Image 카테고리 세 번째 도구)
- Added: Image Converter (id `image-converter`, category `image`, slug `/tools/image-converter`) — Canvas 기반 포맷 변환, JPEG/PNG/WebP 간 변환, 투명도 처리, 50MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/image-converter 추가, APP_VERSION 0.4.3
- Unchanged: 기존 16개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/image-converter.test.ts 14개 추가 (전체 393개)
- Rollback: Image 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.4.2 — 2026-09-27 — Image Resizer (Image 카테고리 두 번째 도구)
- Added: Image Resizer (id `image-resizer`, category `image`, slug `/tools/image-resizer`) — Canvas 기반 리사이징, 비율 유지, 10000px 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/image-resizer 추가, APP_VERSION 0.4.2
- Unchanged: 기존 15개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/image-resizer.test.ts 14개 추가 (전체 379개)
- Rollback: Image 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.4.1 — 2026-09-27 — Image Compressor (Image 카테고리 첫 도구)
- Added: Image Compressor (id `image-compressor`, category `image`, slug `/tools/image-compressor`) — Canvas 기반 압축, JPEG/WebP/PNG 지원, 품질 조절, 50MB 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/image-compressor 추가, APP_VERSION 0.4.1
- Unchanged: 기존 14개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/image-compressor.test.ts 14개 추가 (전체 365개)
- Rollback: Image 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.3.2 — 2026-09-27 — CSV→Chart (Data 카테고리 두 번째 도구)
- Added: CSV→Chart (id `csv-chart`, category `data`, slug `/tools/csv-chart`) — bar/line/pie 차트, Canvas 기반 렌더링, PNG 내보내기, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/csv-chart 추가, APP_VERSION 0.3.2
- Unchanged: 기존 13개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/csv-chart.test.ts 18개 추가 (전체 348개)
- Rollback: Data 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.3.1 — 2026-09-27 — CSV Cleaner (Data 카테고리 첫 도구)
- Added: CSV Cleaner (id `csv-cleaner`, category `data`, slug `/tools/csv-cleaner`) — 빈 행·중복 행·공백 진단/제거, TSV 지원, 따옴표 파싱, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/csv-cleaner 추가, APP_VERSION 0.3.1
- Unchanged: 기존 12개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/csv-cleaner.test.ts 18개 추가 (전체 328개)
- Rollback: Data 카테고리 완료 후 카테고리 단위 checkpoint (이번 턴 미생성)

## v0.2.5 — 2026-09-27 — JWT Decoder (Suite 다섯 번째 도구)
- Added: JWT Decoder (id `jwt-decoder`, category `developer`, slug `/tools/jwt-decoder`) — 디코딩 전용(서명 검증 없음), Base64URL 내부 helper, 빈 서명=경고(invalid 아님), alg 표시만(whitelist 없음), alg:none 경고, exp/iat/nbf UTC 보조 표시, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/jwt-decoder 추가, APP_VERSION 0.2.5
- Unchanged: 기존 10개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/jwt-decoder.test.ts 24개 추가 (전체 180개)
- Rollback: Suite 완료 후 Suite 단위 checkpoint (이번 턴 미생성)

## v0.2.4 — 2026-09-27 — URL Parser (Suite 네 번째 도구)
- Added: URL Parser (id `url-parser`, category `developer`, slug `/tools/url-parser`) — 표준 new URL() 전용(자작 파서 없음), absolute만(상대 거부), 실행 scheme 명시적 거부, input/href 병기, password 출력 미포함+마스킹·경고, searchParams 순서·중복·빈값 보존, 재인코딩 없음, 1만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/url-parser 추가, APP_VERSION 0.2.4
- Unchanged: 기존 9개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/url-parser.test.ts 18개 추가 (전체 156개)
- Rollback: Suite 완료 후 Suite 단위 checkpoint (이번 턴 미생성)

## v0.2.3 — 2026-09-27 — HTML Entity Encoder/Decoder (Suite 세 번째 도구)
- Added: HTML Entity (id `html-entity`, category `developer`, slug `/tools/html-entity`) — encode 5종(&amp;/&lt;/&gt;/&quot;/&#39;), decode 5종+nbsp+10/16진 수치(1~U+10FFFF, 서로게이트·0 제외), 이중 encode 의도 동작, 미지원 named는 원문+warning, 수치 파손은 FILE_INVALID, decode→encode 비대칭 문서화
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/html-entity 추가, APP_VERSION 0.2.3
- Unchanged: 기존 8개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/html-entity.test.ts 23개 추가 (전체 138개)
- Rollback: Suite 완료 후 Suite 단위 checkpoint (이번 턴 미생성)

## v0.2.2 — 2026-09-27 — UUID Generator (Suite 두 번째 도구)
- Added: UUID Generator (id `uuid-generator`, category `developer`, slug `/tools/uuid-generator`) — v4(randomUUID 1순위, getRandomValues 수동 fallback)/v7(RFC 9562 수동 구성, 단조 비보장), v1·NIL 등 명시적 거부, 개수 1~100, Math.random 금지
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/uuid-generator 추가, APP_VERSION 0.2.2
- Unchanged: 기존 7개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/uuid-generator.test.ts 14개 추가 (전체 115개)
- Rollback: Suite 완료 후 Suite 단위 checkpoint (이번 턴 미생성)

## v0.2.1 — 2026-09-27 — JSON Formatter / Validator (Developer Suite 첫 도구)
- Added: JSON Formatter & Validator (id `json-formatter`, category `developer`, slug `/tools/json-formatter`) — pretty/minify/validate, indent 2/4/tab, 오류 위치(line/column, 엔진 메시지 의존), 중복 key·정밀도 warning 스캐너, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/json-formatter 추가, APP_VERSION 0.2.1
- Unchanged: 기존 6개 tool, core/*, search/*, 기존 테스트 무수정 (Core 수정 없음)
- Tests: tests/json-formatter.test.ts 23개 추가 (전체 101개)
- Rollback: Suite 완료 후 Suite 단위 checkpoint (이번 턴 미생성)

## v0.1.9 — 2026-09-27 — Hash Generator (sixth deterministic tool)
- Added: Hash Generator (id `hash-generator`, category `developer`, slug `/tools/hash-generator`) — Web Crypto SHA-256(기본)/384/512 + SHA-1(취약 경고 배지), MD5는 라이브러리 없이 UNSUPPORTED 거부, 정본 소문자 hex 전체+대문자 표시 옵션, subtle 부재 시 BROWSER_LIMIT, 100만자 상한
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/hash-generator 추가, APP_VERSION 0.1.9
- Unchanged: 기존 5개 tool, core/*, search/*, 기존 테스트 무수정
- Tests: tests/hash.test.ts 15개 추가 (전체 78개)
- Rollback: git checkpoint v0.1.9-hash-generator (별도 작업)

## v0.1.7 — 2026-09-27 — Timestamp Converter (fifth deterministic tool)
- Added: Timestamp Converter (id `timestamp-converter`, category `developer`, slug `/tools/timestamp-converter`) — timestamp↔날짜 양방향, seconds/milliseconds/auto(≤10/11~13자리 규칙), 소수 거부, 출력 UTC·KST·Local 3열+zone명 병기, 날짜 입력 zone 셀렉터(UTC/KST/Local), DST는 formatInZone 단일 정의
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/timestamp-converter 추가, APP_VERSION 0.1.7
- Unchanged: 기존 4개 tool, core/*, search/*, 기존 테스트 무수정
- Tests: tests/timestamp.test.ts 20개 추가 (전체 63개)
- Rollback: git checkpoint v0.1.7-timestamp-converter (별도 작업)

## v0.1.5 — 2026-09-27 — URL Encoder/Decoder (fourth deterministic tool)
- Added: URL Encoder/Decoder (id `url-encoder`, category `developer`, slug `/tools/url-encoder`) — component(encodeURIComponent, 기본)/fullUrl(encodeURI) 구분, decode는 decodeURIComponent 통일, 깨진 percent-encoding은 FILE_INVALID(원문 반환 없음), 100만자 safe mode, Swap 지원
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/url-encoder 추가, APP_VERSION 0.1.5
- Unchanged: 기존 3개 tool, core/*, search/*, 기존 테스트 무수정
- Tests: tests/url-encoder.test.ts 13개 추가 (전체 43개)
- Rollback: git checkpoint v0.1.5-url-encoder (별도 작업)

## v0.1.3 — 2026-09-27 — Base64 Tool (third deterministic tool)
- Added: Base64 Encoder/Decoder (id `base64`, category `developer`, slug `/tools/base64`) — Text mode UTF-8, browser-native btoa/atob + TextEncoder/Decoder, strict 형식 검증, URL-safe 거부, 100만자 safe mode, Swap 지원
- Changed: main.ts 등록+nav 3줄, sitemap에 /tools/base64 추가, APP_VERSION 0.1.3
- Unchanged: file-size-checker/*, text-counter/*, core/*, search/*, 기존 테스트 무수정
- Tests: tests/base64.test.ts 14개 추가 (전체 30개)
- Rollback: git checkpoint v0.1.3-base64

## v0.1.1 — 2026-09-27 — Text Counter (second deterministic tool)
- Added: Text Counter (id `text-counter`, category `text`) — 글자(code points/grapheme)/공백제외/단어(근사치)/줄/문단/UTF-8바이트, Intl.Segmenter + TextEncoder 기반, MAX 1,000,000자 safe mode
- Changed: main.ts 등록+nav 링크 2줄, sitemap에 /tools/text-counter 추가, APP_VERSION 0.1.1
- Unchanged (contract preserved): file-size-checker/*, core/*, search/*, tests/basic.test.ts 무수정
- Tests: tests/text-counter.test.ts 8개 추가 (전체 16개)
- Rollback: git checkpoint v0.1.1-text-counter

## v0.1.0 — 2026-09-27 — initial foundation
- Added: App shell, routing (/ + /tools/:slug + about/privacy/terms/contact/404), global search, SEO base (title/description/canonical/sitemap/robots/structured data), analytics abstraction, Tool Contract/Registry/Runner, FileManager/Download/Error/Capability/Worker-stub
- Added: File Size Checker (validate/process/UI/tests, local-only, no content read)
- Tests: tests/basic.test.ts (empty/minimum/normal/mismatch/unicode/no-ext/registry/search)
- Known limitations: Image/PDF/Data/Developer suites 미구현, pipeline engine 미구현, PWA 미구현, preflight:adsense 미구현 (다음 Atomic Task)
- Rollback: git checkpoint v0.1.0-toolbox-foundation

## v0.14.80 — 2026-10-17 — AdSense ads.txt seller verification
- Added `public/ads.txt` with the exact seller line supplied by the site owner: `google.com, pub-2603754934068938, DIRECT, f08c47fec0942fa0`.
- Updated AdSense setup documentation and deployment script to v0.14.80.
- This file does not indicate AdSense approval or guarantee ad delivery; verify the deployed `/ads.txt` URL and site status in AdSense.

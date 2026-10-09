# TOOLBOX v0.14.66

Local-first 범용 웹 작업공간. 파일·이미지·PDF·데이터·텍스트 작업을 브라우저에서 처리하는 정적 웹앱입니다.

## 배포 전 확인

- 앱 버전: **v0.14.66**
- 도구 manifest: **101개**
- 테스트: `npm test`
- TypeScript 검사: `npm run typecheck`
- 프로덕션 빌드: `npm run build`
- 배포 전 SEO/사이트 구조 검사: `npm run preflight:adsense`
- FFmpeg WebAssembly 엔진: `public/ffmpeg/`에서 자체 제공 (WASM 약 31 MB)

## 로컬 실행

```powershell
npm install
npm run dev
```

## 배포 검증 순서

```powershell
npm ci
npm run typecheck
npm test
npm run build
npm run preflight:adsense
npm run preview
```

GitHub Pages 배포는 `.github/workflows/deploy-pages.yml`가 담당합니다. 현재 저장소 이름이 `TOOLBOX`이므로 프로젝트 사이트 주소는 `https://<username>.github.io/TOOLBOX/`입니다. 워크플로는 `main` 브랜치 push 또는 수동 실행 시 typecheck → 전체 테스트 → preflight → build → Pages 배포를 수행합니다. GitHub 저장소의 Settings → Pages에서 Build and deployment source를 **GitHub Actions**로 설정해야 합니다. 기존 Netlify 설정은 보존되어 있습니다.

## 개발 원칙

1. 기존 도구를 깨뜨리지 않고 추가 방식으로 개발합니다.
2. 기능 변경에는 버전 라벨과 CHANGELOG를 남깁니다.
3. 새 도구는 manifest / processor / UI / 테스트를 함께 추가합니다.
4. 기능은 구현했다고 가정하지 않고 산출물과 테스트로 확인합니다.
5. 브라우저 내부 처리를 우선하며 서버 전송이 필요한 경우 UI에서 명시합니다.
6. 배포 전 typecheck → test → build → preflight 순으로 검증합니다.

## 구조

- `src/core` — 도구 계약, registry, runner 및 공통 계층
- `src/tools` — 카테고리별 도구
- `src/search` — 전역 검색
- `src/seo` — 페이지 메타 처리
- `scripts/preflight-adsense.ts` — 배포 전 SEO/사이트 구조 검사
- `scripts/generate-sitemap.ts` — manifest 기반 sitemap/robots 생성
- `tests` — 도구별 및 회귀 테스트

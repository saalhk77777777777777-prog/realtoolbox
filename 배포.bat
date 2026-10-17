@echo off
setlocal
chcp 65001 >nul
title TOOLBOX v0.14.73 - Build and Deploy

cd /d "%~dp0"
if errorlevel 1 goto :fail

echo.
echo [1/5] TypeScript 검사...
call npm run typecheck
if errorlevel 1 goto :fail

echo.
echo [2/5] 테스트 실행...
call npm test
if errorlevel 1 goto :fail

echo.
echo [3/5] SEO 사전 검사...
call npm run preflight:adsense
if errorlevel 1 goto :fail

echo.
echo [4/5] 프로덕션 빌드...
call npm run build
if errorlevel 1 goto :fail

echo.
echo [5/5] 올바른 저장소(realtoolbox)로 배포...
git add netlify.toml package.json package-lock.json src/version.ts CHANGELOG.md "배포.bat"
if errorlevel 1 goto :fail

git diff --cached --quiet
if not errorlevel 1 (
  echo 변경된 배포 파일이 없습니다.
) else (
  git commit -m "fix(v0.14.73): repair Netlify deep-link routing"
  if errorlevel 1 goto :fail
)

git push realtoolbox main
if errorlevel 1 goto :fail

echo.
echo 배포 요청 완료! Netlify 자동 배포 상태를 확인하세요:
echo https://app.netlify.com/
echo 사이트: https://toolboxbox.netlify.app/
echo.
pause
exit /b 0

:fail
echo.
echo [실패] 오류가 발생했습니다. 위 로그를 확인하세요.
echo 안전을 위해 push는 검증 성공 후에만 실행됩니다.
pause
exit /b 1

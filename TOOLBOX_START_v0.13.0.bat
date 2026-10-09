@echo off
setlocal EnableExtensions
title TOOLBOX v0.13.1
cd /d "%~dp0"
set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%"

if not exist "package.json" (
    echo [ERROR] package.json not found.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo.
echo TOOLBOX v0.13.1
echo URL: %URL%
echo STOP: Ctrl+C
echo.

start "" /b cmd /c "timeout /t 2 /nobreak >nul && start "" "%URL%""
call npm run dev -- --host 127.0.0.1 --port %PORT%

echo.
echo TOOLBOX server stopped.
pause
endlocal

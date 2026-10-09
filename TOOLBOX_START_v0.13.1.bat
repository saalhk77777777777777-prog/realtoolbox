@echo off
setlocal EnableExtensions

rem ================================================================
rem TOOLBOX Launcher
rem Version: v0.13.1
rem ================================================================

title TOOLBOX v0.13.1
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%"

echo.
echo ================================================================
echo                    TOOLBOX v0.13.1
echo ================================================================
echo.
echo Project : %CD%
echo URL     : %URL%
echo Stop    : Ctrl+C
echo.

if not exist "package.json" (
    echo [ERROR] package.json not found.
    echo Put this BAT file next to package.json.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found.
    echo Install Node.js and try again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] node_modules not found.
    echo [INFO] Running npm install...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Starting Vite...
echo [INFO] Browser will open in 2 seconds.
echo.
echo ------------------------------------------------
echo TOOLBOX is running.
echo URL  : %URL%
echo STOP : Ctrl+C
echo ------------------------------------------------
echo.

rem Open browser after Vite has had time to start.
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start "" "%URL%""

rem Keep Vite attached to this CMD window.
rem Ctrl+C stops npm/Vite cleanly.
call npm run dev -- --host 127.0.0.1 --port %PORT%

echo.
echo ================================================================
echo TOOLBOX server stopped.
echo ================================================================
echo.
pause
endlocal

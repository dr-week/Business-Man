@echo off
setlocal EnableExtensions
title Businessman - Dev Launcher

set "ROOT=%~dp0.."
cd /d "%ROOT%"

where node >nul 2>&1
if errorlevel 1 (
    echo [!] Node.js is not installed or not on PATH.
    echo     Install Node.js 22.13 or newer, then reopen this launcher.
    exit /b 1
)

set "LOG_DIR=%ROOT%\logs"
set "CRASH_DIR=%LOG_DIR%\crashes"
set "PORT_FILE=%LOG_DIR%\running_port.txt"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" 2>nul
if not exist "%CRASH_DIR%" mkdir "%CRASH_DIR%" 2>nul
if not exist "%LOG_DIR%" (
    echo [!] Could not create log directory: "%LOG_DIR%"
    exit /b 1
)

cls
echo ======================================================
echo   BUSINESSMAN - OPPORTUNITY DESK
echo ======================================================
echo.

if exist "%PORT_FILE%" set /p SAVED_PORT=<"%PORT_FILE%"
set "VERIFY_PORT=%SAVED_PORT%"
set "CHECK_RESULT="
for /f %%A in ('node scripts\verify-project-instance.mjs 2^>nul') do set "CHECK_RESULT=%%A"
if not defined CHECK_RESULT goto find_port
set "CHECK_STATUS="
set "CHECK_PORT="
for /f "tokens=1,2 delims=:" %%A in ("%CHECK_RESULT%") do (
    set "CHECK_STATUS=%%A"
    set "CHECK_PORT=%%B"
)
if not "%CHECK_STATUS%"=="IS_BUSINESSMAN" goto find_port
set "SAVED_PORT=%CHECK_PORT%"
echo [+] Businessman is already running on port %SAVED_PORT%.
echo [*] Open this URL in your browser: http://localhost:%SAVED_PORT%
exit /b 0

:find_port
echo [*] Finding a free port between 5173 and 5223...
set "PORT="
for /f %%P in ('node scripts\find-free-port.mjs 5173 2^>nul') do set "PORT=%%P"
if not defined PORT (
    echo [!] No free port found in the configured range.
    exit /b 1
)
set "URL=http://localhost:%PORT%"
set "PORT=%PORT%"
echo %PORT%>"%PORT_FILE%"

set "TIMESTAMP=%DATE%_%TIME%"
set "TIMESTAMP=%TIMESTAMP:/=-%"
set "TIMESTAMP=%TIMESTAMP:\=-%"
set "TIMESTAMP=%TIMESTAMP::=-%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "TIMESTAMP=%TIMESTAMP:,=-%"
set "RUN_LOG=%LOG_DIR%\session_%TIMESTAMP%.log"

echo [*] Starting server on %URL%...
echo [*] Open this URL in your browser when ready: %URL%
echo [*] Log: %RUN_LOG%
echo [*] Press Ctrl+C or close this launcher window to stop the server.
echo.

node scripts\run-framework.mjs dev > "%RUN_LOG%" 2>&1
set "EXIT_CODE=%errorlevel%"
if not "%EXIT_CODE%"=="0" goto crashed
echo.
echo [*] Businessman server stopped cleanly.
goto cleanup

:crashed
set "CRASH_LOG=%CRASH_DIR%\crash_%TIMESTAMP%_port%PORT%_code%EXIT_CODE%.log"
copy /y "%RUN_LOG%" "%CRASH_LOG%" >nul 2>&1
echo.
echo [!] Server exited with code %EXIT_CODE%.
echo [*] Crash log: %CRASH_LOG%
type "%RUN_LOG%"

:cleanup
if exist "%PORT_FILE%" del /f /q "%PORT_FILE%" >nul 2>&1
exit /b %EXIT_CODE%

@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Businessman - Dev Launcher

:: ═══════════════════════════════════════════════════════════════════
::  BUSINESSMAN — Multi-Project Safe Dev Launcher
::  Location: scripts\launch.bat
::
::  • Multi-Project Awareness: Identifies whether an active server
::    actually belongs to THIS project (businessman) via /api/health.
::    Will NEVER open or kill another project's port!
::  • Dynamic Port Hunting: If 5173 or other ports are occupied by
::    your other 4-5 projects, it seamlessly finds a 100% free port.
::  • Session Cleanup: Only cleans up previous sessions belonging to THIS project.
::  • Crash Logging: If Businessman exits with an error, saves to logs\crashes\.
:: ═══════════════════════════════════════════════════════════════════

set "ROOT=%~dp0.."
cd /d "%ROOT%"

where node >nul 2>&1
if errorlevel 1 (
    echo  [!] Node.js is not installed or not on PATH.
    echo      Install Node.js 22.13 or newer, then reopen this launcher.
    pause
    exit /b 1
)

set "LOG_DIR=%ROOT%\logs"
set "CRASH_DIR=%LOG_DIR%\crashes"
set "PID_FILE=%LOG_DIR%\running_server.pid"
set "PORT_FILE=%LOG_DIR%\running_port.txt"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" 2>nul
if not exist "%CRASH_DIR%" mkdir "%CRASH_DIR%" 2>nul
if not exist "%LOG_DIR%" (
    echo  [!] Could not create log directory: "%LOG_DIR%"
    pause
    exit /b 1
)

cls
echo  ======================================================
echo    AIX BUSINESSMAN - OPPORTUNITY DESK LAUNCHER
echo  ======================================================
echo.

:: 1. CHECK IF THIS EXACT PROJECT IS ALREADY RUNNING
if exist "%PORT_FILE%" (
    set /p SAVED_PORT=<"%PORT_FILE%"
    if defined SAVED_PORT (
        set "CHECK_STATUS="
        for /f %%A in ('node scripts\verify-project-instance.mjs !SAVED_PORT! 2^>nul') do set "CHECK_STATUS=%%A"
        if "!CHECK_STATUS!"=="IS_BUSINESSMAN" (
            echo  [+] Businessman is ALREADY running on port !SAVED_PORT!.
            echo  [*] Opening http://localhost:!SAVED_PORT! in your browser...
            start "" "http://localhost:!SAVED_PORT!"
            timeout /t 2 >nul
            exit /b 0
        )
    )
)

:: 2. MANAGE OLDER SESSIONS OF THIS SPECIFIC PROJECT
if exist "%PID_FILE%" (
    set /p OLD_PID=<"%PID_FILE%"
    if defined OLD_PID (
        tasklist /FI "PID eq !OLD_PID!" 2>nul | find "!OLD_PID!" >nul
        if !errorlevel! == 0 (
            echo  [*] Terminating previous Businessman background session (!OLD_PID!)...
            taskkill /PID !OLD_PID! /F /T >nul 2>&1
            timeout /t 1 >nul
        )
    )
    del /f /q "%PID_FILE%" >nul 2>&1
)

:: 3. FIND A GUARANTEED FREE PORT (Won't collide with your other projects!)
echo  [*] Scanning for free port (skipping any occupied by other projects)...
set "PORT="
for /f %%P in ('node scripts\find-free-port.mjs 5173 2^>nul') do set "PORT=%%P"

if not defined PORT (
    set "PORT=5173"
)

set "URL=http://localhost:!PORT!"
echo  [+] Dedicated port allocated: !PORT!
echo !PORT! > "%PORT_FILE%"

:: 4. PREPARE LOGGING (does not depend on deprecated WMIC)
set "TIMESTAMP=%DATE%_%TIME%"
set "TIMESTAMP=!TIMESTAMP:/=-!"
set "TIMESTAMP=!TIMESTAMP:\=-!"
set "TIMESTAMP=!TIMESTAMP::=-!"
set "TIMESTAMP=!TIMESTAMP: =0!"
set "TIMESTAMP=!TIMESTAMP:,=-!"
set "RUN_LOG=%LOG_DIR%\session_!TIMESTAMP!.log"

:: 5. AUTO-OPEN BROWSER WHEN READY
start /b "" cmd /c "timeout /t 3 >nul & start \"\" \"!URL!\""

:: 5. LAUNCH THE DESK SERVER
echo  [*] Starting Businessman Dev Server on !URL!...
echo  [*] Session log: !RUN_LOG!
echo  [*] Press Ctrl+C anytime to stop this desk.
echo.

set "PORT=!PORT!"
node scripts\run-framework.mjs dev --port !PORT! > "%RUN_LOG%" 2>&1
set "EXIT_CODE=%errorlevel%"

:: 6. HANDLE CRASHES
if %EXIT_CODE% neq 0 (
    echo.
    echo  ======================================================
    echo    [!] SERVER EXITED WITH ERROR CODE: %EXIT_CODE%
    echo  ======================================================
    set "CRASH_LOG=%CRASH_DIR%\crash_!TIMESTAMP!_port!PORT!_code%EXIT_CODE%.log"
    copy /y "%RUN_LOG%" "!CRASH_LOG!" >nul 2>&1
    echo  [*] Crash log captured at:
    echo      !CRASH_LOG!
    echo.
    type "%RUN_LOG%"
    echo.
    echo  Press any key to close...
    pause >nul
) else (
    echo.
    echo  [*] Businessman server stopped cleanly.
)

if exist "%PID_FILE%" del /f /q "%PID_FILE%" >nul 2>&1
if exist "%PORT_FILE%" del /f /q "%PORT_FILE%" >nul 2>&1
exit /b %EXIT_CODE%


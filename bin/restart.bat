@echo off

rem Check Node.js
where node >nul 2>nul || (
    echo Error: Node.js not installed
    echo Please install Node.js first
    pause
    exit /b 1
)

rem Read port from config file
cd /d "%~dp0/.."
for /f "usebackq delims=" %%p in (`node -e "const config = require('./config/backend-config.js'); console.log(config.PORT);"`) do set PORT=%%p

if not defined PORT (
    echo Error: Failed to read PORT from config
    pause
    exit /b 1
)

echo =========================================
echo         DWR-FS Server Restart
echo =========================================
echo.

rem Step 1: Stop the existing server
echo [1/2] Stopping existing server on port %PORT%...
echo ---------------------------------------------------

netstat -ano | findstr :%PORT% >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo No server is running on port %PORT%, skipping stop step.
) else (
    rem Stop all processes listening on the port
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
        taskkill /f /pid %%a >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo Stopped process %%a
        )
    )

    rem Also stop all node processes related to the server
    for /f "tokens=2" %%a in ('tasklist /fi "IMAGENAME eq node.exe" /v ^| findstr /i "backend/server.js" ^| findstr /i "%CD%"') do (
        taskkill /f /pid %%a >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo Stopped Node.js process %%a
        )
    )

    rem Wait a moment for port to be released
    timeout /t 2 /nobreak >nul

    rem Verify port is released
    netstat -ano | findstr :%PORT% >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Warning: Port %PORT% might still be in use.
    ) else (
        echo Server stopped successfully!
    )
)

echo.

rem Step 2: Start the server
echo [2/2] Starting server on port %PORT%...
echo ---------------------------------------------------

rem Check if port is already in use
netstat -ano | findstr "LISTENING" | findstr :%PORT% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Error: Port %PORT% is already in use
    echo Please stop the existing server or change the port in config/backend-config.js
    pause
    exit /b 1
)

rem Create temporary VBS script to run in background without window
set VBS_SCRIPT=%TEMP%\restart_dwr_fs.vbs
echo CreateObject("WScript.Shell").Run "cmd /c node backend/server.js", 0, False > %VBS_SCRIPT%

rem Execute VBS script
cscript //nologo %VBS_SCRIPT%

rem Delete temporary VBS script
del %VBS_SCRIPT% >nul 2>nul

echo.
echo =========================================
echo Server restarted successfully on port %PORT%!
echo Server is running as an independent process.
echo Use bin\stop.bat to stop it.
echo =========================================
echo.

pause

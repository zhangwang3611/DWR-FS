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

echo Checking if server is running on port %PORT%...
netstat -ano | findstr :%PORT% >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo No server is running on port %PORT%
    pause
exit /b 1
)

echo Server is running, stopping it...

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
timeout /t 1 /nobreak >nul

rem Verify port is released
netstat -ano | findstr :%PORT% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Warning: Port %PORT% might still be in use. Please wait a few seconds and try again.
) else (
    echo Server stopped successfully!
)
pause
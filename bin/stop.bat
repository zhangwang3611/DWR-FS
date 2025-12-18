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
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    taskkill /f /pid %%a >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Stopped process %%a
    )
)

echo Server stopped successfully!
pause
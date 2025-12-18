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

rem Check if port is already in use
echo Checking if port %PORT% is available...
netstat -ano | findstr :%PORT% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Error: Port %PORT% is already in use
    echo Please stop the existing server or change the port in config/backend-config.js
    pause
exit /b 1
)

rem Start backend in background (independent process)
echo Starting backend server on port %PORT%...

rem Create temporary VBS script to run in background without window
set VBS_SCRIPT=%TEMP%\start_dwr_fs.vbs
echo CreateObject("WScript.Shell").Run "cmd /c node backend/server.js", 0, False > %VBS_SCRIPT%

rem Execute VBS script
cscript //nologo %VBS_SCRIPT%

rem Delete temporary VBS script
del %VBS_SCRIPT% >nul 2>nul

echo Server started successfully on port %PORT%!
echo Server is running as an independent process.
echo Use stop.bat to stop it.
pause
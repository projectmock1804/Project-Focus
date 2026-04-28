@echo off
echo Cleaning up old processes...
taskkill /F /IM electron.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
timeout /t 3 /nobreak

echo.
echo Starting Project Focus...
echo.
cd /d "%~dp0"
npm run desktop

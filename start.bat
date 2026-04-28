@echo off
cd /d "%~dp0"
title Project Focus
echo Starting Project Focus...
echo.
echo Killing old processes...
taskkill /F /IM electron.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak

echo Starting Electron app...
node_modules\.bin\electron.cmd src/desktop/main.js

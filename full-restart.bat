@echo off
setlocal enabledelayedexpansion

echo ================================================
echo Project Focus - Full Restart
echo ================================================
echo.

echo [1/4] Killing all Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 2 /nobreak

echo [2/4] Killing any remaining processes on ports...
netstat -ano | findstr :5173 | for /F "tokens=5" %%a in ('findstr .') do taskkill /PID %%a /F >nul 2>&1
netstat -ano | findstr :3000 | for /F "tokens=5" %%a in ('findstr .') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak

echo [3/4] Starting API server in background...
cd /d "%~dp0"
start "" node index.js
timeout /t 3 /nobreak

echo [4/4] Starting Web dev server and Electron...
echo.
echo Starting Vite dev server (localhost:5173) and Electron...
echo.
call npm run desktop

pause

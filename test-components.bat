@echo off
cls
echo ================================================
echo Project Focus - Component Test
echo ================================================
echo.

echo [TEST 1] Checking if Node.js is available...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)
echo OK
echo.

echo [TEST 2] Checking if npm packages are installed...
cd /d "%~dp0"
if not exist "node_modules" (
    echo ERROR: Dependencies not installed. Run: npm install
    pause
    exit /b 1
)
echo OK
echo.

echo [TEST 3] Checking if web dependencies are installed...
if not exist "src\web\node_modules" (
    echo ERROR: Web dependencies not installed. Run: npm run web:install
    pause
    exit /b 1
)
echo OK
echo.

echo [TEST 4] Starting API server...
echo Starting API server on port 3000...
start "API Server" node index.js
timeout /t 3 /nobreak
echo.

echo [TEST 5] Testing API health check...
timeout /t 2 /nobreak
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 2; Write-Host 'OK - API Server is running'; $response.Content | ConvertFrom-Json | Select-Object status, time } catch { Write-Host 'ERROR - API Server not responding' }"
echo.

echo [TEST 6] Starting Vite dev server...
echo Starting Vite dev server on port 5173...
cd src\web
start "Vite Dev Server" npm run dev
cd ..\..
timeout /t 5 /nobreak
echo.

echo [TEST 7] Testing Vite dev server...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 2; Write-Host 'OK - Vite server is running' } catch { Write-Host 'ERROR - Vite server not responding' }"
echo.

echo [TEST 8] Waiting for you to test the servers...
echo API server: http://localhost:3000/api/health
echo Vite server: http://localhost:5173
echo.
echo Press any key to continue...
pause

echo.
echo [TEST 9] Starting Electron app...
electron src\desktop\main.js

pause

@echo off
REM Project Focus - Automated Deployment Script (Windows)
REM This script prepares everything for Render deployment

echo.
echo 🚀 Project Focus Deployment Preparation
echo ========================================
echo.

REM Check if on main branch
for /f %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
if not "%BRANCH%"=="main" (
  echo ❌ Error: Must be on 'main' branch. Currently on '%BRANCH%'
  pause
  exit /b 1
)

echo ✅ On main branch
echo.

REM Check for uncommitted changes
git diff-index --quiet HEAD --
if errorlevel 1 (
  echo ❌ Error: Uncommitted changes detected. Commit or stash them first.
  git status
  pause
  exit /b 1
)

echo ✅ No uncommitted changes
echo.

REM Build frontend
echo 📦 Building frontend...
cd src\web
call npm install --production
if errorlevel 1 (
  echo ❌ Frontend build failed
  pause
  exit /b 1
)

call npm run build
if errorlevel 1 (
  echo ❌ Frontend build failed
  cd ..\..
  pause
  exit /b 1
)

echo ✅ Frontend built successfully
cd ..\..
echo.

REM Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install --production
if errorlevel 1 (
  echo ❌ Backend dependencies installation failed
  pause
  exit /b 1
)
echo ✅ Backend dependencies installed
echo.

REM Environment check
echo 🔐 Environment Variables Check:
echo ---
if exist .env (
  echo ✅ .env file exists
  findstr "FIREBASE_SERVICE_ACCOUNT" .env >nul
  if errorlevel 1 (
    echo ⚠️  FIREBASE_SERVICE_ACCOUNT not found in .env
    echo    (Required for production deployment)
  ) else (
    echo ✅ FIREBASE_SERVICE_ACCOUNT is set
  )
) else (
  echo ❌ .env file not found
  echo    Copy from .env.example and fill in values
)
echo.

REM Summary
echo 📋 Deployment Readiness Summary:
echo ================================
echo ✅ Code compiled successfully
echo ✅ Dependencies installed
echo ✅ Frontend build completed
echo ✅ Git history clean
echo.

echo 🎯 Next Steps:
echo 1. Ensure .env has FIREBASE_SERVICE_ACCOUNT set
echo 2. Go to https://dashboard.render.com
echo 3. Create new Web Service from GitHub
echo 4. Set environment variables from .env
echo 5. Deploy!
echo.

echo 📚 For detailed instructions, see: DEPLOYMENT.md
echo.

echo ✨ Ready for deployment!
pause

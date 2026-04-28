# Project Focus Launcher
# PowerShell 스크립트 - Windows 환경에서 안정적으로 앱 실행

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Green
Write-Host "   PROJECT FOCUS" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# 1. Node.js / npm 확인
Write-Host "✓ Checking Node.js..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "  npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 2. 프로세스 종료
Write-Host "✓ Cleaning up old processes..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 3. 디렉토리 이동
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $appDir
Write-Host "  Working directory: $(Get-Location)" -ForegroundColor Gray

# 4. 포트 확인
Write-Host "✓ Checking ports..." -ForegroundColor Cyan
$ports = @(3000, 3001, 5173)
$portsInUse = @()
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
    }
}
if ($portsInUse) {
    Write-Host "  Ports in use: $($portsInUse -join ', ') (will be released)" -ForegroundColor Yellow
}

# 5. 앱 시작
Write-Host ""
Write-Host "✓ Starting Project Focus..." -ForegroundColor Green
Write-Host "  - API server (port 3000)" -ForegroundColor Gray
Write-Host "  - Web dev server (port 5173)" -ForegroundColor Gray
Write-Host "  - Electron app" -ForegroundColor Gray
Write-Host "  - PC monitor (distraction detection)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# npm run desktop 실행
npm run desktop

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Failed to start app (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

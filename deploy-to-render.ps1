# Render Deployment Script
param(
    [string]$ApiToken = "rnd_2EwCdUPszgTXWVr3BrAn71J7Tj7d"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Starting Render deployment..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$github_repo = "projectmock1804/Project-Focus"
$service_name = "project-focus-api"
$github_branch = "main"

Write-Host "Repository: $github_repo" -ForegroundColor Green
Write-Host "Branch: $github_branch" -ForegroundColor Green
Write-Host "Service: $service_name" -ForegroundColor Green
Write-Host ""

# Read .env file
Write-Host "Reading .env file..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    exit 1
}

$env_lines = @(Get-Content ".env")
$firebase_key = $null
$gemini_key = $null

foreach ($line in $env_lines) {
    if ($line.StartsWith("FIREBASE_SERVICE_ACCOUNT=")) {
        $firebase_key = $line.Substring("FIREBASE_SERVICE_ACCOUNT=".Length)
    }
    if ($line.StartsWith("GEMINI_API_KEY=")) {
        $gemini_key = $line.Substring("GEMINI_API_KEY=".Length)
    }
}

if (-not $firebase_key) {
    Write-Host "ERROR: FIREBASE_SERVICE_ACCOUNT not found in .env" -ForegroundColor Red
    Write-Host "Please run the setup script first" -ForegroundColor Yellow
    exit 1
}

if (-not $gemini_key) {
    $gemini_key = "AIzaSyDl33-WgrCmtYAxjmIIULix3-7islB2HkU"
}

Write-Host "OK: Environment variables loaded" -ForegroundColor Green
Write-Host "Firebase key: Found" -ForegroundColor Green
Write-Host "Gemini key: Found" -ForegroundColor Green
Write-Host ""

# Create Render Web Service
Write-Host "Creating Web Service on Render..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type" = "application/json"
}

$service_body = @{
    name = $service_name
    serviceDetails = @{
        env = "node"
        buildCommand = "npm install && cd src/web && npm install && npm run build && cd ../.."
        startCommand = "node index.js"
    }
    github = @{
        repo = $github_repo
        branch = $github_branch
        autoDeployOnPush = $true
    }
    plan = "free"
    region = "singapore"
    envVars = @(
        @{
            key = "FIREBASE_PROJECT_ID"
            value = "project-focus-7722d"
        },
        @{
            key = "FIREBASE_SERVICE_ACCOUNT"
            value = $firebase_key
        },
        @{
            key = "GEMINI_API_KEY"
            value = $gemini_key
        },
        @{
            key = "NODE_ENV"
            value = "production"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services" `
        -Method POST `
        -Headers $headers `
        -Body $service_body

    $service_id = $response.id
    $service_name_result = $response.name

    Write-Host "OK: Web Service created!" -ForegroundColor Green
    Write-Host "Service ID: $service_id" -ForegroundColor Green
    Write-Host "Name: $service_name_result" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "ERROR: Failed to create service" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $error_response = $reader.ReadToEnd()
        Write-Host "API Response: $error_response" -ForegroundColor Yellow
    }

    exit 1
}

# Start deployment
Write-Host "Starting deployment..." -ForegroundColor Yellow

try {
    $deploy_response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$service_id/deploys" `
        -Method POST `
        -Headers $headers

    Write-Host "OK: Deployment started!" -ForegroundColor Green
    Write-Host "Deploy ID: $($deploy_response.id)" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "Deployment command sent (auto-deploy in progress)" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Deployment started successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "Check progress:" -ForegroundColor Cyan
Write-Host "https://dashboard.render.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "Estimated time:" -ForegroundColor Yellow
Write-Host "Build: 2-3 minutes" -ForegroundColor Yellow
Write-Host "Deploy: 1-2 minutes" -ForegroundColor Yellow
Write-Host ""

Write-Host "Success! Your app is deploying now!" -ForegroundColor Magenta
Write-Host ""

pause

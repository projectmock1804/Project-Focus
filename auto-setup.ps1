# 자동 설정 - Firebase JSON을 .env에 추가

$jsonFile = "C:\Users\Min\Downloads\project-focus-7722d-firebase-adminsdk-fbsvc-102e29dafb.json"
$envFile = ".\.env"

Write-Host ""
Write-Host "🔧 Firebase 자동 설정 시작" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 파일 존재 확인
if (-not (Test-Path $jsonFile)) {
    Write-Host "❌ JSON 파일을 찾을 수 없습니다: $jsonFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "다운로드 폴더를 확인하세요" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ JSON 파일 발견" -ForegroundColor Green
Write-Host "   $jsonFile"
Write-Host ""

# JSON 읽기 및 변환
Write-Host "🔄 JSON을 한 줄로 변환 중..."
try {
    $json = Get-Content $jsonFile -Raw | ConvertFrom-Json
    $minified = $json | ConvertTo-Json -Compress
    Write-Host "✅ 변환 완료" -ForegroundColor Green
} catch {
    Write-Host "❌ JSON 변환 실패: $_" -ForegroundColor Red
    pause
    exit 1
}

# .env 파일 읽기
Write-Host ""
Write-Host "📝 .env 파일 수정 중..."

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env 파일이 없습니다" -ForegroundColor Red
    pause
    exit 1
}

# .env 업데이트
try {
    $envContent = Get-Content $envFile -Raw
    $newEnvContent = $envContent -replace 'FIREBASE_SERVICE_ACCOUNT=.*', "FIREBASE_SERVICE_ACCOUNT=$minified"
    Set-Content $envFile -Value $newEnvContent
    Write-Host "✅ .env 파일이 업데이트되었습니다" -ForegroundColor Green
} catch {
    Write-Host "❌ .env 업데이트 실패: $_" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✨ 완료!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계: Render 배포" -ForegroundColor Cyan
Write-Host "1. https://render.com/dashboard 접속"
Write-Host "2. New Web Service 생성"
Write-Host "3. projectmock1804/Project-Focus 선택"
Write-Host "4. Environment Variables에 .env 내용 추가"
Write-Host "5. Deploy 클릭"
Write-Host ""
pause

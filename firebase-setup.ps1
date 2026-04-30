# Firebase Service Account Setup Script
# This script converts Firebase JSON to .env format

Write-Host ""
Write-Host "🔧 Firebase Service Account 설정" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# JSON 파일 경로 입력받기
$jsonPath = Read-Host "Firebase JSON 파일 경로를 입력하세요 (예: C:\Users\Min\Downloads\project-focus-7722d-*.json)"

if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ 파일을 찾을 수 없습니다: $jsonPath" -ForegroundColor Red
    exit 1
}

try {
    # JSON 읽기
    $jsonContent = Get-Content $jsonPath -Raw
    $json = $jsonContent | ConvertFrom-Json

    # 한 줄로 변환 (ConvertTo-Json -Compress)
    $minified = $json | ConvertTo-Json -Compress

    # .env 라인 생성
    $envLine = "FIREBASE_SERVICE_ACCOUNT=$minified"

    Write-Host ""
    Write-Host "✅ 변환 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "아래를 .env 파일의 FIREBASE_SERVICE_ACCOUNT 라인으로 복사하세요:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $envLine
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""

    # 클립보드에 복사 시도
    try {
        $envLine | Set-Clipboard
        Write-Host "📋 클립보드에 복사되었습니다!" -ForegroundColor Green
    } catch {
        Write-Host "💡 수동으로 복사해주세요" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "다음: .env 파일 편집" -ForegroundColor Cyan
    Write-Host "1. .env 파일 열기 (메모장 또는 VS Code)"
    Write-Host "2. FIREBASE_SERVICE_ACCOUNT= 라인 찾기"
    Write-Host "3. 위의 전체 라인으로 교체"
    Write-Host "4. 저장"
    Write-Host ""

} catch {
    Write-Host "❌ 오류 발생: $_" -ForegroundColor Red
    exit 1
}

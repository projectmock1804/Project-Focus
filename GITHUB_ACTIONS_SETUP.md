# GitHub Actions 설정 (Mac + Windows 자동 빌드)

## 📋 현재 상황
- GitHub Actions workflow 파일이 준비되었음: `.github/workflows/build-release.yml`
- 하지만 GitHub 토큰에 `workflow` 권한이 없어서 push가 안 됨

## 🔧 해결 방법

### 옵션 1: GitHub 토큰 업데이트 (권장)

**Step 1: 새 Personal Access Token 생성**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)** 클릭
3. Token name: `project-focus-workflow`
4. 체크박스:
   - ☑ `repo` (전체)
   - ☑ `workflow` ← **이게 중요!**
   - ☑ `gist`
5. **Generate token** 클릭
6. 토큰 복사 (다시는 안 보임!)

**Step 2: Git에 새 토큰 등록**
```powershell
# Windows에서 Credential Manager 업데이트
# Option A: PowerShell로 직접
$token = "ghp_xxxxxxxxxxxx"  # 방금 복사한 토큰
$env:GIT_ASKPASS_OVERRIDE = $true
git config --global user.name "Your Name"
git config --global user.email "projectmock1804@gmail.com"

# Option B: Credential Manager로 수동 설정
# Control Panel → Credential Manager → Windows Credentials
# github.com 항목 수정 → 새 토큰으로 업데이트
```

**Step 3: 다시 Push**
```powershell
cd "C:\Users\Min\Project Focus"
git push origin main
```

---

### 옵션 2: 수동으로 Workflow 파일 GitHub에 추가

1. GitHub.com 로그인
2. Project Focus 저장소 열기
3. **Add file** → **Create new file**
4. File name: `.github/workflows/build-release.yml`
5. 아래 코드 붙여넣기:

```yaml
name: Build & Release

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install && npm run web:install && npm run web:build && npm run build:electron:win

  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install && npm run web:install && npm run web:build && npm run build:electron:mac
```

6. **Commit changes** 클릭

---

## ✅ 설정 완료 확인

**Step 1: GitHub Actions 활성화 확인**
1. GitHub → Project Focus → **Actions** 탭
2. "Build & Release" workflow 보임?

**Step 2: 자동 빌드 확인**
1. 아무 파일이나 수정 후 `git push`
2. GitHub → Actions → 빌드 시작됨
3. 완료되면 **Releases** 탭에 설치 파일 생성됨

---

## 🎯 완성 후 사용법

```
Push to main → GitHub Actions 자동 실행
                ↓
            Windows + Mac 빌드
                ↓
            자동으로 Release 생성
                ↓
            사용자가 다운로드 가능
```

---

## 🚨 문제 해결

### "workflow" 권한 에러
→ 옵션 1로 새 토큰 생성 (workflow 권한 포함)

### Actions에서 빌드 실패
1. Actions 탭에서 실패한 workflow 클릭
2. 로그 확인
3. 일반적 원인:
   - Node 모듈 못 찾음 → `npm install` 다시
   - 웹 빌드 실패 → `npm run web:build` 로컬에서 테스트
   - Electron 빌드 실패 → `npm run build:electron:win` 로컬에서 테스트

### Release가 생성 안 됨
- 빌드가 성공했는지 확인
- artifacts가 생성되었는지 확인 (Actions 로그)
- Releases 탭이 활성화되었는지 확인

---

## 💡 Tip

**로컬에서 테스트하기:**
```powershell
# Windows 빌드
npm run build:electron:win

# Mac 빌드 (Mac에서만)
npm run build:electron:mac

# 둘 다 (Mac에서만)
npm run build:electron:all
```

생성된 파일은 `dist-electron/` 디렉토리에 있음.

---

## 📞 GitHub 토큰 발급 절차 (상세)

**인증 문제가 생기면:**

```powershell
# 기존 git 인증 제거
git credential reject https://github.com

# 다시 push (토큰 입력 프롬프트)
git push origin main
# Username: (아무거나 입력, 예: "github")
# Password: (새 토큰 붙여넣기)
```

---

**완료되면 더 이상 수동 빌드 불필요! 🎉**
모든 변경사항이 자동으로 Mac + Windows 설치 파일로 변환됨.

# 🍎 Mac 설치 파일 빌드 가이드

## 🔧 사전 준비 (Mac에서만)

### 1. Node.js 설치
```bash
# Homebrew로 설치 (권장)
brew install node

# 또는 직접 다운로드
# https://nodejs.org/ → LTS 버전 설치
```

### 2. 프로젝트 클론 및 설정
```bash
git clone https://github.com/your-username/project-focus.git
cd project-focus
npm install
npm run web:install
```

### 3. 빌드 전 환경변수 확인
```bash
# .env 파일이 있는지 확인
ls -la .env

# 없으면 .env.example 복사
cp .env.example .env

# .env 파일 수정 (필요시)
nano .env
```

---

## 🔨 Mac 설치 파일 빌드

### 방법 1: DMG 파일 생성 (권장)
```bash
npm run build:electron:mac
```

**결과:**
- `dist-electron/Project-Focus-1.1.0.dmg` 생성됨
- Mac 사용자가 DMG를 다운받아 더블클릭 → 설치

### 방법 2: 모든 플랫폼 빌드 (Windows + Mac)
```bash
npm run build:electron:all
```

**결과:**
- Windows: `dist-electron/Project-Focus-Setup.exe`
- Mac: `dist-electron/Project-Focus-1.1.0.dmg`

---

## ✅ 빌드 확인

빌드가 완료되면:
```bash
ls -la dist-electron/
```

다음 파일들이 있는지 확인:
- ✅ `Project-Focus-1.1.0.dmg` (Mac 설치 파일)
- ✅ `Project-Focus-Setup.exe` (Windows 설치 파일)

---

## 📦 DMG 파일 배포

### 1. GitHub Releases에 업로드
```bash
# GitHub CLI가 필요
brew install gh

# 로그인
gh auth login

# Release 생성
gh release create v1.1.0 \
  dist-electron/Project-Focus-1.1.0.dmg \
  dist-electron/Project-Focus-Setup.exe \
  --title "Project Focus v1.1.0" \
  --notes "🍎 Mac and Windows installers"
```

### 2. 또는 수동으로 업로드
1. GitHub → **Releases** 탭
2. **Draft a new release**
3. Tag: `v1.1.0`
4. Files 업로드:
   - `Project-Focus-1.1.0.dmg`
   - `Project-Focus-Setup.exe`

---

## 🐛 문제 해결

### "icon not found" 에러
```bash
# 아이콘 파일이 없으면:
cp src/desktop/icon.png src/desktop/icon.icns
```

### "code signing" 에러
```bash
# Mac에서 code signing 스킵 (개발용)
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:electron:mac
```

### M1/M2 Mac에서 빌드 안 됨
- Rosetta 2 설치 필요:
```bash
softwareupdate --install-rosetta --agree-to-license
```

---

## 📋 체크리스트

- [ ] Node.js 설치됨
- [ ] Git에서 clone 완료
- [ ] `npm install` 완료
- [ ] .env 파일 설정됨
- [ ] `npm run build:electron:mac` 실행
- [ ] `dist-electron/` 에 DMG 파일 생성됨
- [ ] GitHub Releases에 업로드됨

---

## 💡 Tip

**Mac과 Windows 동시에 빌드하려면:**
- Windows 환경: `npm run build:electron` (Windows만)
- Mac 환경: `npm run build:electron:mac` (Mac만)
- 또는: `npm run build:electron:all` (둘 다, Mac에서만 가능)

**CI/CD로 자동화하려면:**
- GitHub Actions 사용
- `.github/workflows/build.yml` 참고


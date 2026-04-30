# Firebase Service Account 설정 가이드 (Windows)

## 준비물
- Firebase JSON 파일 (다운로드됨)
- .env 파일 (프로젝트 폴더에 있음)

## 방법 1: 자동 스크립트 (권장)

### 1.1 PowerShell 열기
```
Windows + R → powershell 입력 → Enter
```

### 1.2 프로젝트 폴더로 이동
```powershell
cd "C:\Users\Min\Project Focus"
```

### 1.3 스크립트 실행
```powershell
.\firebase-setup.ps1
```

### 1.4 파일 경로 입력
```
Firebase JSON 파일 경로를 입력하세요: C:\Users\Min\Downloads\project-focus-7722d-xxxxx.json
```

→ **클립보드에 자동 복사됨** ✅

---

## 방법 2: 수동 (만약 스크립트가 안 되면)

### 2.1 JSON 파일 복사
```
C:\Users\Min\Downloads\project-focus-7722d-xxxxx.json
```

### 2.2 온라인 JSON Minify 사용
1. https://jsoncrush.com 열기
2. 다운로드한 JSON 파일 내용 붙여넣기
3. "Minify" 클릭
4. 결과 복사

### 2.3 .env 파일 수정
1. `C:\Users\Min\Project Focus\.env` 열기 (VS Code 또는 메모장)
2. 이 라인 찾기:
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account"...
   ```
3. 전체 라인을 온라인에서 복사한 것으로 교체
4. 저장 (Ctrl+S)

---

## 확인
.env 파일에서 FIREBASE_SERVICE_ACCOUNT가:
- ✅ 한 줄로 되어있고
- ✅ {"type":"service_account"로 시작하고
- ✅ }로 끝나면
- ✅ 완료!

---

## 다음
Step 3️⃣: Render 배포로 이동

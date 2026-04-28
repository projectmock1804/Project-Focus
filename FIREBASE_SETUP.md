# Firebase Setup Guide

## 1. Get Firebase Service Account Key

이 단계에서 Backend에 필요한 Firebase 인증 정보를 얻습니다.

### Step 1.1: Firebase Console에서 Service Account 다운로드

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **Project Focus** 프로젝트 선택
3. 좌하단의 ⚙️ **Project Settings** 클릭
4. **Service Accounts** 탭 클릭
5. **Generate New Private Key** 버튼 클릭
6. JSON 파일 다운로드 (자동으로 저장됨)

### Step 1.2: Service Account JSON을 환경 변수로 변환

다운로드한 JSON 파일을 열어서 내용을 복사합니다:

```json
{
  "type": "service_account",
  "project_id": "project-focus-7722d",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@project-focus-7722d.iam.gserviceaccount.com",
  ...
}
```

### Step 1.3: .env 파일에 추가

이 JSON을 한 줄로 변환해서 `.env` 파일의 `FIREBASE_SERVICE_ACCOUNT`에 붙여넣기:

```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"project-focus-7722d",...}
```

> **팁**: JSON을 한 줄로 만들려면:
> - 모든 줄바꿈 제거
> - 들여쓰기 제거
> - 특수문자는 이스케이프 처리

## 2. Enable Firestore in Firebase

Firestore가 이미 생성되었는지 확인:

1. Firebase Console > **Build** 섹션
2. **Firestore Database** 확인
3. 없으면 **Create Database** 클릭
4. Mode: **Start in test mode** 선택
5. Region: **asia-northeast3** (또는 가장 가까운 지역)

## 3. Enable Authentication in Firebase

1. Firebase Console > **Build** > **Authentication**
2. **Sign-in method** 탭
3. **Email/Password** 사용 설정
4. **Save** 클릭

## 4. Local Testing

### Step 4.1: .env 파일 확인

```bash
FIREBASE_PROJECT_ID=project-focus-7722d
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Step 4.2: Dependencies 설치

```bash
npm install
cd src/web && npm install && cd ../..
```

### Step 4.3: 서버 시작

```bash
npm start
# 또는
node index.js
```

서버가 실행되고 Firebase에 연결되는지 확인:

```
[Firebase] Indexes ensured (auto-managed by Firestore)
[Server] Project Focus API running at http://localhost:3000
```

### Step 4.4: API 테스트

```bash
curl http://localhost:3000/api/health
# 응답: {"status":"ok","time":"..."}
```

## 5. Deploy to Render

### Step 5.1: Create Environment Variables in Render

Render 대시보드에서:

1. **Environment** 설정
2. 다음 환경 변수 추가:
   - `FIREBASE_PROJECT_ID`: project-focus-7722d
   - `FIREBASE_SERVICE_ACCOUNT`: (위에서 얻은 JSON)
   - `GEMINI_API_KEY`: (기존 값)
   - `NODE_ENV`: production

### Step 5.2: Deploy from GitHub

1. GitHub 저장소 연결
2. **Deploy** 버튼 클릭
3. 배포 진행 모니터링

## 6. Firebase Security Rules (Production)

테스트 모드는 개발용입니다. 운영 환경에서는 보안 규칙을 설정하세요:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Firestore Console > **Rules** 탭에서 설정

## Troubleshooting

### "Firebase service account not configured"

- `.env` 파일에 `FIREBASE_SERVICE_ACCOUNT` 확인
- 올바른 JSON 형식인지 확인
- 특수문자 이스케이프 처리 확인

### "Permission denied" errors

- Firestore 보안 규칙 확인
- 테스트 모드인지 확인 (개발 중에는 OK)

### "Authentication failed"

- Firebase 프로젝트 ID 일치 확인
- Service Account 권한 확인 (Firestore 접근 가능해야 함)

## Next Steps

✅ Firebase 설정 완료 후:
1. 로컬에서 테스트
2. Render에 배포
3. 실시간 사용 모니터링

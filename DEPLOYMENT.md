# Project Focus - Production Deployment Guide

Complete guide to deploy Project Focus to production on Render.com with Firebase backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Render.com (CDN)                     │
├─────────────────────────────────────────────────────────┤
│  Frontend (Vite + React)  │  Backend (Node.js + Express)│
│  src/web/dist/            │  index.js + api.js          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Firebase        │
                  ├──────────────────┤
                  │ Firestore DB     │
                  │ Authentication   │
                  │ Cloud Storage    │
                  └──────────────────┘
```

## Prerequisites

- ✅ Firebase Project created (Project Focus)
- ✅ Firestore Database initialized
- ✅ Web app registered in Firebase
- ✅ GitHub repository (private)
- 🔄 Firebase Service Account Key (get from Firebase Console)
- 🔄 Render.com account (free tier OK)

## Phase 1: Firebase Configuration

### 1.1 Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **Project Focus** project
3. Click ⚙️ **Project Settings** (bottom-left)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key** button
6. Save the downloaded JSON file

### 1.2 Create Service Account Environment Variable

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "project-focus-7722d",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@...",
  ...
}
```

Convert to single line (remove newlines, format JSON):
```
{"type":"service_account","project_id":"project-focus-7722d",...}
```

**Save this for Step 3 (Render Environment Variables)**

### 1.3 Enable Firebase Services

In Firebase Console:
- ✅ Firestore Database (should be created already)
- ✅ Authentication > Email/Password (enable if not done)
- ⏭️ Optional: Storage for future file uploads

## Phase 2: Local Testing (Optional)

Test locally before deploying:

```bash
# 1. Install dependencies
npm install
cd src/web && npm install && cd ../..

# 2. Create .env with Firebase service account
# (Copy from Step 1.2 above)

# 3. Start server
npm start

# 4. Test
curl http://localhost:3000/api/health
# Expected: {"status":"ok","time":"..."}
```

## Phase 3: Deploy to Render.com

### 3.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Authorize GitHub access

### 3.2 Create Web Service

1. Dashboard > **New** > **Web Service**
2. Connect GitHub repository
3. Select **projectmock1804/Project-Focus**
4. Configuration:
   - **Name**: project-focus-api
   - **Region**: Singapore (nearest to KR)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && cd src/web && npm install && npm run build && cd ../..`
   - **Start Command**: `node index.js`
   - **Plan**: Free

### 3.3 Set Environment Variables

In Render dashboard > Environment:

```
FIREBASE_PROJECT_ID=project-focus-7722d
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
GEMINI_API_KEY=(your existing key)
NODE_ENV=production
PORT=3000
```

> **IMPORTANT**: Paste the full JSON from Step 1.2 into `FIREBASE_SERVICE_ACCOUNT`

### 3.4 Deploy

1. Click **Create Web Service**
2. Render automatically deploys from GitHub
3. Monitor deployment logs
4. Once deployed, you get a URL like: `https://project-focus-api.onrender.com`

### 3.5 Deploy Frontend

Option A: Deploy web app separately
1. New **Static Site**
2. Repository: projectmock1804/Project-Focus
3. **Build Command**: `cd src/web && npm install && npm run build`
4. **Publish Directory**: `src/web/dist`

Option B: Frontend served from API (simpler)
- Already configured in render.yaml
- API serves frontend from `/`

## Phase 4: Verify Deployment

### 4.1 Health Check

```bash
curl https://project-focus-api.onrender.com/api/health
# Expected: {"status":"ok","time":"..."}
```

### 4.2 Admin Stats

```bash
curl https://project-focus-api.onrender.com/api/admin/stats
# Expected: {"totalUsers":0,"totalTasks":0,...}
```

### 4.3 Test Frontend

Open: `https://project-focus-api.onrender.com`

Should see: Project Focus landing page

### 4.4 Test Sign-up

1. Click "가입하기" or "Get Started"
2. Enter email, password, name
3. Should create user in Firebase and redirect to dashboard

## Phase 5: Post-Deployment

### 5.1 Enable Production Security Rules

In Firebase Console > Firestore > Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated users can read/write their own tasks
    match /tasks/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /sessions/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5.2 Monitor Production

- Render Dashboard: Check logs and metrics
- Firebase Console: Monitor database activity
- Admin page: `https://domain.com/admin` (when deployed)

### 5.3 Update DNS (Optional)

For custom domain:
1. Render > Settings > Custom Domain
2. Add your domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

Check Render logs:
- Missing environment variables?
- Package conflicts?
- Build command incorrect?

```bash
# Render runs:
npm install
cd src/web && npm install && npm run build && cd ../..
node index.js
```

### Firebase Connection Error

```
Error: Firebase service account not configured
```

- Check `FIREBASE_SERVICE_ACCOUNT` in Render env vars
- Ensure JSON is valid (one line, proper escaping)
- Check `FIREBASE_PROJECT_ID` matches Firebase Console

### "Permission denied" on Firestore

- Check Firebase security rules
- Ensure authenticated user (signed in)
- Check if test mode is still enabled

### Cold Start Delays (Free Tier)

Render free tier sleeps inactive apps:
- First request takes 30-60 seconds
- Upgrade to paid tier to prevent cold starts

## Performance Optimization

### Future Improvements

1. **Caching**: Redis on Render
2. **Database**: Firebase Realtime DB for lower latency
3. **CDN**: Render's built-in CDN
4. **Compression**: gzip enabled by default
5. **Monitoring**: Firebase Analytics + Render metrics

## Cost Estimation (Monthly)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render Web | 750 hours | Free |
| Render Static | 100 GB | Free |
| Firebase Firestore | 50k reads/day | Free |
| Firebase Auth | 2k sign-ups | Free |
| Total | All free | $0 |

> Upgrade when exceeding free tier limits

## Rollback Instructions

If deployment fails:

```bash
# Revert last commit
git revert HEAD
git push origin main

# Render automatically re-deploys
```

## Contact & Support

- **GitHub**: https://github.com/projectmock1804/Project-Focus
- **Firebase Console**: https://console.firebase.google.com
- **Render Dashboard**: https://dashboard.render.com

---

**Deployment Status**: 🔄 Ready for production
**Last Updated**: 2026-04-28

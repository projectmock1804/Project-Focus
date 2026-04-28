# ⚡ Project Focus - Quick Start (10 Minute Deployment)

**Everything is ready. Just 3 steps to go live!**

---

## Step 1️⃣: Get Firebase Service Account (5 min)

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select **Project Focus** project
3. Click ⚙️ **Settings** → **Service Accounts** tab
4. Click **Generate New Private Key**
5. Save the JSON file somewhere safe

---

## Step 2️⃣: Update .env File (2 min)

Open the downloaded JSON file and copy its full content.

Update `.env` file:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...paste entire JSON here...}
```

> **Note**: It should be ONE long line with NO newlines

---

## Step 3️⃣: Deploy to Render (10 min)

### 3.1 Create Web Service

1. Go to [render.com/dashboard](https://render.com/dashboard) (login with GitHub)
2. Click **+ New** → **Web Service**
3. Select **projectmock1804/Project-Focus** repo
4. Fill in:
   - **Name**: `project-focus-api`
   - **Region**: Singapore
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && cd src/web && npm install && npm run build && cd ../..`
   - **Start Command**: `node index.js`
   - **Plan**: Free ✨

### 3.2 Set Environment Variables

In Render, click **Environment** and add:

```
FIREBASE_PROJECT_ID=project-focus-7722d
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
GEMINI_API_KEY=(keep your existing key)
NODE_ENV=production
```

### 3.3 Deploy!

Click **Create Web Service** → Render automatically deploys

---

## ✅ Verify It Works

Once deployed (takes ~2-3 minutes):

```bash
# Test API
curl https://project-focus-xyz.onrender.com/api/health

# Open in browser
https://project-focus-xyz.onrender.com
```

Should see: Project Focus landing page ✨

---

## 🎉 You're Live!

Your app is now on the internet!

- Users can visit your site
- Sign up works
- Tasks sync to Firebase
- Admin dashboard accessible

---

## 📚 Need Help?

- **Detailed guide**: See `DEPLOYMENT.md`
- **Firebase setup**: See `FIREBASE_SETUP.md`
- **Full overview**: See `PRODUCTION_READY.md`

---

**That's it! You have a production app in 10 minutes!** 🚀

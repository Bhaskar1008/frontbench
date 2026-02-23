# How to Set Root Directory in Railway

## The Problem
Railway is running `start.sh` from the root directory, which tries to start both frontend and backend. You need to set Railway to only deploy the backend.

## Solution: Set Root Directory

### Method 1: Service Settings (Most Common)

1. **Go to Railway Dashboard**: https://railway.app
2. **Click on your project** → Click on **"frontbench" service**
3. **Click "Settings" tab** (top navigation bar, next to "Deploy Logs")
4. **Scroll down** to find **"Root Directory"** section
5. **Enter**: `backend` (or `Frontbench/backend` if that doesn't work)
6. **Click "Save"** or it auto-saves
7. **Redeploy** (Railway will auto-redeploy or click "Redeploy" button)

### Method 2: Service Configuration

If you don't see "Root Directory" in Settings:

1. **Click on your service** ("frontbench")
2. **Click the three dots (⋯)** menu → **"Settings"**
3. Look for **"Root Directory"** or **"Working Directory"**
4. Set to: `backend`

### Method 3: Using railway.json (Already Configured)

Your `backend/railway.json` is already set up correctly. Railway should detect it automatically if:
- Root Directory is set to `backend`
- OR Railway detects the `railway.json` file

### Method 4: Create New Service (If Root Directory Still Not Showing)

Sometimes Railway doesn't show Root Directory until you create a new service:

1. **Delete current service**:
   - Go to Settings → Scroll to bottom → "Delete Service"

2. **Create new service**:
   - Click "New" → "GitHub Repo"
   - Select your repository
   - **Before deploying**, check Settings
   - Root Directory option should appear
   - Set to: `backend`

---

## Visual Guide: Where to Find Root Directory

```
Railway Dashboard
├── Your Project
    ├── frontbench (service)
        ├── [Tabs: Details | Build Logs | Deploy Logs | Network Flow Logs]
        ├── Settings Tab ← CLICK HERE
            ├── Service Name
            ├── Environment Variables
            ├── Root Directory ← FIND THIS (scroll down)
            │   └── Enter: backend
            ├── Build Command
            ├── Start Command
            └── ...
```

---

## Quick Fix Steps

1. ✅ Go to Railway → Your Service → **Settings tab**
2. ✅ Scroll down to **"Root Directory"**
3. ✅ Set to: `backend`
4. ✅ Verify **"Start Command"** shows: `npm start` (not `start.sh`)
5. ✅ Save/Redeploy
6. ✅ Check logs - should see backend starting, not start.sh errors

---

## Verify It's Working

After setting Root Directory, check **Deploy Logs**. You should see:

✅ **Correct logs:**
```
Installing dependencies...
npm install
Building...
npm run build
Starting...
npm start
🚀 Frontbench API Server running on http://localhost:3001
```

❌ **Wrong logs (what you're seeing now):**
```
start.sh: line 8: npm: command not found
Starting Frontend Server...
```

---

## If Root Directory Option Still Not Showing

### Option A: Use Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set root directory
railway variables set RAILWAY_ROOT_DIRECTORY=backend
```

### Option B: Contact Railway Support

1. Click **"Get Help"** button in Railway dashboard
2. Explain: "Root Directory option not showing in Settings"
3. They can enable it or set it for you

### Option C: Restructure Repository (Last Resort)

If nothing works, you could:
1. Create a separate repository for backend only
2. Deploy that repository to Railway
3. No root directory needed

---

## Expected Configuration

After fixing, your Railway service should have:

- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build` (auto-detected)
- **Start Command**: `npm start` (auto-detected from package.json)
- **Port**: Auto-assigned by Railway

---

## Still Having Issues?

1. **Check Railway Docs**: https://docs.railway.app/develop/services#root-directory
2. **Railway Discord**: Join Railway Discord for community help
3. **Railway Support**: Click "Get Help" in dashboard

---

## Alternative: Use Railway's Auto-Detection

Railway should auto-detect Node.js projects. If Root Directory isn't showing:

1. Make sure `backend/package.json` exists ✅ (it does)
2. Make sure `backend/railway.json` exists ✅ (it does)
3. Railway might auto-detect and use backend directory
4. Check build logs to see which directory it's using

If build logs show it's installing from root, then Root Directory setting is definitely needed.

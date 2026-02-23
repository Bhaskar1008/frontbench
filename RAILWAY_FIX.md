# Fix Railway Deployment - Root Directory & Start Command

## Problem
Railway is trying to run `start.sh` from the root directory, which starts both frontend and backend. Railway should only deploy the backend.

## Solution: Set Root Directory in Railway

### Step 1: Find Root Directory Setting

1. **Go to your Railway project**: https://railway.app
2. **Click on your service** (the "frontbench" service)
3. **Go to "Settings" tab** (top navigation)
4. **Scroll down to "Root Directory"** section
5. **Set Root Directory**: `Frontbench/backend`
   - Or just: `backend` (if Railway detects the structure)

**If you don't see "Root Directory" option:**

### Alternative Method 1: Service Settings

1. Click on your service name
2. Click **"Settings"** (gear icon or Settings tab)
3. Look for **"Root Directory"** or **"Working Directory"**
4. Enter: `backend` or `Frontbench/backend`

### Alternative Method 2: Redeploy with Correct Structure

If the option still doesn't show:

1. **Delete the current service** (Settings → Delete Service)
2. **Create a new service** from the same GitHub repo
3. Railway should auto-detect Node.js
4. **Before deploying**, check if "Root Directory" appears
5. Set it to: `backend`

---

## Step 2: Fix Start Command

Railway should use `npm start` from the backend directory, not the root `start.sh`.

### Option A: Use Railway's Auto-Detection (Recommended)

Railway will automatically:
- Detect `package.json` in the backend directory
- Run `npm install`
- Run `npm run build` (if build script exists)
- Run `npm start`

**Make sure your `backend/package.json` has:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Option B: Set Custom Start Command

If Railway doesn't auto-detect:

1. Go to **Settings** → **"Deploy"** section
2. Find **"Start Command"**
3. Set to: `npm start`
4. Make sure **"Root Directory"** is set to `backend`

---

## Step 3: Verify Configuration

Your Railway service should have:

- **Root Directory**: `backend` (or `Frontbench/backend`)
- **Build Command**: `npm install && npm run build` (auto-detected)
- **Start Command**: `npm start` (auto-detected)

---

## Step 4: Redeploy

1. **Trigger a new deployment**:
   - Push a new commit to GitHub, OR
   - Go to Railway → Click "Redeploy" button

2. **Check the logs**:
   - Should see: `npm install` running
   - Should see: `npm run build` running
   - Should see: `npm start` running
   - Should see: `Frontbench API Server running on http://localhost:PORT`

---

## Troubleshooting

### Issue: "Root Directory" option not showing

**Solution 1**: Railway might auto-detect. Check if it's deploying from the right directory by looking at build logs.

**Solution 2**: Create a new service:
1. Delete current service
2. Create new service from GitHub repo
3. Root Directory option should appear

**Solution 3**: Use `railway.json` in backend:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

### Issue: Still running start.sh

**Solution**: Make sure Root Directory is set to `backend`. Railway should ignore root `start.sh` if root directory is set correctly.

### Issue: npm command not found

**Solution**: 
- Make sure Root Directory is set correctly
- Railway should auto-install Node.js
- Check build logs to see if Node.js is installed

---

## Quick Fix Checklist

- [ ] Go to Railway → Your Service → Settings
- [ ] Find "Root Directory" (scroll down if needed)
- [ ] Set to: `backend`
- [ ] Verify "Start Command" is: `npm start`
- [ ] Redeploy the service
- [ ] Check logs - should see backend starting, not start.sh

---

## Expected Logs After Fix

After setting root directory correctly, you should see:

```
Installing dependencies...
npm install
Building...
npm run build
Starting...
npm start
🚀 Frontbench API Server running on http://localhost:3001
✅ MongoDB connected to database: frontbench-dev
```

**NOT**:
```
start.sh: line 8: npm: command not found
```

---

## Still Having Issues?

1. **Check Railway Documentation**: https://docs.railway.app/develop/services#root-directory
2. **Contact Railway Support**: Click "Get Help" button in Railway dashboard
3. **Try deploying backend separately**: Create a new service just for backend

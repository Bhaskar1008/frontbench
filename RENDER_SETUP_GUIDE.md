# 🚀 Render Setup Guide - Step by Step (Like Railway & Vercel)

This guide will walk you through deploying your Frontbench backend to Render, similar to how you set up Railway and Vercel.

---

## 📋 Prerequisites Checklist

- [ ] GitHub account with Frontbench repository
- [ ] MongoDB Atlas connection string
- [ ] OpenAI API key
- [ ] ChromaDB credentials (if using RAG)
- [ ] Langfuse credentials (optional)

---

## Step 1: Create Render Account

1. **Go to Render:** https://render.com
2. **Click "Get Started for Free"** (top right)
3. **Sign up options:**
   - ✅ **Recommended:** Click "Sign up with GitHub" (easiest for repo access)
   - Or use email/password
4. **Authorize Render** to access your GitHub (if using GitHub signup)
5. **Verify email** if required

**✅ You should now see the Render Dashboard**

---

## Step 2: Create New Web Service

1. **In Render Dashboard**, click the **"New +"** button (top right)
2. **Select "Web Service"** from the dropdown
3. **Connect Repository:**
   - If GitHub is connected: You'll see your repositories
   - **Find and select:** `frontbench` (or `Bhaskar1008/frontbench`)
   - Click **"Connect"**

**✅ Render will now show the service configuration page**

---

## Step 3: Configure Service Settings

### Basic Settings Section:

**Name:**
- Enter: `frontbench-backend` (or any name you prefer)
- This will be part of your URL: `https://frontbench-backend-xxxx.onrender.com`

**Region:**
- **Recommended:** `Singapore` (closest to India)
- Or choose closest to your users

**Branch:**
- Select: `main` (or your main branch name)

**Root Directory:**
- **Leave empty** (we'll specify backend in build commands)
- Or set to: `backend` if you prefer

### Build & Deploy Section:

**Environment:**
- Select: **`Node`**

**Build Command:**
```
cd backend && npm install && npm run build
```

**Start Command:**
```
cd backend && node --max-old-space-size=4096 --expose-gc dist/index.js
```

**⚠️ Important:** Copy these commands exactly (including the `cd backend` part)

### Plan Section:

**Plan:**
- Select: **`Free`** (750 hours/month)
- You can upgrade later if needed

**Auto-Deploy:**
- ✅ **Enable:** `Yes` (deploys automatically on every push to main)

### Advanced Settings (Click to expand):

**Health Check Path:**
- Enter: `/api/health`

**✅ Don't click "Create Web Service" yet - we need to add environment variables first!**

---

## Step 4: Add Environment Variables

**⚠️ CRITICAL:** Add these BEFORE clicking "Create Web Service"

In the **"Environment Variables"** section, click **"Add Environment Variable"** for each:

### Required Variables:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

2. **PORT** (Render sets this automatically, but add it to be safe)
   - Key: `PORT`
   - Value: `10000`

3. **MongoDB Connection**
   - Key: `MONGODB_URI`
   - Value: `your_mongodb_atlas_connection_string`
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/frontbench-dev?retryWrites=true&w=majority`

4. **OpenAI API Key**
   - Key: `OPENAI_API_KEY`
   - Value: `sk-your-openai-api-key`

### ChromaDB Variables (if using RAG):

5. **Enable RAG**
   - Key: `ENABLE_RAG`
   - Value: `true`

6. **Chroma API Key**
   - Key: `CHROMA_API_KEY`
   - Value: `ck-your-chroma-api-key`

7. **Chroma Tenant**
   - Key: `CHROMA_TENANT`
   - Value: `5e1a4fa0-7acf-4b10-90d3-f1b1f476c6f8` (your tenant ID)

8. **Chroma Database**
   - Key: `CHROMA_DATABASE`
   - Value: `frontbench_documents`

9. **Chroma Host**
   - Key: `CHROMA_HOST`
   - Value: `api.trychroma.com`

10. **Chroma Collection**
    - Key: `CHROMA_COLLECTION`
    - Value: `frontbench_documents`

### Langfuse Variables (optional):

11. **Langfuse Secret Key**
    - Key: `LANGFUSE_SECRET_KEY`
    - Value: `sk-your-langfuse-secret-key`

12. **Langfuse Public Key**
    - Key: `LANGFUSE_PUBLIC_KEY`
    - Value: `pk-your-langfuse-public-key`

13. **Langfuse Host**
    - Key: `LANGFUSE_HOST`
    - Value: `https://us.cloud.langfuse.com`

### Other Variables:

14. **Enable Agentic AI**
    - Key: `ENABLE_AGENTIC_AI`
    - Value: `true`

15. **Database Name**
    - Key: `DATABASE_NAME`
    - Value: `frontbench-dev`

**✅ Double-check all environment variables are added correctly**

---

## Step 5: Create and Deploy

1. **Scroll down** and click **"Create Web Service"** button
2. **Render will start building:**
   - You'll see build logs in real-time
   - First build takes 3-5 minutes
   - Watch for any errors

3. **Build Process:**
   - Installing dependencies
   - Running `npm run build`
   - Starting server

4. **Look for success messages:**
   - ✅ `Build successful`
   - ✅ `Service is live`
   - ✅ `🚀 Frontbench API Server running on http://0.0.0.0:10000`

**✅ Your backend is now deployed!**

---

## Step 6: Get Your Backend URL

1. **After deployment succeeds**, you'll see your service URL at the top:
   - Format: `https://frontbench-backend-xxxx.onrender.com`
   - Example: `https://frontbench-backend-abc123.onrender.com`

2. **Copy this URL** - you'll need it for Vercel

3. **Test the health endpoint:**
   - Open: `https://your-render-url.onrender.com/api/health`
   - Should return JSON with `"status": "ok"`

**✅ Backend is working!**

---

## Step 7: Update Vercel Frontend

Now update your Vercel frontend to use the Render backend:

### Option A: Update Environment Variable (Recommended)

1. **Go to Vercel Dashboard:** https://vercel.com
2. **Select your Frontbench project**
3. **Go to:** Settings → Environment Variables
4. **Find or create:** `VITE_API_URL`
5. **Update value to:** `https://your-render-url.onrender.com`
   - Example: `https://frontbench-backend-abc123.onrender.com`
6. **Make sure it's set for:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
7. **Click "Save"**

### Option B: Update vercel.json (If using rewrites)

1. **Edit `vercel.json`** in your repo
2. **Update the rewrite destination:**
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://your-render-url.onrender.com/api/$1"
       }
     ]
   }
   ```
3. **Commit and push** (Vercel will auto-deploy)

### Redeploy Vercel:

1. **Go to Vercel Dashboard** → Your Project → Deployments
2. **Click "Redeploy"** on the latest deployment
3. **Or push a new commit** to trigger auto-deploy

**✅ Frontend now connected to Render backend!**

---

## Step 8: Test Everything

1. **Test Health Endpoint:**
   ```
   https://your-render-url.onrender.com/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Test from Vercel Frontend:**
   - Open your Vercel site
   - Try uploading a resume
   - Check browser console for errors
   - Should work without CORS errors

3. **Check Render Logs:**
   - Render Dashboard → Your Service → Logs
   - Should see successful requests

**✅ Everything is working!**

---

## 🎯 Render Dashboard Overview

### Main Tabs:

1. **Logs:** Real-time logs from your service
2. **Metrics:** CPU, Memory, Request metrics
3. **Events:** Deployment history
4. **Settings:** Configuration, environment variables, domains
5. **Manual Deploy:** Trigger manual deployments

### Useful Features:

- **Auto-Deploy:** Automatically deploys on every push to main
- **Manual Deploy:** Click "Manual Deploy" to redeploy anytime
- **Rollback:** Click on any previous deployment to rollback
- **Logs:** Real-time logs (similar to Railway)

---

## ⚙️ Enable "Always On" (Optional)

**Free tier services spin down after 15 minutes of inactivity.**

To keep your service always running:

1. **Render Dashboard** → Your Service → **Settings**
2. **Scroll to "Free Tier"** section
3. **Enable "Always On"**
   - Uses more of your 750 hours/month
   - Service stays running 24/7
   - No cold starts

**Note:** Free tier gives 750 hours/month, which is enough for always-on if you have one service.

---

## 🔍 Troubleshooting

### Service Keeps Restarting:

1. **Check Logs tab** for errors
2. **Common issues:**
   - Missing environment variables
   - MongoDB connection failed
   - ChromaDB connection failed
   - Build errors

### Health Check Failing:

1. **Verify `/api/health` endpoint works:**
   - Test directly: `https://your-url.onrender.com/api/health`
2. **Check logs** for health check errors
3. **Verify server is listening on 0.0.0.0** (already configured)

### Slow Cold Starts:

- **Enable "Always On"** in settings
- Or upgrade to Starter plan ($7/month)

### Out of Memory:

- **Upgrade to Starter plan** ($7/month) for 1GB RAM
- Or optimize code (already done with 4096MB heap)

### CORS Errors:

- **Render automatically allows all origins** for health checks
- **For API calls:** Our CORS config allows Vercel domains
- **If issues persist:** Check backend logs for CORS messages

---

## 📊 Render vs Railway Comparison

| Feature | Render | Railway |
|---------|--------|---------|
| Free Tier | ✅ 750 hours/month | ⚠️ Limited |
| Always On | ✅ Available | ❌ Pauses |
| Reliability | ✅ More stable | ⚠️ Can crash |
| Setup | ✅ Simple | ✅ Simple |
| Health Checks | ✅ Built-in | ✅ Built-in |
| Auto-Deploy | ✅ Yes | ✅ Yes |
| Cold Starts | ⚠️ 30-60s (free) | ⚠️ Similar |

---

## 🎉 Success Checklist

- [ ] Render account created
- [ ] Web service created and configured
- [ ] All environment variables added
- [ ] Service deployed successfully
- [ ] Health endpoint working
- [ ] Vercel updated with Render URL
- [ ] Frontend can connect to backend
- [ ] Resume upload works
- [ ] "Always On" enabled (optional)

---

## 📝 Next Steps

1. **Monitor Render logs** for any issues
2. **Test all features** (upload, analysis, benchmarks)
3. **Enable "Always On"** if you want 24/7 uptime
4. **Set up custom domain** (optional, in Settings → Custom Domains)

---

## 🆘 Need Help?

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Render Community:** https://community.render.com
- **Support:** support@render.com

---

**You're all set! Your backend is now running on Render! 🚀**

# Render Deployment Guide for Frontbench Backend

## Prerequisites
1. GitHub account with the Frontbench repository
2. Render account (sign up at https://render.com - free)

## Step-by-Step Deployment

### Step 1: Create Render Account
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for easy repo access)

### Step 2: Create New Web Service
1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if not already connected
3. Select your `frontbench` repository
4. Click **"Connect"**

### Step 3: Configure Service Settings

**Basic Settings:**
- **Name:** `frontbench-backend` (or any name you prefer)
- **Region:** Choose closest to you (Singapore recommended for Asia)
- **Branch:** `main`
- **Root Directory:** Leave empty (or set to `backend` if you want)

**Build & Deploy:**
- **Environment:** `Node`
- **Build Command:** `cd backend && npm install && npm run build`
- **Start Command:** `cd backend && node --max-old-space-size=4096 --expose-gc dist/index.js`

**Advanced Settings:**
- **Plan:** `Free` (or upgrade if needed)
- **Auto-Deploy:** `Yes` (deploys on every push to main)
- **Health Check Path:** `/api/health`

### Step 4: Set Environment Variables

In Render Dashboard → Your Service → **Environment** tab, add these variables:

**Required:**
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
```

**ChromaDB (if using RAG):**
```
ENABLE_RAG=true
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_chroma_tenant
CHROMA_DATABASE=frontbench_documents
CHROMA_HOST=api.trychroma.com
```

**Langfuse (optional):**
```
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_HOST=https://us.cloud.langfuse.com
```

**Other:**
```
ENABLE_AGENTIC_AI=true
DATABASE_NAME=frontbench-dev
CHROMA_COLLECTION=frontbench_documents
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait 3-5 minutes for first deployment
4. Check **Logs** tab for progress

### Step 6: Get Your Backend URL
1. After deployment succeeds, Render will provide a URL like:
   `https://frontbench-backend-xxxx.onrender.com`
2. Copy this URL

### Step 7: Update Vercel Frontend
1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to your Render URL:
   ```
   VITE_API_URL=https://frontbench-backend-xxxx.onrender.com
   ```
4. **Save** and **Redeploy** Vercel

### Step 8: Update vercel.json (Optional)
If using rewrites, update `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://frontbench-backend-xxxx.onrender.com/api/$1"
    }
  ]
}
```

## Render Free Tier Features

✅ **750 hours/month** (enough for always-on)
✅ **512MB RAM** (should be enough for your backend)
✅ **Free SSL** certificate
✅ **Custom domains** support
✅ **Auto-deploy** from GitHub
✅ **Health checks** included

## Important Notes

### Free Tier Limitations:
- **Spins down after 15 minutes** of inactivity (unless you enable "Always On")
- **Cold start** takes 30-60 seconds after spin-down
- **Limited to 512MB RAM** (upgrade if you need more)

### Enable "Always On" (Optional):
1. Render Dashboard → Your Service → **Settings**
2. Scroll to **"Free Tier"** section
3. Enable **"Always On"** (uses more of your 750 hours)

### Health Check:
- Render automatically checks `/api/health` every few seconds
- If health check fails, Render will restart your service
- Our optimized health check responds quickly (< 100ms)

## Troubleshooting

### Service Keeps Restarting:
- Check **Logs** tab for errors
- Verify all environment variables are set
- Check MongoDB connection string
- Verify ChromaDB credentials

### Health Check Failing:
- Ensure `/api/health` endpoint is working
- Check logs for health check errors
- Verify server is listening on `0.0.0.0` (already configured)

### Slow Cold Starts:
- Enable "Always On" in settings
- Or upgrade to paid plan ($7/month)

### Out of Memory:
- Upgrade to Starter plan ($7/month) for 512MB → 1GB RAM
- Or optimize your code (already done with 4096MB heap)

## Comparison: Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| Free Tier | ✅ 750 hours/month | ✅ Limited |
| Always On | ✅ Available | ❌ Pauses |
| Reliability | ✅ More stable | ⚠️ Can crash |
| Setup | ✅ Simple | ✅ Simple |
| Health Checks | ✅ Built-in | ✅ Built-in |
| Auto-Deploy | ✅ Yes | ✅ Yes |

## Next Steps After Deployment

1. ✅ Test health endpoint: `https://your-render-url.onrender.com/api/health`
2. ✅ Test resume upload from Vercel frontend
3. ✅ Check Render logs for any errors
4. ✅ Monitor service uptime

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Render Community: https://community.render.com

# Railway Service Troubleshooting Guide

## Issue: DNS_PROBE_FINISHED_NXDOMAIN

This error means the Railway domain `frontbench-production.up.railway.app` cannot be resolved. This typically happens when:

1. **Railway service is paused/stopped**
2. **Railway service was deleted**
3. **Domain was changed**
4. **Railway free tier limit reached**

## Steps to Fix

### Step 1: Check Railway Dashboard

1. Go to https://railway.app
2. Log in to your account
3. Find your `frontbench-production` service (or similar name)
4. Check the service status:
   - ✅ **Active/Deployed** = Service is running
   - ⏸️ **Paused** = Service is paused (click "Resume")
   - ❌ **Stopped** = Service stopped (click "Deploy" or "Start")
   - 🔴 **Error** = Check logs for errors

### Step 2: Get Correct Railway URL

1. In Railway dashboard, click on your service
2. Go to **Settings** → **Domains**
3. You'll see one of these:
   - **Default Domain**: `frontbench-production.up.railway.app` (or similar)
   - **Custom Domain**: If you set one up
4. **Copy the exact URL** shown (including `https://`)

### Step 3: Verify Service is Running

1. In Railway dashboard, check **Deployments** tab
2. Look for the latest deployment:
   - ✅ **Success** = Service should be running
   - ❌ **Failed** = Click to see error logs
   - ⏳ **Building** = Wait for it to complete

### Step 4: Restart/Redeploy Service (if needed)

If service is paused or stopped:

1. Click **Deployments** tab
2. Click **"Redeploy"** or **"Deploy"** button
3. Wait 2-3 minutes for deployment to complete
4. Check **Logs** tab to see if it started successfully

### Step 5: Update Vercel Configuration

Once you have the correct Railway URL:

1. **Update Vercel Environment Variable:**
   - Go to Vercel Dashboard → Your Project
   - **Settings** → **Environment Variables**
   - Find `VITE_API_URL` or create it
   - Set value to: `https://YOUR-RAILWAY-URL.up.railway.app`
   - Make sure it's set for **Production**, **Preview**, and **Development**
   - Click **Save**

2. **Update vercel.json (if using rewrites):**
   - Edit `vercel.json` in your repo
   - Update the rewrite destination URL
   - Commit and push

3. **Redeploy Vercel:**
   - Go to **Deployments** tab in Vercel
   - Click **"Redeploy"** on latest deployment
   - Or push a new commit to trigger auto-deploy

### Step 6: Test the Connection

After Railway is running and Vercel is updated:

1. **Test Railway directly:**
   ```
   https://YOUR-RAILWAY-URL.up.railway.app/api/health
   ```
   Should return JSON with status "ok"

2. **Test from Vercel site:**
   - Open your Vercel site
   - Open browser console (F12)
   - Try uploading a resume
   - Check for errors

## Common Railway Issues

### Issue: Service Paused (Free Tier Limit)
**Solution:** 
- Railway free tier pauses services after inactivity
- Click **"Resume"** in Railway dashboard
- Consider upgrading to paid plan for always-on service

### Issue: Service Deleted
**Solution:**
- Create a new Railway service
- Connect your GitHub repo
- Set environment variables
- Deploy
- Update Vercel with new URL

### Issue: Domain Changed
**Solution:**
- Check Railway dashboard for current domain
- Update Vercel `VITE_API_URL` environment variable
- Redeploy Vercel

### Issue: Build Failed
**Solution:**
- Check Railway logs for build errors
- Verify all environment variables are set
- Check `package.json` scripts
- Ensure Node.js version is compatible

## Quick Checklist

- [ ] Railway service is running (not paused/stopped)
- [ ] Latest deployment succeeded
- [ ] Correct Railway URL copied from dashboard
- [ ] Vercel `VITE_API_URL` environment variable updated
- [ ] Vercel project redeployed
- [ ] Railway health endpoint works: `/api/health`
- [ ] Vercel site can connect to Railway backend

## Need Help?

If Railway service is completely gone or you need to recreate it:

1. **Create New Railway Service:**
   - Go to Railway → New Project
   - Connect GitHub repo
   - Select `backend` folder as root
   - Set environment variables
   - Deploy

2. **Get New Domain:**
   - Railway will assign a new domain
   - Copy it from Settings → Domains

3. **Update Everything:**
   - Update Vercel `VITE_API_URL`
   - Update `vercel.json` rewrites
   - Redeploy Vercel

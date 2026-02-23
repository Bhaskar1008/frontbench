# Netlify Deployment Guide

## Step 1: Connect Repository to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"GitHub"** and authorize Netlify
4. Select your repository: `Bhaskar1008/frontbench`
5. Netlify will detect the `netlify.toml` file automatically

## Step 2: Configure Build Settings

Netlify should auto-detect these from `netlify.toml`:
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

If not auto-detected, manually set:
1. Go to **Site settings** → **Build & deploy**
2. Under **Build settings**, click **"Edit settings"**
3. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

## Step 3: Set Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add the following variables:

### Required Variable:
- **Key**: `VITE_API_URL`
- **Value**: Your Railway backend URL (e.g., `https://frontbench-production.up.railway.app`)
- **Scopes**: Select **"Production"**, **"Deploy previews"**, and **"Branch deploys"**

### Optional (if you have a custom domain):
- **Key**: `VITE_APP_NAME`
- **Value**: `Frontbench`

## Step 4: Trigger Build

### Option A: Automatic Build (Recommended)
- Netlify automatically builds when you push to `main` branch
- Go to **Deploys** tab to see build status

### Option B: Manual Build
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Or click **"Clear cache and deploy site"** if you need a fresh build

## Step 5: Check Build Status

1. Go to **Deploys** tab in Netlify dashboard
2. Click on the latest deploy to see:
   - Build logs
   - Build time
   - Deploy status (✅ Published or ❌ Failed)
3. Click **"View logs"** to see detailed build output

## Step 6: Get Your Site URL

After successful deployment:
1. Your site will be available at: `https://[random-name].netlify.app`
2. Go to **Site settings** → **General** → **Site details** to see your URL
3. You can change the site name in **Site settings** → **General** → **Change site name**

## Step 7: Configure CORS in Railway Backend

After you get your Netlify URL, update Railway backend CORS:

1. Go to **Railway Dashboard** → Your backend service
2. Go to **Variables** tab
3. Add/Update:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Netlify URL (e.g., `https://frontbench.netlify.app`)
4. Railway will automatically redeploy

### Current CORS Configuration

The backend already allows:
- ✅ `http://localhost:3000` (development)
- ✅ `https://*.netlify.app` (all Netlify subdomains)
- ✅ `FRONTEND_URL` environment variable (your specific Netlify URL)

So CORS should work automatically, but setting `FRONTEND_URL` is recommended for production.

## Troubleshooting

### Build Fails
1. Check **Deploys** → **View logs** for error messages
2. Common issues:
   - Missing `VITE_API_URL` → Add environment variable
   - Build errors → Check TypeScript/ESLint errors locally first
   - Node version → Netlify uses Node 18 by default (should work)

### CORS Errors
1. Check browser console for CORS error messages
2. Verify `VITE_API_URL` is set correctly in Netlify
3. Verify `FRONTEND_URL` is set in Railway (optional but recommended)
4. Check Railway logs to see if requests are reaching the backend

### API Calls Not Working
1. Verify `VITE_API_URL` environment variable is set
2. Check browser Network tab to see actual API URLs being called
3. Verify Railway backend is running and accessible
4. Check `netlify.toml` redirects are correct (they're for SSR, not needed for SPA)

## Quick Checklist

- [ ] Repository connected to Netlify
- [ ] Build settings configured (auto-detected from `netlify.toml`)
- [ ] `VITE_API_URL` environment variable set
- [ ] Build triggered and successful
- [ ] Site URL obtained
- [ ] `FRONTEND_URL` set in Railway (optional)
- [ ] Tested API calls from deployed site

## Next Steps

After deployment:
1. Test your site at the Netlify URL
2. Upload a resume and verify all features work
3. Check token usage tracking
4. Verify PDF exports work
5. Consider setting up a custom domain (optional)

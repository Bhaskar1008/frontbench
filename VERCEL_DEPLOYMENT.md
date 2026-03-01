# Vercel Deployment Guide for Frontbench Frontend

## Prerequisites
1. GitHub account with the Frontbench repository
2. Vercel account (sign up at https://vercel.com - free)

## Deployment Steps

### Step 1: Connect Repository to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account and choose the `frontbench` repository
4. Click "Import"

### Step 2: Configure Project Settings
Vercel should auto-detect the configuration from `vercel.json`, but verify these settings:

**Framework Preset:** Vite

**Root Directory:** Leave empty (or set to root `/`)

**Build Command:** `cd frontend && npm run build`

**Output Directory:** `frontend/dist`

**Install Command:** `cd frontend && npm install`

### Step 3: Set Environment Variables
In the Vercel project settings, go to **Settings > Environment Variables** and add:

```
VITE_API_URL=https://frontbench-production.up.railway.app
```

**Important:** Make sure to add this for all environments (Production, Preview, Development)

### Step 4: Deploy
1. Click "Deploy" button
2. Wait for build to complete (usually 2-3 minutes)
3. Your site will be live at: `https://your-project-name.vercel.app`

## Post-Deployment

### Update CORS on Backend (if needed)
If you encounter CORS errors, ensure your Railway backend allows requests from your Vercel domain:
- Add your Vercel domain to CORS allowed origins in `backend/src/index.ts`

### Custom Domain (Optional)
1. Go to **Settings > Domains** in Vercel
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check Node.js version (should be 20.x)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### API Calls Fail
- Verify `VITE_API_URL` environment variable is set correctly
- Check backend CORS settings
- Verify Railway backend is running

### 404 Errors on Routes
- This is handled by the rewrites in `vercel.json`
- If issues persist, check SPA routing configuration

## Vercel vs Netlify Comparison

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Free Bandwidth | 100GB/month | 100GB/month |
| Build Minutes | Unlimited | 300/month |
| Serverless Functions | 100/day | 125k/month |
| CDN | Global Edge | Global CDN |
| Auto Deploy | Yes | Yes |

## Notes
- Vercel automatically deploys on every push to `main` branch
- Preview deployments are created for pull requests
- Environment variables can be set per environment (production/preview/development)

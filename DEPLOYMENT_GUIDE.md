# Frontbench Deployment Guide

## Overview
This guide covers deploying Frontbench to production:
- **Frontend**: Netlify (static hosting)
- **Backend**: Railway or Render (Node.js API)
- **Database**: MongoDB Atlas (already configured)

## Prerequisites
- GitHub account
- Netlify account (free tier available)
- Railway account (free tier available) OR Render account
- MongoDB Atlas account (already set up)

---

## Part 1: Deploy Backend to Railway

### Step 1: Prepare Backend for Deployment

1. **Create a `railway.json` or use Railway's auto-detection**
   - Railway auto-detects Node.js projects

2. **Ensure `package.json` has build and start scripts:**
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "tsx src/index.ts"
     }
   }
   ```

3. **Create `.railwayignore` file** (optional):
   ```
   node_modules
   .env.local
   .git
   ```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)** and sign up/login

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the repository containing Frontbench backend

3. **Configure the Project**
   - Railway will auto-detect it's a Node.js project
   - Set root directory to: `Frontbench/backend`
   - Railway will run `npm install` and `npm run build` automatically

4. **Add Environment Variables**
   - Go to your project → Variables tab
   - Add all variables from `.env`:
     ```
     PORT=3001
     NODE_ENV=production
     MONGODB_URI=your-mongodb-connection-string-here
     DATABASE_NAME=frontbench-dev
     OPENAI_API_KEY=sk-proj-...
     LANGFUSE_SECRET_KEY=sk-lf-...
     LANGFUSE_PUBLIC_KEY=pk-lf-...
     LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
     ```

5. **Get Backend URL**
   - Railway will generate a URL like: `https://your-app-name.up.railway.app`
   - Copy this URL - you'll need it for the frontend

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Update Frontend Configuration

1. **Update `vite.config.ts`** to use production API URL:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

2. **Create `.env.production` file** in frontend directory:
```
VITE_API_URL=https://your-railway-app.up.railway.app
```

3. **Update API calls** - Ensure frontend uses environment variable:
   - The vite proxy only works in dev
   - For production, we need to use the full backend URL

### Step 2: Create Netlify Configuration

Create `netlify.toml` in the frontend directory:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://your-railway-app.up.railway.app/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 3: Deploy to Netlify

1. **Go to [Netlify.com](https://netlify.com)** and sign up/login

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository
   - Set base directory to: `Frontbench/frontend`

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-railway-app.up.railway.app
     ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your frontend
   - You'll get a URL like: `https://your-app-name.netlify.app`

---

## Part 3: Update CORS Settings

### Update Backend CORS

Update `backend/src/index.ts`:

```typescript
// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app-name.netlify.app',
    'https://*.netlify.app' // Allow all Netlify preview deployments
  ],
  credentials: true
}));
```

---

## Part 4: Alternative - Deploy Backend to Render

If Railway doesn't work, use Render:

### Step 1: Prepare for Render

1. **Create `render.yaml`** in backend directory:
```yaml
services:
  - type: web
    name: frontbench-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: DATABASE_NAME
        value: frontbench-dev
      - key: OPENAI_API_KEY
        sync: false
      - key: LANGFUSE_SECRET_KEY
        sync: false
      - key: LANGFUSE_PUBLIC_KEY
        sync: false
      - key: LANGFUSE_BASE_URL
        value: https://us.cloud.langfuse.com
```

### Step 2: Deploy to Render

1. **Go to [Render.com](https://render.com)** and sign up/login

2. **Create New Web Service**
   - Connect GitHub repository
   - Select the backend directory
   - Render will auto-detect Node.js

3. **Add Environment Variables**
   - Add all variables from `.env`

4. **Deploy**
   - Render will build and deploy
   - Get the URL: `https://your-app-name.onrender.com`

---

## Part 5: Update Frontend for Production API

Update frontend to use the production API URL:

### Option 1: Use Environment Variable (Recommended)

Update `frontend/src/pages/Dashboard.tsx` and other API calls:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Use API_BASE_URL in axios calls
const response = await axios.post(`${API_BASE_URL}/api/benchmarks`, { sessionId });
```

### Option 2: Create API Client

Create `frontend/src/utils/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

Then use `apiClient` instead of `axios` in components.

---

## Part 6: Final Steps

1. **Update Netlify Environment Variable**
   - Go to Netlify → Site settings → Environment variables
   - Set `VITE_API_URL` to your Railway/Render backend URL

2. **Redeploy Frontend**
   - Trigger a new deployment in Netlify
   - Or push a commit to trigger auto-deploy

3. **Test the Deployment**
   - Visit your Netlify URL
   - Upload a resume and test all features
   - Check browser console for any errors

---

## Troubleshooting

### Backend Issues

1. **Build fails on Railway/Render**
   - Check build logs
   - Ensure `package.json` has correct scripts
   - Verify TypeScript compiles: `npm run build`

2. **MongoDB connection fails**
   - Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
   - Check environment variables are set correctly

3. **CORS errors**
   - Update CORS origin to include your Netlify URL
   - Redeploy backend

### Frontend Issues

1. **API calls fail**
   - Check `VITE_API_URL` is set correctly
   - Verify backend URL is accessible
   - Check browser console for errors

2. **Build fails**
   - Check Netlify build logs
   - Ensure all dependencies are in `package.json`
   - Try building locally: `npm run build`

---

## Quick Reference

### Backend URLs
- Railway: `https://your-app-name.up.railway.app`
- Render: `https://your-app-name.onrender.com`

### Frontend URL
- Netlify: `https://your-app-name.netlify.app`

### Environment Variables Needed

**Backend (Railway/Render):**
- `PORT` (auto-set by platform)
- `NODE_ENV=production`
- `MONGODB_URI`
- `DATABASE_NAME`
- `OPENAI_API_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_BASE_URL`

**Frontend (Netlify):**
- `VITE_API_URL` (your backend URL)

---

## Cost Estimate

- **Netlify**: Free tier (100GB bandwidth, 300 build minutes/month)
- **Railway**: Free tier ($5 credit/month, then pay-as-you-go)
- **Render**: Free tier (limited hours, then $7/month)
- **MongoDB Atlas**: Free tier (512MB storage)

**Recommended**: Railway for backend (better free tier), Netlify for frontend (always free for static sites)

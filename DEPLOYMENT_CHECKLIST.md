# ✅ Deployment Checklist

Use this checklist to ensure you don't miss any steps during deployment.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All environment variables are documented
- [ ] MongoDB Atlas is accessible (IP whitelist allows 0.0.0.0/0)

## Backend Deployment (Railway)

- [ ] Railway account created
- [ ] New project created from GitHub repo
- [ ] Root directory set to `Frontbench/backend`
- [ ] Environment variables added:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI`
  - [ ] `DATABASE_NAME`
  - [ ] `OPENAI_API_KEY`
  - [ ] `LANGFUSE_SECRET_KEY`
  - [ ] `LANGFUSE_PUBLIC_KEY`
  - [ ] `LANGFUSE_BASE_URL`
- [ ] Deployment successful (green checkmark)
- [ ] Backend URL copied: `https://________________.up.railway.app`
- [ ] Health check passed: `/api/health` returns OK

## Frontend Deployment (Netlify)

- [ ] Netlify account created
- [ ] New site created from GitHub repo
- [ ] Base directory set to `Frontbench/frontend`
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Environment variable added:
  - [ ] `VITE_API_URL` = Railway backend URL
- [ ] `netlify.toml` updated with Railway URL
- [ ] Deployment successful
- [ ] Frontend URL copied: `https://________________.netlify.app`

## Post-Deployment

- [ ] CORS configured (added `FRONTEND_URL` to Railway)
- [ ] Frontend tested:
  - [ ] Homepage loads
  - [ ] Resume upload works
  - [ ] Dashboard displays correctly
  - [ ] All tabs work (Analysis, Benchmarks, Trajectory, Learning Path)
- [ ] No console errors
- [ ] No CORS errors
- [ ] PDF export works
- [ ] Token usage displays correctly

## URLs Saved

- **Frontend**: ________________________________
- **Backend**: ________________________________

## Notes

_Add any deployment notes or issues encountered here:_

_________________________________________________
_________________________________________________
_________________________________________________

---

**Deployment Date**: _______________
**Deployed By**: _______________

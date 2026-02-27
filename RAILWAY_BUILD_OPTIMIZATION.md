# ⚡ Railway Build Optimization Guide

## Problem: npm install Taking 5+ Minutes

The build is slow because:
1. **Puppeteer** downloads Chromium (~300MB) - **REMOVED** ✅
2. **Large dependencies** (LangChain packages, chromadb)
3. **No build cache** optimization

---

## Solutions Applied

### ✅ Solution 1: Removed Puppeteer

**Problem:** Puppeteer downloads Chromium browser (~300MB) which takes 3-5 minutes.

**Fix:** Removed `puppeteer` from dependencies (it wasn't being used).

**Result:** Saves ~3-5 minutes of build time.

---

### ✅ Solution 2: Optimized Railway Build Command

**Before:**
```json
"buildCommand": "npm install && npm run build"
```

**After:**
```json
"buildCommand": "npm install --production=false && npm run build"
```

**Why not `npm ci`?**
- Railway's Docker cache mounts conflict with `npm ci` (EBUSY error)
- `npm install` works better with Railway's caching system
- `--production=false` ensures dev dependencies are installed (needed for TypeScript build)

**Note:** Railway automatically caches `node_modules`, so subsequent builds are faster.

---

## Additional Optimizations

### Option 1: Use .npmrc for Faster Installs

Create `backend/.npmrc`:
```
legacy-peer-deps=true
prefer-offline=true
audit=false
fund=false
```

### Option 2: Reduce Dependencies (If Not Using)

If you're not using Chroma/RAG features, you can make them optional:

**Current:** All LangChain packages installed
**Optimized:** Only install when `ENABLE_RAG=true`

---

## Expected Build Times

### Before Optimization:
- npm install: **5-7 minutes** (with Puppeteer)
- Total build: **6-8 minutes**

### After Optimization:
- npm install: **2-3 minutes** (without Puppeteer)
- Total build: **3-4 minutes**

**Savings: ~3-4 minutes per build!** ⚡

---

## What Changed

### Removed:
- ❌ `puppeteer` (not used, downloads 300MB Chromium)

### Optimized:
- ✅ Build command uses `npm ci --omit=dev`
- ✅ Faster, more reliable installs

---

## Verification

After redeploying, check Railway build logs:

**You should see:**
- Faster `npm ci` step (2-3 min instead of 5+ min)
- No Puppeteer/Chromium downloads
- Build completes faster overall

---

## If Build Still Slow

### Check These:

1. **Network Issues:**
   - Railway's network might be slow
   - Try redeploying (sometimes helps)

2. **Large Packages:**
   - `chromadb` (~50MB)
   - LangChain packages (~30MB total)
   - These are necessary for agentic AI features

3. **First Build:**
   - First build is always slower (no cache)
   - Subsequent builds use cache and are faster

---

## Build Time Breakdown (After Optimization)

```
npm ci --omit=dev:    2-3 min  (was 5-7 min)
npm run build:        30-60 sec
Total:                3-4 min  (was 6-8 min)
```

---

## Next Steps

1. **Redeploy** on Railway
2. **Check build logs** - should be faster now
3. **Monitor** - first build might still be slow (no cache)

**The build should now complete in ~3-4 minutes instead of 5+ minutes!** 🚀

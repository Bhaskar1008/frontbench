# 🔍 How to Check Chroma Initialization Logs

## Why You Don't See Logs Yet

**Chroma initializes lazily** - it only connects when:
1. A request uses RAG features
2. VectorStoreManager.initialize() is called
3. An agent tries to search documents

**It does NOT initialize at server startup**, so you won't see logs until something triggers it.

---

## Method 1: Check Health Endpoint (Easiest) ✅

### Step 1: Call Health Endpoint

Open in browser or use curl:
```
https://your-railway-backend.up.railway.app/api/health
```

### Step 2: Check Response

You'll see Chroma status in the JSON response:
```json
{
  "status": "ok",
  "database": "connected",
  "chroma": {
    "enabled": true,
    "status": "connected",  // or "error" or "disconnected"
    "error": null,
    "configured": true
  }
}
```

### Step 3: Check Railway Logs

After calling `/api/health`, check Railway logs. You should now see:
- ✅ `Vector store initialized: https://api.trychroma.com`
- OR ❌ `Failed to initialize vector store: [error]`
- OR ⚠️ `Chroma URL not set. RAG features will be disabled.`

---

## Method 2: Trigger RAG Feature

### Option A: Upload a Resume via Agent API

```bash
POST https://your-railway-backend.up.railway.app/api/agent/resume/analyze
```

This will trigger Chroma initialization if RAG is enabled.

### Option B: Use Frontend

1. Open your deployed frontend
2. Upload a resume
3. Check Railway logs immediately after

---

## Method 3: Add Startup Initialization (Optional)

If you want Chroma to initialize at startup, you can add this to `backend/src/index.ts`:

```typescript
// After MongoDB connection, before starting server
if (process.env.ENABLE_RAG === 'true') {
  console.log('🔍 Initializing Chroma vector store...');
  const { VectorStoreManager } = await import('./vector-store/VectorStoreManager.js');
  const vectorStore = new VectorStoreManager({
    collectionName: process.env.CHROMA_COLLECTION || 'frontbench_documents',
  });
  
  try {
    await vectorStore.initialize();
    console.log('✅ Chroma vector store ready');
  } catch (error: any) {
    console.error('❌ Chroma initialization failed:', error.message);
  }
}
```

---

## Quick Test Commands

### Test Health Endpoint:
```bash
curl https://your-railway-backend.up.railway.app/api/health
```

### Test with Browser:
Just open: `https://your-railway-backend.up.railway.app/api/health`

---

## What to Look For in Logs

### Success:
```
✅ Vector store initialized: https://api.trychroma.com
```

### Error (Missing Config):
```
❌ Failed to initialize vector store: Chroma Cloud mode requires CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE environment variables
```

### Error (Connection Failed):
```
❌ Failed to initialize vector store: [connection error details]
```

### Disabled:
```
⚠️  Chroma URL not set. RAG features will be disabled.
```

---

## Troubleshooting

### No Logs Appearing?

1. **Make sure you've called an endpoint** that uses Chroma
2. **Check Railway logs in real-time** (not just startup logs)
3. **Try the `/api/health` endpoint** - it now checks Chroma status

### Logs Show Error?

1. **Check Railway Variables** - Are all Chroma variables set?
2. **Verify API Key** - Is `CHROMA_API_KEY` correct?
3. **Check Tenant/Database** - Are they set correctly?
4. **Review error message** - It will tell you what's missing

---

## Current Status Check

After calling `/api/health`, you'll immediately know:
- ✅ Chroma is connected
- ❌ Chroma has an error (check error message)
- ⚠️ Chroma is disabled (ENABLE_RAG=false)

**The health endpoint now includes Chroma status!** 🎉

# Railway Chroma Setup Guide

## Options for Chroma in Railway

You have **3 options** for handling Chroma/Vector Store in Railway:

---

## Option 1: Disable RAG (Recommended for Start) ✅

**Easiest option** - Agents will work without vector store features.

### Railway Environment Variables:
```env
ENABLE_AGENTIC_AI=true
ENABLE_RAG=false
# Don't set CHROMA_URL
```

**What works:**
- ✅ All agents (Resume, Benchmark, Trajectory, LearningPath)
- ✅ Planning and execution
- ✅ Memory management
- ✅ Security guardrails
- ✅ Analytics

**What doesn't work:**
- ❌ Document search via RAG
- ❌ Vector-based similarity search
- ❌ Document intelligence features that require vector store

**Use this if:** You want to deploy quickly without setting up Chroma.

---

## Option 2: Use Chroma Cloud (Production) 🌐

**Best for production** - Managed Chroma service.

### Steps:
1. Sign up at [Chroma Cloud](https://www.trychroma.com/)
2. Create a collection
3. Get your API endpoint URL

### Railway Environment Variables:
```env
ENABLE_AGENTIC_AI=true
ENABLE_RAG=true
CHROMA_URL=https://your-chroma-cloud-url.chroma.cloud
CHROMA_COLLECTION=frontbench_documents
```

**Cost:** Paid service (check Chroma Cloud pricing)

**Use this if:** You need production-grade RAG features.

---

## Option 3: Self-Host Chroma (Advanced) 🚀

**Deploy Chroma as a separate Railway service.**

### Steps:

1. **Create a new Railway service for Chroma:**
   - Add new service in Railway
   - Use Docker image: `chromadb/chroma:latest`
   - Expose port 8000

2. **Get Chroma service URL:**
   - Railway will provide: `https://chroma-service.up.railway.app`
   - Or use internal service URL

3. **Set Railway Environment Variables:**
```env
ENABLE_AGENTIC_AI=true
ENABLE_RAG=true
CHROMA_URL=https://chroma-service.up.railway.app
CHROMA_COLLECTION=frontbench_documents
```

**Use this if:** You want full control and don't want to pay for Chroma Cloud.

---

## Recommended Setup for Railway

### For Quick Deployment (Start Here):

```env
# In Railway Variables tab:
ENABLE_AGENTIC_AI=true
ENABLE_RAG=false
```

**Why:** 
- Agents work without Chroma
- No additional setup needed
- Can add Chroma later

### For Full Features (Later):

```env
ENABLE_AGENTIC_AI=true
ENABLE_RAG=true
CHROMA_URL=your-chroma-url-here
CHROMA_COLLECTION=frontbench_documents
```

---

## How It Works

The code now handles missing Chroma gracefully:

1. **If `ENABLE_RAG=false`**: Vector store is skipped, agents work normally
2. **If `ENABLE_RAG=true` but no `CHROMA_URL`**: Error message, suggests setting URL
3. **If Chroma connection fails**: Warning logged, agents continue without RAG

---

## Testing

After deployment, check logs:

**Success:**
```
✅ Vector store initialized: https://your-chroma-url
```

**Disabled:**
```
⚠️  Chroma URL not set. RAG features will be disabled.
```

**Error:**
```
❌ Failed to initialize vector store: [error message]
```

---

## Summary

**For Railway deployment, you have 3 choices:**

1. ✅ **Disable RAG** (easiest) - Set `ENABLE_RAG=false`, don't set `CHROMA_URL`
2. 🌐 **Use Chroma Cloud** (production) - Set `CHROMA_URL` to Chroma Cloud endpoint
3. 🚀 **Self-host Chroma** (advanced) - Deploy Chroma separately, use its URL

**Recommendation:** Start with Option 1, add Chroma later if needed!

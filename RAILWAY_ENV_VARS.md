# Fix Railway Environment Variables Error

## Problem
Railway is showing: `❌ Error: MONGODB_URI is not set in environment variables`

This means Railway doesn't have the environment variables configured.

---

## Solution: Add Environment Variables in Railway

### Step 1: Go to Railway Variables

1. **Open Railway Dashboard**: https://railway.app
2. **Click on your project** → Click on **"frontbench" service**
3. **Click "Variables" tab** (top navigation, next to "Settings")
4. **Click "New Variable"** button

### Step 2: Add Each Environment Variable

Add these variables **one by one**:

#### Variable 1:
- **Key**: `MONGODB_URI`
- **Value**: `mongodb+srv://bhaskarkeelu92_db_user:SbyTKO0SbPB9hTgP@cluster0.q8f0en4.mongodb.net/`
- Click **"Add"**

#### Variable 2:
- **Key**: `DATABASE_NAME`
- **Value**: `frontbench-dev`
- Click **"Add"**

#### Variable 3:
- **Key**: `OPENAI_API_KEY`
- **Value**: `your-openai-api-key-here` (get from your .env file)
- Click **"Add"**

#### Variable 4:
- **Key**: `LANGFUSE_SECRET_KEY`
- **Value**: `sk-lf-9633c1c1-c669-4554-9e83-f41e81868038`
- Click **"Add"**

#### Variable 5:
- **Key**: `LANGFUSE_PUBLIC_KEY`
- **Value**: `pk-lf-130138b2-8189-4ab1-9df2-a34f1f5eb005`
- Click **"Add"**

#### Variable 6:
- **Key**: `LANGFUSE_BASE_URL`
- **Value**: `https://us.cloud.langfuse.com`
- Click **"Add"**

#### Variable 7 (Optional):
- **Key**: `NODE_ENV`
- **Value**: `production`
- Click **"Add"**

### Step 3: Verify Variables

After adding all variables, you should see them listed in the Variables tab:

```
✅ MONGODB_URI
✅ DATABASE_NAME
✅ OPENAI_API_KEY
✅ LANGFUSE_SECRET_KEY
✅ LANGFUSE_PUBLIC_KEY
✅ LANGFUSE_BASE_URL
✅ NODE_ENV (optional)
```

**Note**: Railway automatically sets `PORT` - don't add it manually.

### Step 4: Redeploy

After adding variables, Railway will **automatically redeploy**. Watch the Deploy Logs:

1. Go to **"Deploy Logs"** tab
2. Wait for deployment to complete
3. Should see: `✅ MongoDB connected to database: frontbench-dev`

---

## Quick Copy-Paste List

Use this list to add variables quickly:

```
MONGODB_URI=mongodb+srv://bhaskarkeelu92_db_user:SbyTKO0SbPB9hTgP@cluster0.q8f0en4.mongodb.net/
DATABASE_NAME=frontbench-dev
OPENAI_API_KEY=your-openai-api-key-here
LANGFUSE_SECRET_KEY=sk-lf-9633c1c1-c669-4554-9e83-f41e81868038
LANGFUSE_PUBLIC_KEY=pk-lf-130138b2-8189-4ab1-9df2-a34f1f5eb005
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
NODE_ENV=production
```

---

## Visual Guide: Where to Find Variables

```
Railway Dashboard
├── Your Project
    ├── frontbench (service)
        ├── [Tabs: Details | Build Logs | Deploy Logs | Variables ← CLICK HERE]
        │   ├── "New Variable" button
        │   ├── Variable list
        │   └── Add each variable
        └── ...
```

---

## Troubleshooting

### Issue: Variables not saving
- Make sure you click **"Add"** after entering each variable
- Check if variable name has no spaces
- Verify value is correct

### Issue: Still getting MONGODB_URI error
- **Refresh Railway page** and check Variables tab again
- **Redeploy manually**: Click "Redeploy" button
- **Check variable name**: Must be exactly `MONGODB_URI` (case-sensitive)

### Issue: Variables showing but still error
- **Check for typos** in variable names
- **Verify values** are correct (no extra spaces)
- **Redeploy** the service

### Issue: Can't find Variables tab
- Make sure you're in the **service** view, not project view
- Click on the service name first, then look for Variables tab

---

## After Adding Variables

Once all variables are added:

1. ✅ Railway will auto-redeploy
2. ✅ Check Deploy Logs
3. ✅ Should see: `✅ MongoDB connected to database: frontbench-dev`
4. ✅ Test API: Visit `https://your-app.up.railway.app/api/health`

---

## Security Note

⚠️ **Important**: These are sensitive credentials. Make sure:
- Variables are set in Railway (not committed to git)
- Railway Variables tab shows them (they're encrypted)
- Never share your Railway dashboard publicly

---

## Summary Checklist

- [ ] Go to Railway → Your Service → Variables tab
- [ ] Add `MONGODB_URI`
- [ ] Add `DATABASE_NAME`
- [ ] Add `OPENAI_API_KEY`
- [ ] Add `LANGFUSE_SECRET_KEY`
- [ ] Add `LANGFUSE_PUBLIC_KEY`
- [ ] Add `LANGFUSE_BASE_URL`
- [ ] Add `NODE_ENV` (optional)
- [ ] Verify all variables are listed
- [ ] Wait for auto-redeploy
- [ ] Check Deploy Logs for success
- [ ] Test API endpoint

**After adding variables, Railway will automatically redeploy and the error should be fixed!** 🚀

# 📦 GitHub Repository Setup Guide

## Step-by-Step: Create New Repository and Push Code

### Prerequisites
- GitHub account (create at https://github.com if you don't have one)
- Git installed on your computer (check with `git --version`)

---

## Part 1: Create New Repository on GitHub (2 minutes)

### Step 1.1: Create Repository
1. Go to **https://github.com** and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `frontbench` (or any name you prefer)
   - **Description**: "Frontbench - Career trajectory and learning path platform"
   - **Visibility**: 
     - ✅ **Public** (free, anyone can see)
     - ⚪ **Private** (requires GitHub Pro for free, or $4/month)
   - **DO NOT** check "Initialize with README" (we'll push our own code)
   - **DO NOT** add .gitignore or license (we already have these)
4. Click **"Create repository"**

### Step 1.2: Copy Repository URL
After creating, GitHub will show you a page with setup instructions. **Copy the repository URL**:
- It will look like: `https://github.com/YOUR_USERNAME/frontbench.git` - https://github.com/Bhaskar1008/frontbench.git
- Or SSH: `git@github.com:YOUR_USERNAME/frontbench.git`


**Save this URL** - you'll need it in the next steps!

---

## Part 2: Initialize Git and Push Code (5 minutes)

### Step 2.1: Open Terminal/Command Prompt

**Windows:**
- Press `Win + R`, type `cmd` and press Enter
- Or use PowerShell
- Or use Git Bash (if installed)

**Mac/Linux:**
- Open Terminal

### Step 2.2: Navigate to Frontbench Directory

```bash
# Navigate to your project directory
cd "d:\Core-Work\langfuse-poc\Frontbench"
```

**Note**: Adjust the path based on where your Frontbench folder is located.

### Step 2.3: Initialize Git Repository

```bash
# Initialize git repository (if not already initialized)
git init
```

### Step 2.4: Check Current Status

```bash
# See what files will be added
git status
```

You should see a list of files that will be committed.

### Step 2.5: Add All Files

```bash
# Add all files to staging
git add .
```

### Step 2.6: Create .gitignore (if not exists)

Make sure sensitive files are not committed. Create/check `.gitignore` in the root:

```bash
# Create .gitignore if it doesn't exist
# Or check if it exists and has these entries:
```

**Backend `.gitignore`** (should be in `Frontbench/backend/.gitignore`):
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

**Frontend `.gitignore`** (should be in `Frontbench/frontend/.gitignore`):
```
node_modules/
dist/
.env
.env.local
.DS_Store
```

**Root `.gitignore`** (create in `Frontbench/.gitignore`):
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

### Step 2.7: Commit Files

```bash
# Commit all files with a message
git commit -m "Initial commit: Frontbench platform with MongoDB, token tracking, and PDF export"
```

**If you get an error about user name/email**, set them first:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Then try the commit again.

### Step 2.8: Add Remote Repository

```bash
# Add GitHub repository as remote (replace with YOUR repository URL)
git remote add origin https://github.com/YOUR_USERNAME/frontbench.git
```

**Replace `YOUR_USERNAME` and `frontbench` with your actual repository details.**

### Step 2.9: Push to GitHub

```bash
# Push code to GitHub (main branch)
git branch -M main
git push -u origin main
```

**If prompted for credentials:**
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)
  - See below for how to create one

---

## Part 3: Create Personal Access Token (if needed)

If Git asks for authentication, you need a Personal Access Token:

### Step 3.1: Generate Token
1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - **Note**: "Frontbench Deployment"
   - **Expiration**: Choose expiration (90 days recommended)
   - **Scopes**: Check `repo` (full control of private repositories)
4. Click **"Generate token"**
5. **Copy the token immediately** (you won't see it again!)

### Step 3.2: Use Token
When Git asks for password, paste the **token** instead of your GitHub password.

---

## Part 4: Verify Upload (1 minute)

### Step 4.1: Check GitHub
1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/frontbench`
2. You should see all your files:
   - `backend/` folder
   - `frontend/` folder
   - `README.md`
   - Other files

### Step 4.2: Verify Structure
Make sure these folders are visible:
- ✅ `Frontbench/backend/`
- ✅ `Frontbench/frontend/`
- ✅ `Frontbench/.env` should **NOT** be visible (should be in .gitignore)

---

## Part 5: Update Deployment Guides (Optional)

Now that your code is on GitHub, you can proceed with deployment:

1. Follow **`STEP_BY_STEP_DEPLOYMENT.md`** for deployment steps
2. When Railway/Netlify asks for repository, select your new GitHub repository

---

## Troubleshooting

### Error: "remote origin already exists"
```bash
# Remove existing remote
git remote remove origin
# Add it again with correct URL
git remote add origin https://github.com/YOUR_USERNAME/frontbench.git
```

### Error: "failed to push some refs"
```bash
# Pull first (if repository was initialized with README)
git pull origin main --allow-unrelated-histories
# Then push
git push -u origin main
```

### Error: "Authentication failed"
- Make sure you're using Personal Access Token, not password
- Check token has `repo` scope
- Regenerate token if expired

### Error: "fatal: not a git repository"
```bash
# Make sure you're in the Frontbench directory
cd "d:\Core-Work\langfuse-poc\Frontbench"
# Initialize git
git init
```

### Files not showing on GitHub
```bash
# Check .gitignore isn't excluding important files
git status
# Force add if needed (be careful!)
git add -f filename
```

---

## Quick Command Reference

```bash
# Navigate to project
cd "d:\Core-Work\langfuse-poc\Frontbench"

# Initialize git
git init

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Initial commit: Frontbench platform"

# Add remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/frontbench.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Next Steps

After pushing to GitHub:

1. ✅ **Verify code is on GitHub**
2. ✅ **Proceed to Railway deployment** (Part 2 of `STEP_BY_STEP_DEPLOYMENT.md`)
3. ✅ **Proceed to Netlify deployment** (Part 3 of `STEP_BY_STEP_DEPLOYMENT.md`)

---

## Security Notes

⚠️ **Important**: Never commit these files:
- `.env` files (contain API keys)
- `node_modules/` (too large, can be regenerated)
- `dist/` (build output, can be regenerated)

✅ **Safe to commit**:
- Source code (`src/` folders)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation (`.md` files)

---

## Summary Checklist

- [ ] GitHub account created
- [ ] New repository created on GitHub
- [ ] Repository URL copied
- [ ] Git initialized in Frontbench directory
- [ ] `.gitignore` files checked/created
- [ ] All files added (`git add .`)
- [ ] Files committed (`git commit`)
- [ ] Remote added (`git remote add origin`)
- [ ] Code pushed to GitHub (`git push`)
- [ ] Verified files are on GitHub
- [ ] Ready for deployment!

**You're all set! Now proceed with deployment using `STEP_BY_STEP_DEPLOYMENT.md`** 🚀

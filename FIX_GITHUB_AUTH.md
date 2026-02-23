# Fix GitHub Authentication Error (403)

## Problem
You're getting: `Permission denied to Bhaskar1008/frontbench.git denied to BhaskarKeelu1008`

This means:
- You're authenticated as: `BhaskarKeelu1008`
- Trying to push to: `Bhaskar1008`'s repository

## Solution Options

### Option 1: Use Personal Access Token (Recommended)

GitHub no longer accepts passwords. You need a Personal Access Token.

#### Step 1: Generate Personal Access Token

1. Go to **https://github.com** and sign in as `Bhaskar1008`
2. Click your **profile picture** (top right) → **Settings**
3. Scroll down → **Developer settings** (left sidebar)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **"Generate new token"** → **"Generate new token (classic)"**
6. Fill in:
   - **Note**: "Frontbench Deployment"
   - **Expiration**: 90 days (or your preference)
   - **Scopes**: Check ✅ `repo` (full control of private repositories)
7. Click **"Generate token"** at the bottom
8. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Step 2: Use Token to Push

```bash
# When Git asks for password, use the TOKEN instead
git push -u origin main
```

**When prompted:**
- **Username**: `Bhaskar1008`
- **Password**: Paste your **Personal Access Token** (not your GitHub password)

---

### Option 2: Update Remote URL with Token

You can embed the token in the URL (less secure, but works):

```bash
# Remove existing remote
git remote remove origin

# Add remote with token (replace YOUR_TOKEN with actual token)
git remote add origin https://YOUR_TOKEN@github.com/Bhaskar1008/frontbench.git

# Push
git push -u origin main
```

**Note**: This stores the token in your git config. Use Option 1 for better security.

---

### Option 3: Use SSH Instead of HTTPS

#### Step 1: Generate SSH Key (if you don't have one)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "bhaskarkeelu.92@gmail.com"

# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one)
```

#### Step 2: Add SSH Key to GitHub

1. Copy your public key:
```bash
# Windows
cat ~/.ssh/id_ed25519.pub
# Or
type %USERPROFILE%\.ssh\id_ed25519.pub
```

2. Go to GitHub → **Settings** → **SSH and GPG keys** → **New SSH key**
3. Paste the key and save

#### Step 3: Update Remote to SSH

```bash
# Remove HTTPS remote
git remote remove origin

# Add SSH remote
git remote add origin git@github.com:Bhaskar1008/frontbench.git

# Push
git push -u origin main
```

---

### Option 4: Check Repository Ownership

Make sure the repository `Bhaskar1008/frontbench` exists and you have access:

1. Go to: **https://github.com/Bhaskar1008/frontbench**
2. Verify you can see the repository
3. If it doesn't exist, create it first:
   - Go to https://github.com/new
   - Name: `frontbench`
   - Create repository

---

## Quick Fix (Try This First)

```bash
# 1. Remove existing remote
git remote remove origin

# 2. Add remote again (will prompt for credentials)
git remote add origin https://github.com/Bhaskar1008/frontbench.git

# 3. Push (will ask for username and password)
git push -u origin main
```

**When prompted:**
- Username: `Bhaskar1008`
- Password: Use **Personal Access Token** (see Option 1 above)

---

## Verify Authentication

After pushing successfully, verify:

```bash
# Check remote URL
git remote -v

# Should show:
# origin  https://github.com/Bhaskar1008/frontbench.git (fetch)
# origin  https://github.com/Bhaskar1008/frontbench.git (push)
```

---

## Common Issues

### Issue: "Repository not found"
- **Fix**: Make sure repository exists at https://github.com/Bhaskar1008/frontbench
- **Fix**: Check you're signed in as the correct GitHub account

### Issue: "Token expired"
- **Fix**: Generate a new Personal Access Token
- **Fix**: Use SSH instead (doesn't expire)

### Issue: "Permission denied"
- **Fix**: Make sure you own the repository or have write access
- **Fix**: Check you're using the correct GitHub account

---

## Recommended Solution

**Use Option 1 (Personal Access Token)** - It's the most secure and recommended by GitHub.

1. Generate token (5 minutes)
2. Use token when Git asks for password
3. Push successfully!

---

## After Successful Push

Once you've pushed successfully:

1. ✅ Verify code is on GitHub: https://github.com/Bhaskar1008/frontbench
2. ✅ Proceed with Railway deployment (see `STEP_BY_STEP_DEPLOYMENT.md`)
3. ✅ Proceed with Netlify deployment

---

## Need More Help?

- GitHub Docs: https://docs.github.com/en/authentication
- Personal Access Tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

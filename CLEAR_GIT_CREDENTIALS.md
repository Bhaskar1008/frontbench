# Clear Cached Git Credentials on Windows

## Problem
Git is using cached credentials for `BhaskarKeelu1008` but you need to push as `Bhaskar1008`. No prompt appears because credentials are cached.

## Solution: Clear Cached Credentials

### Method 1: Clear via Windows Credential Manager (Recommended)

1. **Open Windows Credential Manager**:
   - Press `Win + R`
   - Type: `control /name Microsoft.CredentialManager`
   - Press Enter
   - OR search "Credential Manager" in Start menu

2. **Find GitHub credentials**:
   - Click **"Windows Credentials"** tab
   - Look for entries like:
     - `git:https://github.com`
     - `github.com`
     - Any entry with "github" in the name

3. **Remove GitHub credentials**:
   - Click on the GitHub credential entry
   - Click **"Remove"** or **"Delete"**
   - Confirm deletion

4. **Try pushing again**:
   ```bash
   git push -u origin main
   ```
   - Now it should prompt for username and password
   - Username: `Bhaskar1008`
   - Password: Use your **Personal Access Token** (see below)

---

### Method 2: Clear via Git Command

```bash
# Clear all cached credentials
git credential-manager-core erase
# Or try:
git credential reject https://github.com

# Then try pushing
git push -u origin main
```

---

### Method 3: Use Git Credential Manager Command

```bash
# List stored credentials
cmdkey /list

# Remove GitHub credentials (if found)
cmdkey /delete:git:https://github.com
# Or
cmdkey /delete:github.com

# Try pushing again
git push -u origin main
```

---

## Generate Personal Access Token

Since GitHub no longer accepts passwords, you need a token:

1. Go to **https://github.com** → Sign in as `Bhaskar1008`
2. Click **Profile** → **Settings** → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**
4. Fill in:
   - **Note**: "Frontbench Deployment"
   - **Expiration**: 90 days
   - **Scopes**: Check ✅ `repo`
5. Click **Generate token**
6. **Copy the token** (starts with `ghp_`)

---

## Push After Clearing Credentials

After clearing credentials, run:

```bash
git push -u origin main
```

**When prompted:**
- **Username**: `Bhaskar1008`
- **Password**: Paste your **Personal Access Token**

---

## Alternative: Embed Token in URL (One-Time Setup)

If you want to avoid entering credentials:

```bash
# Remove existing remote
git remote remove origin

# Add remote with token embedded (replace YOUR_TOKEN)
git remote add origin https://YOUR_TOKEN@github.com/Bhaskar1008/frontbench.git

# Push (no prompt needed)
git push -u origin main
```

**Note**: Token will be stored in git config. Less secure but convenient.

---

## Verify Success

After successful push:

1. Check GitHub: https://github.com/Bhaskar1008/frontbench
2. All files should be visible
3. Proceed with deployment!

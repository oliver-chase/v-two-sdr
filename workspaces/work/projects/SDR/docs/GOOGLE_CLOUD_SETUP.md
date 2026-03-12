# Google Cloud Setup Guide

**Goal:** Create Google Cloud Project, service accounts, and credentials for SDR Sheets integration.

**Time:** 15-20 minutes | **Requirements:** Google Cloud Console access, admin access to G Suite

---

## Step 1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"Select a Project"** at top
3. Click **"NEW PROJECT"**
4. Enter name: **"V.Two SDR"**
5. Click **"CREATE"**
6. Wait for project to be created (1-2 min)

---

## Step 2: Enable Required APIs

1. In the project, go to **APIs & Services** → **Library**
2. Search for **"Google Sheets API"**
   - Click on it
   - Click **"ENABLE"**
3. Search for **"Google Drive API"**
   - Click on it
   - Click **"ENABLE"**

---

## Step 3: Create Service Account #1 (Claude Code - Read Only)

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"Service Account"**
3. Fill in:
   - **Service account name:** `claude-code-sdr`
   - **Service account ID:** (auto-filled)
   - **Description:** "Claude Code SDR connector (read-only)"
4. Click **"CREATE AND CONTINUE"**
5. Skip "Grant this service account access to project" (click **"CONTINUE"**)
6. Click **"DONE"**

---

## Step 4: Create Service Account #2 (OpenClaw - Read/Write)

1. Click **"+ CREATE CREDENTIALS"** → **"Service Account"**
2. Fill in:
   - **Service account name:** `openclaw-sdr`
   - **Service account ID:** (auto-filled)
   - **Description:** "OpenClaw SDR connector (read/write)"
3. Click **"CREATE AND CONTINUE"**
4. Skip grant step, click **"CONTINUE"**
5. Click **"DONE"**

---

## Step 5: Generate JSON Credentials for Claude Code

1. Go to **APIs & Services** → **Credentials**
2. Under **"Service Accounts"**, click on **`claude-code-sdr@...`**
3. Click **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"**
6. Click **"CREATE"**
   - File downloads automatically: `claude-code-sdr-XXXXXX.json`
7. Rename and move to:
   ```
   workspaces/work/projects/SDR/secrets/google-code-credentials.json
   ```

---

## Step 6: Generate JSON Credentials for OpenClaw

1. Go to **APIs & Services** → **Credentials**
2. Under **"Service Accounts"**, click on **`openclaw-sdr@...`**
3. Click **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"**
6. Click **"CREATE"**
   - File downloads: `openclaw-sdr-XXXXXX.json`
7. Rename and move to:
   ```
   workspaces/work/projects/SDR/secrets/google-openclaw-credentials.json
   ```

---

## Step 7: Share Google Sheet with Service Accounts

### Option A: Using Existing Sheet

1. Open your Google Sheet
2. Note the **Sheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   ```
3. Share with Claude Code service account:
   - Click **"Share"** button
   - Add email: `claude-code-sdr@{project-id}.iam.gserviceaccount.com`
   - Permission: **Viewer** (read-only)
   - Click **"Share"**
4. Share with OpenClaw service account:
   - Click **"Share"** button
   - Add email: `openclaw-sdr@{project-id}.iam.gserviceaccount.com`
   - Permission: **Editor** (read/write)
   - Click **"Share"**

### Option B: Create New Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **"+ Blank"** spreadsheet
3. Rename to: **"SDR Prospects"**
4. Create sheets:
   - Tab 1: **"Prospects"** (main data)
   - Tab 2: **"Templates"** (email templates)
   - Tab 3: **"OptOuts"** (opt-out list)
5. Add headers to **Prospects** sheet:
   - A: FirstName
   - B: LastName
   - C: Email
   - D: Company
   - E: Title
   - F: LinkedIn
   - G: Location
   - H: Timezone
   - I: Track
   - J: Status
   - K: DateAdded
   - L: LastSent
   - M: LastReply
   - N: ReplyStatus
   - O: Notes
   - P: Source

6. Share sheets with both service accounts (see above)

---

## Step 8: Update Config File

Edit `workspaces/work/projects/SDR/config.sheets.js`:

```javascript
const config = {
  google_sheets: {
    sheet_id: 'PASTE_YOUR_SHEET_ID_HERE',
    sheet_name: 'Prospects',
    templates_sheet: 'Templates',
    optouts_sheet: 'OptOuts'
  },
  credentials_path: './secrets/google-code-credentials.json'
};
```

---

## Step 9: Verify Credentials

```bash
cd workspaces/work/projects/SDR

# Check credentials files exist
ls -la secrets/

# Should show:
# -rw-r--r-- ... google-code-credentials.json
# -rw-r--r-- ... google-openclaw-credentials.json
```

---

## Step 10: Test Connection

```bash
# Install dependencies
npm install

# Run sync test
node scripts/sync-from-sheets.js

# Expected output:
# ℹ️  [timestamp] Starting sync from Google Sheets...
# ℹ️  [timestamp] Initializing Google Sheets connector...
# ℹ️  [timestamp] Authenticating with Google Sheets API...
# ℹ️  [timestamp] Detecting sheet schema...
# ℹ️  [timestamp] Confirming field mapping...
# ℹ️  [timestamp] Reading prospects from Google Sheet...
# ✅ [timestamp] Synced 0 prospects
# ✅ [timestamp] SYNC COMPLETE
```

---

## Troubleshooting

### "Credentials file not found"

```
Error: Credentials file not found: ./secrets/google-code-credentials.json
```

**Fix:** Download JSON credentials from Google Cloud Console and place in `secrets/` directory.

---

### "The caller does not have permission"

```
Error: The caller does not have permission to access resource
```

**Fix:**
1. Verify service account email is spelled correctly
2. Check service account has access to Sheet (shared)
3. Verify permissions (Viewer for Claude Code, Editor for OpenClaw)

---

### "Invalid Sheets ID"

```
Error: Invalid Sheets ID
```

**Fix:**
1. Copy Sheet ID from URL (between `/d/` and `/edit`)
2. Update `config.sheets.js` with correct ID
3. Verify Sheet is accessible to service account

---

### "Sheet 'Prospects' not found"

```
Error: Sheet "Prospects" not found
```

**Fix:**
1. Check actual sheet tab name (case-sensitive)
2. Update `config.sheets.js` to match
3. Ensure sheet tabs are named exactly:
   - `Prospects` (main data)
   - `Templates` (email templates)
   - `OptOuts` (opt-out list)

---

## Verification Checklist

- [ ] Google Cloud Project created: "V.Two SDR"
- [ ] Google Sheets API enabled
- [ ] Google Drive API enabled
- [ ] Service account created: `claude-code-sdr`
- [ ] Service account created: `openclaw-sdr`
- [ ] JSON credentials downloaded for both accounts
- [ ] Credentials stored in `secrets/` (gitignored)
- [ ] Google Sheet created or prepared
- [ ] Sheet ID noted and added to config
- [ ] Service accounts shared on Sheet with correct permissions
- [ ] Sheet tabs named correctly: Prospects, Templates, OptOuts
- [ ] Headers added to Prospects tab
- [ ] Test sync runs without errors

---

## Security Notes

### Best Practices

1. **Credentials are sensitive** — Never commit to git
   - ✅ Added to `.gitignore`
   - ✅ Only store locally in `secrets/` folder

2. **Use environment variables for production**
   ```bash
   export GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
   export GOOGLE_SHEETS_ID=your-sheet-id
   ```

3. **Rotate service account keys periodically**
   - Generate new JSON credentials
   - Update in `secrets/`
   - Delete old keys from Google Cloud Console

4. **Minimal permissions principle**
   - Claude Code: Viewer (read-only) ✅
   - OpenClaw: Editor (read/write) ✅
   - Never use Owner/Admin access

5. **Audit service account access**
   - In Google Cloud Console, go to **Service Accounts**
   - Click service account
   - Check **"Activity"** tab for API calls

---

## Next: Configure SDR System

Once credentials are set up:

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm test

# 3. Sync prospects from sheet
node scripts/sync-from-sheets.js --validate

# 4. Verify prospects.json was created
cat prospects.json
```

---

**Duration:** ~20 minutes | **Difficulty:** Easy (mostly clicking) | **Support:** Check troubleshooting section above

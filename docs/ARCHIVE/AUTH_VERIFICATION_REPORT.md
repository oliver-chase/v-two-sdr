# SDR System Authentication & API Key Verification Report

**Date:** 2026-03-16
**Repository:** saturdaythings/v-two-sdr
**Status:** ⚠️ CREDENTIALS NOT VERIFIED IN LOCAL ENVIRONMENT

---

## Executive Summary

The SDR system's authentication setup has **three critical components**:

1. **Outlook/Microsoft 365 Email** (SMTP & IMAP) — Configured for simple password auth
2. **Google Sheets API** (Read-only) — Configured for API key auth
3. **Azure OAuth** (Mentioned in spec but NOT implemented in current code)

**Current Status:**
- ✅ Code is ready (all 338 tests passing)
- ❌ GitHub Secrets: Cannot verify without authenticated gh CLI
- ❌ Local environment: No secrets set locally
- ⚠️ Azure OAuth: Partially documented, not required for Phase 2

---

## 1. Outlook / Microsoft 365 Email Configuration

### Current Setup
- **Authentication Method:** Simple username + password (SMTP & IMAP)
- **SMTP Server:** smtp.office365.com:587 (STARTTLS)
- **IMAP Server:** outlook.office365.com:993 (TLS)
- **Sender Email:** oliver@vtwo.co
- **Environment Variables Required:**
  - `OUTLOOK_USER` (email address)
  - `OUTLOOK_PASSWORD` (account password or App Password)

### Code Configuration
**File:** `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/config.email.js`
```javascript
smtp: {
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  requireTLS: true,
  user: process.env.OUTLOOK_USER,
  pass: process.env.OUTLOOK_PASSWORD
}
```

### What the User Reported
> "Azure OAuth: Client secret set up (expires 3/2/2028) — set OUTLOOK_PASSWORD to the Secret ID value in GitHub Secrets"

**INTERPRETATION:** User stored an Azure app **client secret** as the OUTLOOK_PASSWORD, NOT a standard Outlook password or App Password.

### Issue: This Won't Work for SMTP/IMAP

**Why:** Outlook SMTP/IMAP use **basic authentication** (username + password). They don't accept Azure OAuth tokens or client secrets.

**For SMTP/IMAP to work with an Azure-registered app**, you need:
1. **OAuth token flow** (requires client_id, client_secret, tenant_id, token endpoint)
2. **Libraries:** `msal-node` + `@microsoft/microsoft-graph-client` (not currently in package.json)
3. **Token refresh logic** (not implemented)

### Current Code Only Supports
- ✅ Simple Outlook App Password (if MFA is enabled)
- ✅ Outlook account password (if MFA is disabled)
- ❌ Azure OAuth tokens

### Recommendation
**Clarify with user:** Do they want to:

**Option A (Simpler):** Use Outlook App Password
- Go to https://account.microsoft.com/account/manage-my-microsoft-account
- Create an App Password (16 characters)
- Set `OUTLOOK_PASSWORD` to this value
- No Azure OAuth needed; existing code works

**Option B (Recommended for enterprise):** Use Azure OAuth
- Will require code changes (add OAuth token refresh)
- Need: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
- Will require libraries: `msal-node` + OAuth flow implementation

---

## 2. Google Sheets API Configuration

### Current Setup
- **Authentication Method:** API Key (read-only, no service account)
- **Endpoint:** https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}?key={API_KEY}
- **Sheet Name:** "V.Two SDR - Master Lead Repository"
- **Tab Name:** "Leads"
- **Required Share Permission:** "Anyone with the link can view"

### Code Configuration
**File:** `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/config.sheets.js`
```javascript
google_sheets: {
  sheet_id: process.env.GOOGLE_SHEET_ID || '',
  api_key: process.env.GOOGLE_API_KEY || '',
  sheet_name: process.env.GOOGLE_SHEET_NAME || 'Leads'
}
```

**File:** `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/sheets-connector.js`
```javascript
async authenticate(apiKey) {
  const key = apiKey || this.apiKey;
  this.doc = new GoogleSpreadsheet(this.sheetId, { apiKey: key });
  await this.doc.loadInfo();
  this.authenticated = true;
}
```

### What the User Reported
> "Google Sheets: User claims GOOGLE_API_KEY and GOOGLE_SHEET_ID are set in GitHub Secrets but cannot see them in the edit UI (empty box)"

**INTERPRETATION:** Secrets exist in GitHub (because user set them) but the web UI doesn't show the value (expected—GitHub hides secret values for security).

### Test Results
Local test (no secrets in environment):
```
✗ GOOGLE_SHEET_ID: MISSING
✗ GOOGLE_API_KEY: MISSING
⚠ Google API: Skipping test (credentials missing)
```

### How to Verify
1. **Confirm they exist:** Only GitHub repo owner can see secret names (not values)
   ```bash
   gh secret list --repo saturdaythings/v-two-sdr
   ```
   (Requires `gh auth login` with GitHub API token)

2. **Test locally:** Copy from GitHub Secrets to local `.env`
   ```bash
   # In GitHub UI: saturdaythings/v-two-sdr → Settings → Secrets and variables → Actions
   # Copy GOOGLE_API_KEY and GOOGLE_SHEET_ID values

   cp .env.example .env
   # Paste values into .env
   node scripts/sync-from-sheets.js  # Will verify API works
   ```

3. **Expected Success Response:**
   ```
   ✓ Google Sheets API: WORKS (sheet: "V.Two SDR - Master Lead Repository", 3 tabs)
   ```

---

## 3. Azure OAuth Setup

### What the Documentation Says
**File:** `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/SYSTEM_SPEC.md`
```
Azure admin must complete:
1. Register "V.Two SDR Agent" app in Azure
2. Grant permissions: Mail.Send, Mail.Read, Mail.ReadWrite
3. Create client secret
4. Note: TENANT_ID, CLIENT_ID, CLIENT_SECRET
5. Store in `secrets/.env` before OpenClaw starts email execution
```

### Current Code Status
- ❌ NOT implemented in Phase 2
- ❌ No Azure OAuth configuration in config files
- ❌ No MSAL token refresh logic
- ❌ No Microsoft Graph API integration
- ✅ Planned for Phase 3 (future enhancement)

### Why This Doesn't Match Current Implementation
The spec documents a future enterprise authentication setup, but **Phase 2 is using simple SMTP/IMAP** which doesn't require Azure OAuth.

### If Azure OAuth is Needed
User must provide:
1. **Azure Tenant ID** — From Azure portal → Azure Active Directory → Properties
2. **Azure Client ID** — From Azure portal → App Registrations → Your App
3. **Azure Client Secret** — From Azure portal → Certificates & Secrets

**Currently stored value:** User said they set `OUTLOOK_PASSWORD` to "the Secret ID value" (unclear if this is Client Secret or something else).

---

## 4. LLM Drafting (OpenRouter Fallback Chain)

### Current Setup
- **Tier 1:** Anthropic Claude (currently unfunded—skipped)
- **Tier 2:** OpenRouter Paid (**effective Tier 1**)
- **Tier 3:** OpenRouter Free (fallback)
- **Tier 4:** Static templates (last resort)

### Environment Variables
- `ANTHROPIC_API_KEY` — Optional (skipped if not set or no funds)
- `OPENROUTER_API_KEY` — Required for Tier 2
- `OPENROUTER_FREE_KEY` — Optional (Tier 3)

### Code Configuration
**File:** `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/scripts/draft-emails.js`
Implements 3-tier fallback with automatic provider selection.

### Status
- ✅ OPENROUTER_API_KEY reported set in GitHub Secrets
- ✅ OPENROUTER_FREE_KEY reported set in GitHub Secrets
- ❌ Cannot verify without authenticated gh CLI

---

## 5. Verification Checklist

### What Exists in GitHub Secrets (Per Task Description)
- [x] `OUTLOOK_PASSWORD` — Set (but contains Azure client secret, not standard password)
- [?] `GOOGLE_API_KEY` — Reported set, but UI shows empty (expected)
- [?] `GOOGLE_SHEET_ID` — Reported set, but UI shows empty (expected)
- [?] `ANTHROPIC_API_KEY` — Account currently has no funds
- [x] `OPENROUTER_API_KEY` — Set (effective Tier 1 for LLM drafting)
- [x] `OPENROUTER_FREE_KEY` — Set (Tier 3 fallback)

### What Cannot Be Verified Without gh CLI
Cannot authenticate to GitHub API to programmatically check:
- Exact secret values
- Whether secrets are actually non-empty
- Secret creation dates

**Workaround:** Check https://github.com/saturdaythings/v-two-sdr/settings/secrets/actions directly in browser (requires login).

---

## 6. Summary & Recommendations

### Critical Issues (Block First Run)

| Issue | Severity | Action |
|-------|----------|--------|
| `OUTLOOK_PASSWORD` contains Azure client secret, not account password | **CRITICAL** | Clarify: Is it an App Password or OAuth token? If OAuth, code changes needed. |
| `GOOGLE_API_KEY` & `GOOGLE_SHEET_ID` unverified | **HIGH** | Test locally: `node scripts/sync-from-sheets.js` |
| No local `.env` file (credentials not in environment) | **HIGH** | Copy secrets from GitHub UI to local `.env` |

### What Works ✅
- All 338 unit tests passing
- Code architecture ready for Phase 2
- Google Sheets API integration code is correct
- Outlook SMTP/IMAP code is correct
- Email drafting pipeline functional
- Approval CLI ready
- GitHub Actions workflow configured

### What Needs Verification ⚠️
1. **Azure OAuth vs. Outlook App Password?**
   - User said: "set OUTLOOK_PASSWORD to the Secret ID value in GitHub Secrets"
   - This suggests: Azure client secret, NOT standard password
   - **Action:** Ask user: "Is OUTLOOK_PASSWORD an Azure app secret or an Outlook App Password?"

2. **Google Sheets credentials actually work?**
   - Secrets reported set but unconfirmed
   - **Action:** Run local test: `node scripts/sync-from-sheets.js`

3. **LLM drafting keys valid?**
   - OpenRouter keys reported set but untested
   - **Action:** Run drafting pipeline: `node scripts/draft-emails.js`

---

## 7. Next Steps for User

### Step 1: Clarify Authentication Method
**Ask:** What type of credential is stored in `OUTLOOK_PASSWORD`?
- [ ] Outlook App Password (16-char, from account.microsoft.com)
- [ ] Azure OAuth client secret (from Azure portal)
- [ ] Plain Outlook account password

**Outcome:** Determines whether code changes are needed.

### Step 2: Retrieve Secrets from GitHub (If Not Already Done)
1. Go to: https://github.com/saturdaythings/v-two-sdr/settings/secrets/actions
2. For each secret (GOOGLE_API_KEY, GOOGLE_SHEET_ID, OUTLOOK_PASSWORD, etc.):
   - Click the secret name
   - Note the first few characters (verify it's not a placeholder)
3. Copy all secret values locally

### Step 3: Create Local .env
```bash
cd /Users/oliver/OliverRepo/workspaces/work/projects/SDR
cp .env.example .env
# Edit .env with actual values from GitHub Secrets
```

### Step 4: Test Each Component
```bash
# Test Google Sheets connectivity
node scripts/sync-from-sheets.js

# Test Outlook SMTP
npm run send:dry

# Test LLM drafting
node scripts/draft-emails.js --prospects prospects.json
```

### Step 5: If Azure OAuth Required
- [ ] Create or obtain: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
- [ ] File GitHub issue for Phase 3 OAuth implementation
- [ ] For Phase 2, use standard Outlook App Password instead

---

## 8. Files Reviewed

**Configuration:**
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/config.email.js`
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/config.sheets.js`
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/.env.example`

**Implementation:**
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/scripts/mailer.js` (SMTP)
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/scripts/inbox-monitor.js` (IMAP)
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/sheets-connector.js` (Sheets API)
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/scripts/draft-emails.js` (LLM)

**Documentation:**
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/PROGRESS.md`
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/CHECKPOINT.md`
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/ARCHITECTURE.md`
- `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/SYSTEM_SPEC.md`

---

**Report Generated:** 2026-03-16 | **Status:** AWAITING USER CLARIFICATION ON AUTHENTICATION METHOD

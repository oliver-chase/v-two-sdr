# IMAP OAuth Question: Can Basic Auth Stay?

**TL;DR:** Maybe for now, but not recommended long-term. Decision depends on Azure tenant configuration.

---

## Current IMAP Setup

**File:** `scripts/inbox-monitor.js`
**Library:** `imapflow` (Node.js IMAP client)
**Authentication:** Basic auth (username + password)
**Server:** `outlook.office365.com:993` (Outlook IMAP)

```javascript
const client = new ImapFlow({
  host: 'outlook.office365.com',
  port: 993,
  auth: {
    user: process.env.OUTLOOK_USER,           // oliver@vtwo.co
    pass: process.env.OUTLOOK_PASSWORD        // app password or MFA password
  }
});
```

---

## The Question

**Will `imapflow` basic auth continue to work with Outlook after OAuth migration?**

**Answer:** It depends on your Azure tenant configuration.

---

## Three Azure Scenarios

### Scenario 1: Security Defaults ENABLED (Most Likely)

**What it is:**
- Microsoft 365 default setting for new tenants
- Forces MFA on all user accounts
- Blocks legacy authentication protocols (IMAP, SMTP, POP3)

**Check in Azure:**
```
Azure Portal
  → Azure Active Directory
  → Properties
  → Manage security defaults
```

**If ENABLED:**
- IMAP basic auth with OUTLOOK_PASSWORD → **Will FAIL** ❌
- Error: `[AUTHENTICATIONFAILED] Authentication failed.`
- **Solution:** Must use Microsoft Graph API for IMAP

**If DISABLED:**
- IMAP basic auth with OUTLOOK_PASSWORD → **May work** ⚠️
- But violates security best practices
- **Solution:** Upgrade to Graph API anyway

---

### Scenario 2: Security Defaults DISABLED + MFA Enforced on Account

**What it is:**
- Legacy Azure AD configuration
- Security defaults turned off
- But MFA is enabled on the specific user account (oliver@vtwo.co)

**Check in Azure:**
```
Azure Portal
  → Azure Active Directory
  → Users
  → oliver@vtwo.co
  → Authentication methods
```

**If ANY MFA method is registered (phone, authenticator, FIDO2):**
- IMAP basic auth with OUTLOOK_PASSWORD → **Will FAIL** ❌
- Error: `[AUTHENTICATIONFAILED] Authentication failed.`
- **Solution:** Must use Microsoft Graph API for IMAP

---

### Scenario 3: Security Defaults DISABLED + No MFA

**What it is:**
- Very permissive Azure configuration
- Legacy authentication protocols allowed
- Only typical in dev/test tenants

**If NO MFA methods registered:**
- IMAP basic auth with OUTLOOK_PASSWORD → **May work** ✓
- But Azure can change policy at any time
- **Solution:** Plan migration to Graph API for future

---

## Decision Matrix

| Configuration | IMAP Basic Auth | Status | Action |
|---|---|---|---|
| Security Defaults: **ON** | BLOCKED | ❌ Will fail | Migrate to Graph API now |
| Security Defaults: **OFF** + MFA on account | BLOCKED | ❌ Will fail | Migrate to Graph API now |
| Security Defaults: **OFF** + No MFA | MAYBE | ⚠️ May work | Keep for now, plan migration |

---

## Quick Check: Does Your Account Have MFA?

Open Microsoft 365 login page:
```
https://account.microsoft.com/account
→ Sign in as oliver@vtwo.co
→ Look for "Security" section
→ Check if any of these are listed:
  - Authenticator app
  - Phone number for SMS/call
  - Security key (FIDO2)
  - Windows Hello
```

**If YES:** IMAP basic auth is blocked. Must migrate to Graph API.
**If NO:** IMAP basic auth may work, but plan migration anyway.

---

## IMAP via Microsoft Graph API (Alternative)

If you must migrate IMAP to OAuth, here's what it looks like:

### Current IMAP Flow
```javascript
// inbox-monitor.js (current)
const client = new ImapFlow({
  host: 'outlook.office365.com',
  port: 993,
  auth: { user: OUTLOOK_USER, pass: OUTLOOK_PASSWORD }
});

await client.connect();
const uids = await client.search({ subject: 'Re:' });
// ... process messages ...
```

### Graph API Flow (Future)
```javascript
// graph-inbox-monitor.js (future)
const oauth = new OAuthClient(tenantId, clientId, clientSecret);
const token = await oauth.getAccessToken();

const response = await axios.get(
  'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages',
  {
    headers: { Authorization: `Bearer ${token}` },
    params: { $filter: "subject:contains('Re:')" }
  }
);

const messages = response.data.value;
// ... process messages ...
```

**Key Differences:**
| Aspect | IMAP | Graph API |
|--------|------|-----------|
| Auth | Basic (username + password) | OAuth (token) |
| Connection | Persistent socket | REST API (HTTP) |
| Subject search | IMAP SEARCH command | OData `$filter` |
| Message fetch | IMAP FETCH | Graph GET |
| Effort to migrate | 3-4 hours | 3-4 hours |

---

## Recommendation by Phase

### Phase 2-3: Email Sending (Current)
**Status:** Migrate sending to OAuth
**Decision on IMAP:** Defer until Phase 4

**Approach (Option A: Dual Support):**
```env
# New: Use OAuth for sending
OUTLOOK_TENANT_ID=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...

# Keep: Use basic auth for IMAP (fallback)
OUTLOOK_USER=oliver@vtwo.co
OUTLOOK_PASSWORD=...
```

**Logic:**
- Send emails via Graph API (OAuth)
- Read inbox via IMAP (basic auth) — if it still works
- If IMAP fails, it's a clear signal to migrate

**Test:** Run `npm run inbox` after Phase 2-3 deployment
- If IMAP fails → Migrate to Graph API immediately
- If IMAP works → Plan migration for Phase 4

---

### Phase 4: Full Graph API Migration (Future)
**Status:** Migrate inbox monitoring to Graph API
**Decision on IMAP:** Remove completely

**Approach (Option B: Full OAuth):**
```env
# All OAuth
OUTLOOK_TENANT_ID=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...

# Remove legacy
# OUTLOOK_PASSWORD is no longer needed
```

**New script:** `scripts/graph-inbox-monitor.js`
- Fetch messages via Graph API `/me/mailFolders/inbox/messages`
- Use OAuth token (same as email sending)
- Same classification logic as current IMAP version

---

## Azure Configuration Check (Step-by-Step)

### Step 1: Verify Security Defaults Status

```
1. Open Azure Portal: https://portal.azure.com
2. Search: "Azure Active Directory"
3. Left menu: "Properties"
4. Scroll to bottom: "Manage security defaults"
5. See toggle switch:
   ✓ Enabled → IMAP basic auth is BLOCKED
   ✗ Disabled → Continue to Step 2
```

### Step 2: Check Account MFA

```
1. Azure Portal → Azure Active Directory
2. Left menu: "Users"
3. Search: "oliver@vtwo.co"
4. Click user
5. Left menu: "Authentication methods"
6. See registered methods:
   - Authenticator app?
   - Phone?
   - Security key?

   If YES to any → IMAP basic auth is BLOCKED
   If NO → IMAP basic auth may work (but upgrade anyway)
```

### Step 3: Test IMAP Connection

```bash
cd /Users/oliver/OliverRepo/workspaces/work/projects/SDR

# Add to .env temporarily
OUTLOOK_USER=oliver@vtwo.co
OUTLOOK_PASSWORD=<your-actual-password>

# Run inbox monitor
node scripts/inbox-monitor.js

# Check output:
# Success: prints checked messages
# Failure: "[AUTHENTICATIONFAILED] Authentication failed."
```

**Result:**
- Success → IMAP basic auth still works (for now)
- Failure → IMAP basic auth blocked → Plan Graph API migration

---

## Summary Table: IMAP Decision

| Step | Check | Result | Action |
|------|-------|--------|--------|
| 1 | Security Defaults ON? | YES | Migrate IMAP to Graph now |
| 1 | Security Defaults ON? | NO | Go to Step 2 |
| 2 | MFA on oliver@vtwo.co? | YES | Migrate IMAP to Graph now |
| 2 | MFA on oliver@vtwo.co? | NO | Go to Step 3 |
| 3 | Run test: `npm run inbox` | Fails | Migrate IMAP to Graph now |
| 3 | Run test: `npm run inbox` | Works | Keep basic auth for now, plan Phase 4 migration |

---

## Migration Timeline Recommendation

### Phase 2-3 (NOW): Email Sending
- Implement OAuth for email sending (mailer.js)
- Keep IMAP basic auth as fallback
- **GitHub Secrets:** Add `OUTLOOK_TENANT_ID`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`
- **Effort:** 2 hours implementation + testing

### Phase 3 (End of Phase): IMAP Test
- Run `npm run inbox` after Phase 2-3 deployment
- If works → Continue to Phase 4
- If fails → Do emergency Graph API migration

### Phase 4 (Next Quarter): Full Graph API
- Migrate IMAP to Graph API (if needed)
- Remove OUTLOOK_PASSWORD from GitHub Secrets
- **GitHub Secrets:** Remove `OUTLOOK_PASSWORD`
- **Effort:** 3-4 hours implementation + testing

---

## Code Diff: If IMAP Fails and You Need Emergency Fix

**What fails:**
```javascript
// scripts/inbox-monitor.js line 185-192
const client = new ImapFlow({
  host: 'outlook.office365.com',
  port: 993,
  auth: {
    user: outlookUser,
    pass: outlookPass  // ← This fails with "Authentication failed"
  }
});
```

**Error output:**
```
[IMAP] AUTH FAILED
Error: Authentication failed
```

**Emergency solution:** Switch to Graph API (3-4 hour effort)

---

## Final Answer: Can Basic Auth Stay?

**Short Answer:**
- **Probably not for long** — Azure is phasing it out
- **Maybe for now** — Depends on your tenant configuration
- **Plan to migrate anyway** — Phase 4 is a good timeline

**Recommended Action (Phase 2-3):**
```
✓ Implement OAuth for email sending (mailer.js)
✓ Test IMAP basic auth (run npm run inbox)
✓ If IMAP works: Keep it for now, document need for Phase 4 migration
✓ If IMAP fails: Begin emergency Graph API migration
```

**Bottom Line:** Do the OAuth migration for email sending now. IMAP can wait, but test it immediately after to confirm it still works.

---

**Next Steps:**
1. Check your Azure configuration (see Step-by-Step above)
2. Report findings
3. Decide: Option A (Dual Support) or Option B (Full OAuth)
4. Proceed with Phase 2-3 email sending OAuth implementation

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


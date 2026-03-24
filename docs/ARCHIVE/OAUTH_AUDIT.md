# Microsoft Graph OAuth Audit & Migration Plan

**Date:** 2026-03-17
**Current State:** SMTP-based email sending (outdated, basic auth)
**Target State:** Microsoft Graph API (OAuth 2.0, client credentials flow)
**Status:** Design + Audit Only (No Implementation)

---

## Executive Summary

The SDR system currently sends emails via Outlook SMTP (`smtp.office365.com:587`) with basic username/password authentication. This approach is becoming deprecated and lacks the flexibility of modern OAuth-based solutions. This audit documents the OAuth flow required to migrate to Microsoft Graph API endpoint (`POST /v1.0/users/oliver@vtwo.co/sendMail`) while maintaining IMAP for inbox monitoring.

**Key Finding:** Azure app credentials are already provisioned in user environment but not yet integrated into the codebase. Migration path is clear and well-defined.

---

## 1. OAuth Flow Overview

### Endpoint Target
```
POST https://graph.microsoft.com/v1.0/users/oliver@vtwo.co/sendMail
Authorization: Bearer {access_token}
```

### Token Acquisition (Client Credentials Flow)
**Flow Type:** OAuth 2.0 Client Credentials Grant (no user interaction required)

```
Request to: https://login.microsoftonline.com/{OUTLOOK_TENANT_ID}/oauth2/v2.0/token

Parameters:
  - grant_type: client_credentials
  - client_id: {OUTLOOK_CLIENT_ID}
  - client_secret: {OUTLOOK_CLIENT_SECRET}
  - scope: https://graph.microsoft.com/.default

Response:
  {
    "access_token": "eyJ0eXAiOiJKV1QiLC...",
    "expires_in": 3599,
    "token_type": "Bearer"
  }
```

### Token Lifecycle
- **Lifetime:** 3599 seconds (60 minutes)
- **Caching:** Essential for performance (minimize token requests)
- **Refresh Strategy:** Store expiry timestamp, request new token when expired
- **Error Handling:** 401 responses trigger immediate token refresh + retry

### Required Scopes
| Scope | Purpose | Current Use |
|-------|---------|------------|
| `Mail.Send` | Send emails via Graph API | New — **REQUIRED** for sending |
| `Mail.Read` | Read inbox messages | Future — for Graph-based IMAP replacement |
| `offline_access` | Refresh tokens | Not applicable to client credentials |

**Current Scope Config:**
```
scope: "https://graph.microsoft.com/.default"
```
This requests all scopes granted to the app registration in Azure. For minimal privilege, specify only `Mail.Send`:
```
scope: "https://graph.microsoft.com/Mail.Send"
```

---

## 2. config.oauth.js Interface (Pseudocode)

### Purpose
Centralized OAuth token management with caching and auto-refresh. **Not to be implemented—design reference only.**

### Class: OAuthClient

```javascript
/**
 * OAuthClient — Manages Microsoft Graph OAuth token lifecycle
 *
 * Constructor:
 *   new OAuthClient(tenantId, clientId, clientSecret, scope)
 *
 * Public Methods:
 *   async getAccessToken() → { token, expiresAt }
 *   async sendMailViaGraph(mailOptions) → { ok, messageId?, error? }
 *   async verify() → boolean
 */

class OAuthClient {
  constructor(config) {
    // config: { tenantId, clientId, clientSecret, scope?, logger? }
    this.config = config;

    // Token cache
    this._cache = {
      token: null,
      expiresAt: 0
    };
  }

  /**
   * Get cached token or request new one if expired
   * @returns {Promise<string>} Access token
   * @throws {Error} If token request fails
   */
  async getAccessToken() {
    // Pseudocode
    // 1. Check if cached token is valid (not expired)
    // 2. If valid, return it immediately
    // 3. If expired, POST to https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
    // 4. Parse response, cache token + expiresAt
    // 5. Return token
    // 6. Error cases: invalid credentials, network timeout, JSON parse error
  }

  /**
   * Send email via Microsoft Graph API
   * Automatically refreshes token if expired
   * @param {Object} mailOptions
   * @param {string} mailOptions.from - Sender address (e.g., oliver@vtwo.co)
   * @param {string} mailOptions.to - Recipient address
   * @param {string} mailOptions.subject - Email subject
   * @param {string} mailOptions.body - Email body (plain text or HTML)
   * @param {string} mailOptions.bcc - BCC address (optional)
   * @returns {Promise<{ok: boolean, messageId?: string, error?: string}>}
   */
  async sendMailViaGraph(mailOptions) {
    // Pseudocode
    // 1. Get access token (auto-refresh if needed)
    // 2. Build Graph API request body (see format below)
    // 3. POST to /v1.0/users/oliver@vtwo.co/sendMail
    // 4. On 401: refresh token, retry once
    // 5. On success: return { ok: true, messageId: response.id }
    // 6. On failure: return { ok: false, error: errorMessage }
  }

  /**
   * Verify OAuth credentials and Graph API connectivity
   * @returns {Promise<boolean>}
   */
  async verify() {
    // Pseudocode
    // 1. Attempt token request
    // 2. Attempt GET to /v1.0/me (minimal Graph API call)
    // 3. Return true if both succeed
  }
}

/**
 * Graph API Send Mail Request Format
 *
 * Request body must conform to Microsoft Graph email schema:
 * https://learn.microsoft.com/en-us/graph/api/user-sendmail
 */
const graphMailRequestFormat = {
  "message": {
    "subject": "string",
    "body": {
      "contentType": "text/plain",  // or "text/html"
      "content": "string"
    },
    "toRecipients": [
      {
        "emailAddress": {
          "address": "recipient@example.com"
        }
      }
    ],
    "bccRecipients": [
      {
        "emailAddress": {
          "address": "bcc@example.com"
        }
      }
    ],
    "replyTo": [
      {
        "emailAddress": {
          "address": "oliver@vtwo.co"
        }
      }
    ]
  },
  "saveToSentItems": true  // Automatically save sent email to Sent Items folder
};
```

### Integration Point: Replace Mailer Class

Current mailer.js (`scripts/mailer.js`) uses:
```javascript
const nodemailer = require('nodemailer');
this.transporter = nodemailer.createTransport({ ... SMTP ... });
```

New mailer.js would use:
```javascript
const { OAuthClient } = require('../config.oauth');
this.oauth = new OAuthClient(process.env.OUTLOOK_TENANT_ID, ...);
```

**Note:** The mailer.js class structure remains largely the same—only the underlying send mechanism changes from `transporter.sendMail()` to `oauth.sendMailViaGraph()`.

---

## 3. .env Requirements Update

### Current .env.example (Lines 1-70)

**Currently Configured:**
```
OUTLOOK_USER=oliver@vtwo.co
OUTLOOK_PASSWORD=your-outlook-password-here
```

**Status:** Deprecated. Basic SMTP auth, not suitable for long-term production use.

### Additions Required for OAuth

```bash
# =========================================================================
# Microsoft Graph OAuth (NEW — replaces SMTP basic auth)
# =========================================================================

# Azure Tenant ID (Directory ID)
# Find in: Azure Portal → Azure AD → Properties → Tenant ID
OUTLOOK_TENANT_ID=your-tenant-id-here

# Azure App Registration: Client ID
# Find in: Azure Portal → App registrations → {app-name} → Application ID
OUTLOOK_CLIENT_ID=your-client-id-here

# Azure App Registration: Client Secret (value, NOT the ID)
# Find in: Azure Portal → App registrations → {app-name} → Certificates & secrets
# WARNING: Generate a new secret, store securely, never commit to git
OUTLOOK_CLIENT_SECRET=your-client-secret-here

# OAuth Scope (optional — defaults to .default = all scopes granted to app)
# Recommended: https://graph.microsoft.com/Mail.Send (minimal privilege)
# Current: https://graph.microsoft.com/.default (all granted scopes)
OUTLOOK_OAUTH_SCOPE=https://graph.microsoft.com/Mail.Send
```

### Decision: OUTLOOK_USER & OUTLOOK_PASSWORD — Keep or Remove?

**Three Options:**

#### Option A: Dual Support (Recommended for Rollover)
Keep both sets of credentials for 1-2 sprint cycles:
- Use OAuth for email **sending** (mailer.js)
- Use SMTP basic auth for IMAP (inbox-monitor.js) if Graph API not ready
- Allows gradual migration without breaking existing flows

```bash
# Legacy SMTP auth (keep for IMAP until Graph-based alternative available)
OUTLOOK_USER=oliver@vtwo.co
OUTLOOK_PASSWORD=your-outlook-password-here

# New OAuth auth (for email sending)
OUTLOOK_TENANT_ID=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

**Pros:** Minimal disruption, allows parallel testing
**Cons:** Increases secret count, maintenance burden

#### Option B: Full OAuth Migration
Remove SMTP credentials entirely, migrate IMAP to Microsoft Graph `/v1.0/me/mailFolders/inbox/messages`:
- All authentication via OAuth (tenant ID, client ID, secret)
- Cleaner security model, no plaintext passwords
- Requires full rewrite of inbox-monitor.js

```bash
# OAuth only (no SMTP credentials)
OUTLOOK_TENANT_ID=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

**Pros:** Modern, secure, single auth mechanism
**Cons:** Requires IMAP → Graph migration (higher effort)

#### Option C: Keep SMTP as Fallback
Remove OAuth entirely, stay with SMTP basic auth:
- No Azure app setup needed
- Keeps current codebase unchanged
- Ignores Microsoft's deprecation warnings

```bash
# Current config (no changes)
OUTLOOK_USER=oliver@vtwo.co
OUTLOOK_PASSWORD=...
```

**Pros:** Zero code changes
**Cons:** Violates Azure best practices, eventually unsupported

**RECOMMENDATION:** **Option A (Dual Support)** for Phase 2-3, migrate to **Option B (Full OAuth)** in Phase 4.

### IMAP Decision: Can It Stay Basic Auth?

**Current IMAP Usage:** `inbox-monitor.js` connects via ImapFlow library (`imapflow`) with Outlook basic auth

**Question:** Does Azure restrict IMAP to OAuth-only authentication?

**Answer:**
- **Azure Security Default (MFA Enforced):** If M365 tenant has security defaults enabled + MFA on the account, SMTP/IMAP basic auth is **blocked** by Azure
- **Legacy Auth (No MFA):** If MFA is disabled, SMTP/IMAP basic auth may still work but is **not recommended**
- **Microsoft's Position:** Deprecating basic auth, recommending OAuth 2.0

**Microsoft Graph IMAP Alternative:**
```
GET https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=receivedDateTime gt {date}
Authorization: Bearer {access_token}
```

**Verdict:**
- If Outlook account **has MFA enabled** → IMAP basic auth **will fail**, must use Graph API
- If Outlook account **has no MFA** → IMAP basic auth **may work** but could fail at any time per Azure policy changes

**Safe Approach:** Migrate IMAP to Graph API when OAuth is implemented (Option B above).

---

## 4. GitHub Secrets List (Updated)

### Current Secrets (Existing)
| Secret | Value Type | Used By | Status |
|--------|-----------|---------|--------|
| `OUTLOOK_PASSWORD` | String | mailer.js, inbox-monitor.js | SMTP basic auth |
| `GOOGLE_API_KEY` | API key | sync-from-sheets.js | Sheets read access |
| `GOOGLE_SHEET_ID` | String | sync-from-sheets.js | Sheet identifier |
| `ANTHROPIC_API_KEY` | String | draft-emails.js | LLM Tier 2 |
| `OPENROUTER_API_KEY` | String | draft-emails.js | LLM Tier 1 |
| `OPENROUTER_FREE_KEY` | String | draft-emails.js | LLM Tier 3 fallback |

**Total:** 6 secrets configured in GitHub

### New Secrets (Required for OAuth)

| Secret | Value Type | Source | Lifecycle | Used By |
|--------|-----------|--------|-----------|---------|
| `OUTLOOK_TENANT_ID` | UUID (36 chars) | Azure AD → Properties → Tenant ID | Static, set once | mailer.js (OAuth) |
| `OUTLOOK_CLIENT_ID` | UUID (36 chars) | Azure App Reg → Application ID | Static, set once | mailer.js (OAuth) |
| `OUTLOOK_CLIENT_SECRET` | JWT-like string (100+ chars) | Azure App Reg → Certificates & Secrets | Must rotate annually | mailer.js (OAuth) |

**Decision Pending:** Keep `OUTLOOK_PASSWORD` for IMAP fallback?

### Updated GitHub Secrets (Option A: Dual Support)

```
# Legacy (keep for IMAP fallback during migration)
OUTLOOK_PASSWORD                    # Basic auth password

# New (OAuth for email sending)
OUTLOOK_TENANT_ID                   # Azure tenant
OUTLOOK_CLIENT_ID                   # Azure app client ID
OUTLOOK_CLIENT_SECRET               # Azure app secret (rotate annually)

# Existing (unchanged)
GOOGLE_API_KEY                      # Sheets API key
GOOGLE_SHEET_ID                     # Sheet ID
ANTHROPIC_API_KEY                   # LLM Tier 2
OPENROUTER_API_KEY                  # LLM Tier 1
OPENROUTER_FREE_KEY                 # LLM Tier 3

Total: 9 secrets (was 6, +3 new)
```

### Updated GitHub Secrets (Option B: Full OAuth)

```
# New (OAuth for all Microsoft services)
OUTLOOK_TENANT_ID                   # Azure tenant
OUTLOOK_CLIENT_ID                   # Azure app client ID
OUTLOOK_CLIENT_SECRET               # Azure app secret

# Existing (unchanged)
GOOGLE_API_KEY
GOOGLE_SHEET_ID
ANTHROPIC_API_KEY
OPENROUTER_API_KEY
OPENROUTER_FREE_KEY

Total: 8 secrets (was 6, +3 new, -1 removed)
```

### Secret Rotation & Security Notes

| Secret | Rotation Frequency | Owner | Notes |
|--------|-------------------|-------|-------|
| `OUTLOOK_CLIENT_SECRET` | 365 days | Azure admin | Can be rotated without service impact (use new secret immediately) |
| `OUTLOOK_TENANT_ID` | Never | Azure admin | Immutable tenant identifier |
| `OUTLOOK_CLIENT_ID` | Never | Azure admin | Immutable app registration identifier |
| `GOOGLE_API_KEY` | 90-365 days | Google Cloud admin | Can be rotated; regenerate new key, update secret, revoke old key |
| `ANTHROPIC_API_KEY` | 365 days | Anthropic account | Can be rotated via console.anthropic.com |
| `OPENROUTER_API_KEY` | On demand | OpenRouter account | Can be revoked and regenerated |

---

## 5. IMAP Authentication Decision Matrix

| Scenario | IMAP Auth | Status | Action |
|----------|-----------|--------|--------|
| **MFA Enabled on oliver@vtwo.co** | Basic SMTP/IMAP will fail | Blocked by Azure | Migrate to Graph API (`/v1.0/me/mailFolders/inbox`) |
| **No MFA, Legacy Auth Enabled** | Basic SMTP/IMAP may work | At risk | Migrate to Graph API before policy changes |
| **Full OAuth (Option B)** | Graph API (no basic auth) | Recommended | Implement Graph-based inbox monitor |

### Verification: Check Current Azure Configuration

To determine which scenario applies:

1. **Log into Azure Portal** → Azure Active Directory → Properties
   - Note the **Tenant ID** (you'll need this for OAuth anyway)

2. **Check Security Defaults** → Azure AD → Properties → Manage security defaults
   - If **enabled** → MFA is enforced → basic auth is **blocked**
   - If **disabled** → basic auth may work (but not recommended)

3. **Check authentication methods** → Azure AD → Users → oliver@vtwo.co → Authentication methods
   - See what methods are registered (phone, authenticator app, etc.)
   - If **any MFA method exists** → basic auth is **blocked**

**User Action Required:** Verify status and decide on Option A, B, or C.

---

## 6. Dependency Analysis

### Current Dependencies (package.json)

| Package | Version | Purpose | OAuth Compatible |
|---------|---------|---------|------------------|
| `nodemailer` | ^8.0.2 | Email transport (SMTP) | Can work with custom transport (would need wrapper) |
| `imapflow` | ^1.2.13 | IMAP client | Supports basic auth only; Graph API would need new package |
| `axios` | ^1.6.0 | HTTP client | Good fit for Graph API calls |
| `dotenv` | ^17.3.1 | Environment loading | Already in use |
| `googleapis` | ^118.0.0 | Google Sheets client | Unrelated to OAuth migration |
| `google-spreadsheet` | ^4.1.1 | Google Sheets wrapper | Unrelated to OAuth migration |

### New Dependencies (Recommended for OAuth)

**Option 1: Use Built-in Node.js + axios (Minimal)**
```javascript
// No new dependencies required
// Use axios (already installed) for token + Graph API calls
// Trade-off: Manual token caching + error handling
```

**Option 2: Use @microsoft/msal-node (Microsoft-Provided)**
```javascript
// npm install @microsoft/msal-node
// Pros: Official Microsoft library, handles token caching, refresh logic
// Cons: Adds dependency, slightly heavier weight
// Recommended for: Long-term production use
```

**Option 3: Use microsoft-graph-client (SDK)**
```javascript
// npm install @microsoft/microsoft-graph-client
// Pros: Full Graph API coverage, official Microsoft
// Cons: Heavier weight, more features than needed for send-only
// Recommended for: Future expansion (IMAP replacement)
```

**RECOMMENDATION:** Start with **Option 1 (axios only)** for sending, migrate to **Option 2 (msal-node)** when IMAP replacement is planned.

---

## 7. Implementation Checklist (Phase 2-3)

**Not to be implemented now—reference for future developer.**

### Pre-Implementation (User Action)

- [ ] **Verify Azure Setup:**
  - [ ] Confirm `OUTLOOK_TENANT_ID` is recorded
  - [ ] Confirm `OUTLOOK_CLIENT_ID` is recorded
  - [ ] Confirm `OUTLOOK_CLIENT_SECRET` is generated and stored securely
  - [ ] Verify app registration has `Mail.Send` scope granted
  - [ ] Test token request manually with curl/Postman

- [ ] **Decide on Migration Strategy:**
  - [ ] Option A (Dual Support) — Keep SMTP + add OAuth
  - [ ] Option B (Full OAuth) — IMAP → Graph API, all OAuth
  - [ ] Option C (Stay on SMTP) — No action

- [ ] **Check Azure Tenant Configuration:**
  - [ ] Security defaults enabled/disabled?
  - [ ] MFA enforced on oliver@vtwo.co?
  - [ ] Basic auth policies?

### Code Implementation (Developer)

- [ ] Create `config.oauth.js` with `OAuthClient` class
- [ ] Implement `getAccessToken()` with caching + refresh
- [ ] Implement `sendMailViaGraph()` with Graph API format
- [ ] Update `scripts/mailer.js` to use OAuthClient instead of nodemailer
- [ ] Update `.env.example` with new OAuth variables
- [ ] Add `OUTLOOK_TENANT_ID`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET` to GitHub Secrets
- [ ] Add unit tests for token caching (expiry, refresh, 401 retry)
- [ ] Add integration test with real Graph API (or mock)

### IMAP Migration (Optional, Phase 4)

- [ ] Create `graph-inbox-monitor.js` using Graph API `/me/mailFolders/inbox/messages`
- [ ] Migrate reply classification logic
- [ ] Update `.env.example` to remove `OUTLOOK_PASSWORD`
- [ ] Remove `OUTLOOK_PASSWORD` from GitHub Secrets
- [ ] Archive `scripts/inbox-monitor.js`

### Testing & Validation

- [ ] Test token acquisition (manual curl request)
- [ ] Test email send via Graph API
- [ ] Test token refresh (wait 60+ minutes, send again)
- [ ] Test 401 error handling (invalid token scenario)
- [ ] Test daily-run.js flow with OAuth
- [ ] Test GitHub Actions workflow with new secrets

---

## 8. Security Considerations

### Threat Model: OAuth Secret Exposure

| Threat | Impact | Mitigation |
|--------|--------|-----------|
| `OUTLOOK_CLIENT_SECRET` leaked in code | Attacker can send emails as the app | Never hardcode; always use environment variables |
| `OUTLOOK_CLIENT_SECRET` exposed in logs | Attacker sees secret in GitHub Actions output | Never log secrets; use `setSecret()` in GitHub Actions |
| `OUTLOOK_CLIENT_SECRET` exposed in Git history | Attacker clones repo, extracts secret | Rotate secret immediately if leaked; use pre-commit hooks to block secrets |
| Token cached in memory and swapped to disk | Attacker reads swapped memory | Token cache is in-process only (RAM); not persisted to disk |
| Token intercepted in transit | Attacker reads Bearer token from network | Always use HTTPS (Graph API enforces); no fallback to HTTP |

### Best Practices

1. **Secret Rotation:** Rotate `OUTLOOK_CLIENT_SECRET` annually (or sooner if suspected compromise)
2. **Minimal Scope:** Use `Mail.Send` scope only, not `.default` scope
3. **Audit Logging:** Log email sends (what, to whom, when) but never log tokens
4. **Token Caching:** Cache in-memory only; never persist to disk or logs
5. **Error Messages:** Return generic errors to users; log detailed errors server-side only

---

## 9. Token Exchange Walkthrough (Example)

### Step 1: Request Access Token

**Request:**
```bash
curl -X POST \
  "https://login.microsoftonline.com/{OUTLOOK_TENANT_ID}/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id={OUTLOOK_CLIENT_ID}" \
  -d "client_secret={OUTLOOK_CLIENT_SECRET}" \
  -d "scope=https://graph.microsoft.com/Mail.Send"
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik...",
  "expires_in": 3599,
  "token_type": "Bearer"
}
```

### Step 2: Send Email via Graph API

**Request:**
```bash
curl -X POST \
  "https://graph.microsoft.com/v1.0/users/oliver@vtwo.co/sendMail" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "subject": "Hello from Graph API",
      "body": {
        "contentType": "text/plain",
        "content": "This email was sent via Microsoft Graph API."
      },
      "toRecipients": [
        {
          "emailAddress": {
            "address": "prospect@example.com"
          }
        }
      ],
      "bccRecipients": [
        {
          "emailAddress": {
            "address": "oliver@vtwo.co"
          }
        }
      ]
    },
    "saveToSentItems": true
  }'
```

**Success Response (202 Accepted):**
```json
{}
```

**Error Response (401 Unauthorized - Token Expired):**
```json
{
  "error": {
    "code": "Authorization_RequestDenied",
    "message": "Insufficient privileges to complete the operation."
  }
}
```

**Action:** Request new token (Step 1), retry (Step 2)

---

## 10. Recommended Reading

| Resource | Link | Purpose |
|----------|------|---------|
| Microsoft Graph sendMail docs | https://learn.microsoft.com/en-us/graph/api/user-sendmail | API spec |
| OAuth 2.0 Client Credentials | https://learn.microsoft.com/en-us/graph/auth-v2-service | Auth flow |
| Azure App Registration | https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app | Setup guide |
| IMAP replacement | https://learn.microsoft.com/en-us/graph/api/user-list-messages | Graph API alternative |

---

## 11. Summary: Next Steps

### Phase 2-3 (Current)
1. **Decision:** Communicate choice of Option A (Dual Support), B (Full OAuth), or C (Status Quo)
2. **Azure Verification:** Check tenant MFA/security settings (see Section 5)
3. **Setup:** Record tenant ID, client ID, secret (securely)

### Phase 3-4 (Future)
1. **Implement:** Create `config.oauth.js` with token caching
2. **Migrate:** Update mailer.js to use Graph API
3. **Test:** Verify email send flow end-to-end
4. **Deploy:** Add OAuth secrets to GitHub, retire SMTP credentials (if Option B)

### Phase 4+ (Optional)
1. **IMAP Migration:** Replace inbox-monitor.js with Graph API equivalent
2. **Cleanup:** Remove OUTLOOK_PASSWORD from all systems

---

## Appendix A: Why OAuth Over SMTP?

| Criterion | SMTP Basic Auth | OAuth 2.0 |
|-----------|-----------------|----------|
| **Security** | Plain text password over TLS | Token-based, no password exchange |
| **Deprecation** | Microsoft retiring in 2025 | Microsoft's official recommendation |
| **Scope Limitation** | No granular permissions | Mail.Send, Mail.Read, etc. |
| **Token Lifetime** | N/A (password valid forever) | 1 hour (automatic refresh) |
| **Audit Trail** | Limited (no token tracking) | Full audit in Microsoft Defender |
| **MFA Compatible** | Blocked if MFA enabled | Works with MFA |

---

**Document Status:** Design & Audit Only — No Code Changes Made
**Next Review:** After user decision on migration strategy (Option A/B/C)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


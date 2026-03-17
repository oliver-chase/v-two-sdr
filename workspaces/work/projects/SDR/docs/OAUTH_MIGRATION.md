# Azure OAuth Migration for Email Sending

**Status:** Implementation complete, awaiting Azure credential verification

## Overview

Migrated from SMTP (nodemailer) to Microsoft Graph API with OAuth 2.0 client credentials flow. This change:

- Eliminates password storage risk (OAuth tokens instead of OUTLOOK_PASSWORD)
- Enables token caching and automatic refresh
- Provides better error handling and retry logic
- Aligns with Microsoft 365 best practices

## Files Created

### 1. `config/config.oauth.js`
- Azure OAuth endpoint configuration
- Microsoft Graph API settings
- Token cache path and TTL (1 hour)

**Key env vars:**
```
OUTLOOK_TENANT_ID         # Azure Entra tenant ID
OUTLOOK_CLIENT_ID         # App registration client ID
OUTLOOK_CLIENT_SECRET     # App registration secret
```

### 2. `scripts/oauth-client.js`
- `OAuthClient` class for token management
- `getAccessToken()` — fetch new or use cached token
- `fetchNewToken()` — exchange credentials via Azure OAuth endpoint
- `sendMailViaGraph()` — send email via Graph API
- `sendMailWithRetry()` — automatic 401 retry with token refresh

**Features:**
- Token caching to file (`./outreach/oauth-token.json`)
- TTL validation (1 hour)
- Auto-refresh on 401 Unauthorized
- Timeout handling (15s)

## Files Modified

### 1. `scripts/mailer.js`
**Changes:**
- Removed: `const nodemailer = require('nodemailer')`
- Added: `const { OAuthClient } = require('./oauth-client')`
- Removed: SMTP transporter initialization (lines 85-102)
- Updated: `connect()` method to initialize OAuthClient
- Updated: `verify()` method to test OAuth token
- Updated: `send()` method to use `oauthClient.sendMailWithRetry()`
- Added: OAuth config parameter to constructor

**Before:**
```javascript
constructor(config) {
  this.config = config;
  this.transporter = null;
}
```

**After:**
```javascript
constructor(config, oauthConfig) {
  this.config = config;
  this.oauthConfig = oauthConfig;
  this.oauthClient = null;
}
```

### 2. `config/config.email.js`
**Changes:**
- Removed: `smtp` config block (SMTP host/port/auth)
- Removed: Reference to OUTLOOK_USER/OUTLOOK_PASSWORD
- Kept: `sender`, `limits`, `paths` (unchanged)

**Removed:**
```javascript
smtp: {
  host: 'smtp.office365.com',
  port: 587,
  user: process.env.OUTLOOK_USER,
  pass: process.env.OUTLOOK_PASSWORD
}
```

### 3. `scripts/send-approved.js`
**Changes:**
- Added: `const oauthConfig = require('../config/config.oauth');`
- Updated: `new Mailer(config, oauthConfig)` (added second param)

## Implementation Details

### Token Caching & Refresh

```javascript
// Cache location: ./outreach/oauth-token.json
{
  "accessToken": "eyJhbGc...",
  "expiresAt": 1710768123456,  // Unix timestamp
  "cachedAt": "2026-03-17T10:09:00.000Z"
}
```

**Flow:**
1. Call `getAccessToken()`
2. Check cache, if valid and not expired, return cached token
3. If expired or missing, call `fetchNewToken()`
4. Exchange credentials with Azure via OAuth2 endpoint
5. Save token + expiry to cache file
6. Return access token

### 401 Error Handling

```javascript
async sendMailWithRetry(opts) {
  const result = await this.sendMailViaGraph(opts);
  
  // If 401 Unauthorized, clear cache and retry once
  if (result.retry) {
    this.cachedToken = null;
    this.tokenExpiry = null;
    return this.sendMailViaGraph(opts);  // Retry with fresh token
  }
  
  return result;
}
```

### Graph API Request

```
POST https://graph.microsoft.com/v1.0/users/oliver@vtwo.co/sendMail
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "message": {
    "subject": "...",
    "body": "...",
    "bodyType": "text",
    "toRecipients": [...],
    "bccRecipients": [...]
  },
  "saveToSentItems": true
}
```

## Environment Variables

**Required:**
```bash
OUTLOOK_TENANT_ID              # Azure AD tenant ID
OUTLOOK_CLIENT_ID              # App registration client ID
OUTLOOK_CLIENT_SECRET          # App registration secret
SENDER_NAME                    # Display name (default: 'Oliver Chase')
BCC_EMAIL                      # BCC for record-keeping
```

**Unchanged:**
```bash
MAX_DAILY_SENDS                # Daily send limit (default: 15)
SEND_DELAY_MS                  # Delay between sends (default: 30000ms)
GOOGLE_SHEET_ID
GOOGLE_API_KEY
ANTHROPIC_API_KEY
OPENROUTER_API_KEY
OPENROUTER_FREE_KEY
```

**Removed (no longer needed):**
```bash
OUTLOOK_USER              # SMTP username (removed)
OUTLOOK_PASSWORD          # SMTP password (removed)
```

## GitHub Actions Update

**Before:**
```yaml
env:
  OUTLOOK_USER: oliver@vtwo.co
  OUTLOOK_PASSWORD: ${{ secrets.OUTLOOK_PASSWORD }}
```

**After:**
```yaml
env:
  OUTLOOK_TENANT_ID: ${{ secrets.OUTLOOK_TENANT_ID }}
  OUTLOOK_CLIENT_ID: ${{ secrets.OUTLOOK_CLIENT_ID }}
  OUTLOOK_CLIENT_SECRET: ${{ secrets.OUTLOOK_CLIENT_SECRET }}
  SENDER_NAME: 'Oliver Chase'
  BCC_EMAIL: oliver@vtwo.co
```

## Testing Checklist

- [ ] Verify Azure app registration exists
- [ ] Verify client secret is valid
- [ ] Set OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET in `.env`
- [ ] Run: `node scripts/send-approved.js --dry-run`
- [ ] Run: `npm test` (should pass)
- [ ] Test with real prospect in `outreach/approved-sends.json`
- [ ] Check `outreach/sends.json` for successful send
- [ ] Verify `outreach/oauth-token.json` cached correctly
- [ ] Check GitHub Secrets are updated
- [ ] Manual trigger GitHub Actions workflow

## Troubleshooting

**Error: "Azure OAuth credentials incomplete"**
- Set OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET

**Error: "Unauthorized (401) - token may be stale"**
- This should trigger auto-refresh and retry (one attempt)
- If persists, verify client secret is correct

**No token cache file created**
- Check write permissions on `./outreach/` directory
- Ensure directory exists: `mkdir -p outreach`

**Graph API returns 400/403**
- Verify app registration has "Mail.Send" permission
- Check if running as service principal (may need additional perms)

## Rollback Plan

If issues arise, can revert to SMTP by:
1. Restore from git: `git checkout config/config.email.js scripts/mailer.js`
2. Set OUTLOOK_USER, OUTLOOK_PASSWORD in GitHub Secrets
3. Update GitHub Actions workflow
4. Push changes

## Additional Resources

- [Azure OAuth 2.0](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow)
- [Microsoft Graph Mail API](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
- [App Registration Setup](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)

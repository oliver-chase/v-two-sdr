# OAuth 2.0 Conversion: Quick Reference

## Current State vs. Target State

```
CURRENT (SMTP Basic Auth)          TARGET (OAuth 2.0)
─────────────────────────          ──────────────────

User/Password                       Tenant ID
   ↓                                   ↓
SMTP Connection                     OAuth Token Request
   ↓                                   ↓
smtp.office365.com:587              login.microsoftonline.com
   ↓                                   ↓
Send via nodemailer                 Send via Graph API
   ↓                                   ↓
✉️ Email sent                         ✉️ Email sent
```

---

## Environment Variables: Before & After

### BEFORE (Current)
```env
OUTLOOK_USER=oliver@vtwo.co
OUTLOOK_PASSWORD=your-app-password
BCC_EMAIL=oliver+sdr@vtwo.co
SENDER_NAME=Oliver Chase
MAX_DAILY_SENDS=15
SEND_DELAY_MS=30000
```

### AFTER (OAuth)
```env
# New (OAuth)
OUTLOOK_TENANT_ID=12345678-1234-1234-1234-123456789012
OUTLOOK_CLIENT_ID=87654321-4321-4321-4321-210987654321
OUTLOOK_CLIENT_SECRET=abc123xyz789~abc123xyz789-abc123xyz789

# Keep for IMAP (Option A: Dual Support)
OUTLOOK_PASSWORD=...  # or remove if migrating to Graph API

# Existing (unchanged)
BCC_EMAIL=oliver+sdr@vtwo.co
SENDER_NAME=Oliver Chase
MAX_DAILY_SENDS=15
SEND_DELAY_MS=30000
```

---

## Code Changes: mailer.js

### BEFORE (nodemailer + SMTP)
```javascript
const nodemailer = require('nodemailer');

class Mailer {
  connect() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASSWORD
      }
    });
  }

  async send({ prospect, subject, body }) {
    await this.transporter.sendMail({
      from: `"${this.config.sender.name}" <${this.config.sender.email}>`,
      to: prospect.em,
      bcc: this.config.sender.bcc,
      subject,
      text: body
    });
  }
}
```

### AFTER (OAuth + Graph API)
```javascript
const { OAuthClient } = require('../config.oauth');

class Mailer {
  constructor(config) {
    this.config = config;
    this.oauth = new OAuthClient(
      process.env.OUTLOOK_TENANT_ID,
      process.env.OUTLOOK_CLIENT_ID,
      process.env.OUTLOOK_CLIENT_SECRET
    );
  }

  async send({ prospect, subject, body }) {
    await this.oauth.sendMailViaGraph({
      from: this.config.sender.email,
      to: prospect.em,
      subject,
      body,
      bcc: this.config.sender.bcc
    });
  }
}
```

---

## OAuth Token Flow (Simplified)

```
┌─────────────────────────────────────────────────┐
│ 1. Need to send email                           │
│    getAccessToken() called                       │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 2. Check token cache                            │
│    Is cached token still valid? (not expired)   │
└─────────────────────────────────────────────────┘
        ↙               ↘
      YES               NO
      ↓                 ↓
   Return         Request new token
   cached         (POST to OAuth endpoint)
   token               ↓
      ↓           Parse response
      ↓           Cache token + expiry
      ↓                ↓
      └────────→ Use token in Graph API call
                       ↓
                 Send email successfully
                 Return messageId
```

---

## GitHub Secrets: Add These Three

| Secret | Example Format | Where to Get |
|--------|---|---|
| `OUTLOOK_TENANT_ID` | `12345678-1234-1234-1234-123456789012` | Azure AD → Properties → Tenant ID |
| `OUTLOOK_CLIENT_ID` | `87654321-4321-4321-4321-210987654321` | Azure App Reg → Application ID |
| `OUTLOOK_CLIENT_SECRET` | `abc123xyz789~abc123xyz789-abc123xyz789` | Azure App Reg → Certificates & Secrets → Value (NOT ID) |

**WARNING:** Copy the `VALUE` column, not the `ID` column, for the client secret!

---

## Decision Tree: IMAP (Inbox Monitor)

```
Does your Outlook account have MFA enabled?
│
├─ YES (or Security Defaults enabled in Azure)
│  └─ IMAP basic auth is BLOCKED
│     └─ Must use Microsoft Graph API: /v1.0/me/mailFolders/inbox
│        └─ Requires full rewrite of inbox-monitor.js
│           └─ Future migration (Phase 4)
│
└─ NO (MFA disabled, legacy auth allowed)
   └─ IMAP basic auth may still work
      └─ Use Option A: Keep OUTLOOK_PASSWORD for IMAP fallback
         └─ Plan migration to Graph API for future
```

**Check your Azure settings:**
```
Azure Portal → Azure AD → Properties → Manage security defaults
  ├─ Enabled → Use Option A (Dual Support)
  └─ Disabled → Use Option A (Dual Support) [safer]
```

---

## Migration Options Summary

| Option | Sending | IMAP | Work | Recommended For |
|--------|---------|------|------|-----------------|
| **A: Dual Support** | OAuth (Graph) | SMTP basic auth | 2 hours | **Now (Phase 2-3)** |
| **B: Full OAuth** | OAuth (Graph) | OAuth (Graph) | 4 hours | Phase 4+ |
| **C: Stay SMTP** | SMTP basic auth | SMTP basic auth | 0 hours | Not recommended |

---

## Test: Manual Token Request

To verify your Azure credentials work, use curl:

```bash
curl -X POST \
  "https://login.microsoftonline.com/{OUTLOOK_TENANT_ID}/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id={OUTLOOK_CLIENT_ID}" \
  -d "client_secret={OUTLOOK_CLIENT_SECRET}" \
  -d "scope=https://graph.microsoft.com/Mail.Send"
```

**Expected Response (success):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expires_in": 3599,
  "token_type": "Bearer"
}
```

**Expected Response (failure):**
```json
{
  "error": "invalid_client",
  "error_description": "AADSTS700016: Application with identifier '{client_id}' was not found in the directory..."
}
```

---

## Migration Checklist (Phase 2-3)

### Before Code: User Action
- [ ] Get Azure tenant ID
- [ ] Get Azure client ID
- [ ] Get Azure client secret (generate if needed)
- [ ] Test token request manually (curl above)
- [ ] Verify app has `Mail.Send` scope granted
- [ ] Decide: Option A or B?

### Implementation: Developer
- [ ] Create `config.oauth.js`
- [ ] Update `scripts/mailer.js` to use OAuthClient
- [ ] Update `.env.example`
- [ ] Add 3 new GitHub Secrets
- [ ] Test email send end-to-end
- [ ] Update daily-run.js to use new mailer

### Testing
- [ ] Dry run: `npm run send:dry`
- [ ] Real send: `npm run send`
- [ ] Verify email arrives + messageId logged
- [ ] Test 401 token refresh scenario

---

## Graph API Send Mail Format

```json
{
  "message": {
    "subject": "Email Subject",
    "body": {
      "contentType": "text/plain",
      "content": "Email body text..."
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
          "address": "oliver@vtwo.co"
        }
      }
    ]
  },
  "saveToSentItems": true
}
```

---

## Useful Links

- **Audit Details:** See `OAUTH_AUDIT.md` (full documentation)
- **Graph API Spec:** https://learn.microsoft.com/en-us/graph/api/user-sendmail
- **OAuth 2.0 Explained:** https://learn.microsoft.com/en-us/graph/auth-v2-service
- **Azure App Setup:** https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app

---

**Status:** Design Only — No Code Implemented Yet
**Next Step:** Gather Azure credentials, decide on Option A/B, then implement

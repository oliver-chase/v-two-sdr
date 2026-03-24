# Secrets — Setup Guide

This directory is gitignored. Place credentials here, never commit them.

## Required Files

### 1. `.env` (email + API keys)
```bash
cp ../.env.example ../.env
# Fill in real values in ../.env
```

### 2. `google-credentials.json` (Google Sheets access)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable **Google Sheets API** + **Google Drive API**
3. IAM & Admin → Service Accounts → Create service account
4. Keys tab → Add Key → JSON → Download
5. Rename to `google-credentials.json`, place here
6. Share your Google Sheet with the service account email (Editor access)

---

## Gmail App Password Setup

1. Enable 2FA on your Gmail account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select app: Mail | device: Other ("SDR System")
4. Copy the 16-char password → `GMAIL_APP_PASSWORD` in `.env`

---

## Files Expected Here

| File | Purpose |
|------|---------|
| `google-credentials.json` | Google Sheets service account OAuth |

Everything else goes in `../.env`.

---

**Never commit this directory. It is protected by .gitignore.**

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


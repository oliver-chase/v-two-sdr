# V.Two SDR

Automated B2B cold outreach system. GitHub Actions orchestrates the full pipeline Mon-Fri. Oliver approves or rejects each draft via email before anything sends.

**Status:** Production-ready. 386/386 tests passing.

---

## How It Works

```
Google Sheet (Leads)
    ↓ daily-sync.yml (7:00 AM ET)
prospects.json
    ↓ daily-draft.yml (7:30 AM ET)
outreach/drafts/YYYY-MM-DD.json
    ↓ approval-email.yml → Oliver approves via email
    ↓ send-approved.yml (on approval + 10 AM ET cron)
Sent via Outlook (oliver@vtwo.co)
    ↓ inbox-check.yml (9 AM + 3 PM ET)
Replies classified, Sheet updated
```

## Quick Start (Local)

```bash
npm install
cp .env.example .env       # fill in credentials
node -r dotenv/config scripts/sync.js
```

See `RUNBOOK.md` for full operational guide.

## Key Scripts

| Script | Purpose |
|--------|---------|
| `scripts/sync.js` | Pull Sheet, merge state, run scheduler, write prospects.json |
| `scripts/draft.js` | Batch LLM call → outreach/drafts/YYYY-MM-DD.json |
| `scripts/approval-email.js` | Send digest email with approve/reject curl commands |
| `scripts/handle-approval.js` | Process approve/reject, trigger send |
| `scripts/send.js` | Send all approved drafts via Outlook |
| `scripts/inbox.js` | IMAP scan, classify replies, update Sheet state |

## GitHub Actions Workflows

| Workflow | Schedule |
|----------|----------|
| `daily-sync.yml` | 7:00 AM ET Mon-Fri |
| `daily-draft.yml` | 7:30 AM ET Mon-Fri |
| `approval-handler.yml` | Triggered by curl from approval email |
| `send-approved.yml` | On approval + 10 AM ET cron |
| `inbox-check.yml` | 9:00 AM + 3:00 PM ET Mon-Fri |
| `weekly-prospect.yml` | Weekly prospect refresh |
| `weekly-digest.yml` | Weekly performance digest |

## Stack

- **Runtime:** Node.js
- **Email send:** Microsoft Graph API + OAuth 2.0 (oliver@vtwo.co)
- **Email receive:** Outlook IMAP (outlook.office365.com:993)
- **Prospects:** Google Sheets — "V.Two SDR - Master Lead Repository" / "Leads" tab
- **LLM:** Anthropic Claude Haiku (draft generation, falls back to static templates)
- **Approval gate:** Cloudflare Worker (`cloudflare/approval-worker.js`)
- **Orchestration:** GitHub Actions (no AI agents in the pipeline)
- **Tests:** Jest, 386/386 passing

## Docs

| File | Contents |
|------|----------|
| `REDESIGN.md` | Architecture decisions and why (source of truth) |
| `RUNBOOK.md` | Day-to-day operations, first-time setup |
| `docs/GOOGLE_CLOUD_SETUP.md` | Google Cloud + service account setup |
| `docs/SHEETS_CONNECTOR.md` | Sheets API reference |
| `docs/OAUTH_MIGRATION.md` | Azure OAuth setup for Microsoft Graph |
| `docs/ABSTRACT_API_INTEGRATION.md` | Timezone API integration |

## Prospect Format (TOON)

Abbreviated field names reduce token cost in LLM calls.

```json
{
  "id": "p-000001",
  "fn": "First",     "ln": "Last",
  "em": "email@co",  "co": "Company",  "ti": "Title",
  "lo": "City, ST",  "tz": "America/New_York",
  "tr": "ai-enablement",
  "st": "new",       "ad": "2026-03-11"
}
```

**Tracks:** `ai-enablement` | `product-maker` | `pace-car`

**Status flow:** `new` → `draft_generated` → `awaiting_approval` → `email_sent` → `replied` → `closed_positive/negative`

## Secrets

All credentials are in GitHub Secrets (12 total). For local dev, copy `.env.example` to `.env`.
`secrets/google-credentials.json` is a setup template — fill in real values, never commit.

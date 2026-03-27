# SDR System Runbook

**Repo:** saturdaythings/v-two-sdr
**Updated:** 2026-03-27

---

## First-Time Setup

Everything needed to go from zero to running.

### Prerequisites

- Cloudflare account (free tier at cloudflare.com)
- GitHub account with access to saturdaythings/v-two-sdr
- Google Cloud project with Sheets API enabled
- Azure app registration for oliver@vtwo.co (Microsoft Graph / Outlook OAuth)
- Hunter.io account (free tier)
- Abstract API account (free tier at abstractapi.com)
- Anthropic API account (console.anthropic.com)

---

### Step 1 — Google Sheet setup

1. Create a Google Sheet named exactly: **V.Two SDR - Master Lead Repository**
2. Rename the first tab to: **Leads**
3. Add these column headers in this exact order in row 1:

```
Name | Title | Company | Domain | Email | City | State | Country | Timezone | Company Size | Annual Revenue | Industry | Source | Status | Date Added | Next Contact Date | First Contact Date | Second Contact Date | Third Contact Date | Fourth Contact Date | Fifth Contact Date | Notes
```

4. Share the sheet with the service account email (`GOOGLE_SERVICE_ACCOUNT_EMAIL` value) — grant **Editor** access.

The system reads and writes this sheet. Column headers must match exactly — the field mapping in `config.sheets.js` is keyed on these header strings.

---

### Step 2 — Deploy Cloudflare Worker

The Worker receives Approve/Reject clicks from the daily email and triggers GitHub Actions.

```bash
# Copy the cloudflare/ folder to your Mac if needed
scp -r oliver@192.168.64.2:~/OliverRepo/workspaces/work/projects/SDR/cloudflare ~/Downloads/cloudflare-worker

cd ~/Downloads/cloudflare-worker
npx wrangler login
npx wrangler deploy
```

Note the deployed URL — it will look like:
`https://sdr-approval.kianamicari1.workers.dev`

**In the Cloudflare dashboard** → Workers & Pages → sdr-approval → Settings → Variables and Secrets:

Add these as **Secret** type (not plain text):

| Variable | Value |
|---|---|
| `SDR_TOKEN` | Any random string — you choose (e.g. `openssl rand -hex 32`) |
| `GITHUB_PAT` | GitHub PAT — see below |
| `GITHUB_REPO` | `saturdaythings/v-two-sdr` |

**To create the GitHub PAT:**
1. Go to github.com/settings/personal-access-tokens/new
2. Choose **Fine-grained token**
3. Repository access → Only select repositories → **v-two-sdr**
4. Permissions → Repository permissions → **Actions: Read and write**
5. Generate token — copy it immediately (shown once only)

---

### Step 3 — GitHub Secrets

Go to **github.com/saturdaythings/v-two-sdr → Settings → Secrets and variables → Actions → New repository secret** and add all 13:

| Secret | What It Is | Where to Get It |
|---|---|---|
| `ABSTRACT_API_KEY` | Timezone lookup API key | abstractapi.com → My Account → API Key |
| `ANTHROPIC_API_KEY` | Claude API key (Haiku for drafting, Sonnet for prospecting) | console.anthropic.com → API Keys |
| `GOOGLE_API_KEY` | Google API key for Sheets | console.cloud.google.com → APIs & Services → Credentials → API Key |
| `GOOGLE_PRIVATE_KEY` | Service account private key (full PEM, multiline) | Service account JSON file → `private_key` field |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | Service account JSON file → `client_email` field |
| `GOOGLE_SHEET_ID` | ID of the Leads sheet | From the Sheet URL: `…/spreadsheets/d/`**`THIS_PART`**`/edit` |
| `HUNTER_IO_API_KEY` | Hunter.io email verification key | hunter.io → API → copy key |
| `OUTLOOK_CLIENT_ID` | Azure app registration client ID | Azure portal → App registrations → your app → Application (client) ID |
| `OUTLOOK_CLIENT_SECRET` | Azure app registration client secret | Azure portal → App registrations → your app → Certificates & secrets |
| `OUTLOOK_TENANT_ID` | Azure Entra ID tenant ID | Azure portal → App registrations → your app → Directory (tenant) ID |
| `OUTLOOK_PASSWORD` | oliver@vtwo.co account password | Microsoft 365 account password (used for IMAP inbox scanning) |
| `SDR_TOKEN` | Shared approval token | Same value you set in the Cloudflare Worker |
| `WORKER_URL` | Deployed Cloudflare Worker URL | URL noted after `npx wrangler deploy` (e.g. `https://sdr-approval.kianamicari1.workers.dev`) |

**Note on `GOOGLE_PRIVATE_KEY`:** The value is a multiline PEM string. Paste it exactly as it appears in the JSON file including the `-----BEGIN PRIVATE KEY-----` header and `-----END PRIVATE KEY-----` footer. GitHub stores it safely. When loading locally, always use `node -r dotenv/config scripts/<script>.js` — never `source .env` (the newlines break shell parsing).

---

### Step 4 — Review email templates

1. Open `outreach/templates.md` in the repo
2. Review all 5 templates: A (product-maker touch 1), B (ai-enablement touch 1), C (pace-car touch 1), D (follow-up touch 2), E (follow-up touch 3)
3. Edit any template wording to match your voice before going live

---

### Step 5 — First run test

Run these in order, verifying each step before the next:

1. **GitHub Actions → `daily-sync.yml` → Run workflow** — should complete green; check that `prospects.json` was committed
2. Add a test prospect to the Leads sheet (Name, Title, Company, Email, Status = `email_discovered`)
3. **Trigger `daily-draft.yml`** — an approval email should arrive at oliver@vtwo.co within ~2 minutes with clickable **Approve** and **Reject** buttons
4. **Click Approve** on the test draft — `send-approved.yml` should trigger; verify the email was sent from oliver@vtwo.co
5. **Trigger `inbox-check.yml`** — should complete green
6. Check the Leads sheet — Status column should reflect the send

If the approval email doesn't arrive after step 3, check Actions → `daily-draft.yml` → logs for errors before assuming a delivery problem.

---

### Ongoing: redeploying the Cloudflare Worker

If the Worker code changes and needs redeploying:

```bash
scp -r oliver@192.168.64.2:~/OliverRepo/workspaces/work/projects/SDR/cloudflare ~/Downloads/cloudflare-worker
cd ~/Downloads/cloudflare-worker
npx wrangler deploy
```

The Worker URL stays the same after redeploy. Secrets set in the dashboard are not affected.

---

## System Overview

GitHub Actions runs a deterministic daily pipeline Mon–Fri. No AI agent orchestrates anything — Claude Haiku does exactly one job (write email drafts). Everything else is scheduled Node scripts.

```
7:00 AM ET  daily-sync.yml    → sync.js           Pull Sheet, flag follow-ups
7:30 AM ET  daily-draft.yml   → draft.js           Generate drafts (one Haiku call)
                              → approval-email.js  Email digest to oliver@vtwo.co
On click    approval-handler  → handle-approval.js Move to approved/ or reject
            (triggers)        → send.js            Send via Outlook
9 AM/3 PM   inbox-check.yml   → inbox.js           Scan IMAP, classify, update state
Sun 8 PM ET weekly-prospect   → prospect.js        Generate 25 new prospects via Sonnet
Fri 5 PM ET weekly-digest     → digest.js          Weekly stats email to oliver@vtwo.co
```

Git is the audit trail. Every step commits its output — `sync: prospects updated`, `drafts: generated`, `sent: approved emails dispatched`, `inbox: replies classified`.

---

## Daily Experience

You wake up to an email from Oliver SDR Bot at ~7:35 AM with subject:
**`[SDR] N drafts ready for approval — Mar 27`**

The email lists each draft with prospect details and two buttons per draft:

- **Approve** — click to send the email. `send-approved.yml` triggers within seconds.
- **Reject** — click to discard the draft. Prospect resets to pre-draft status.

No terminal required. Click and done.

If no email arrives: either no prospects were eligible today, or a workflow failed (check the Actions tab).

---

## Adding Prospects

All prospect management is in Google Sheets. Add a row to the **"Leads"** tab of **"V.Two SDR - Master Lead Repository"**.

**Required columns:** Name, Title, Company, Email
**Useful columns:** Domain, City, State, Timezone, Industry, Source, Notes

Leave Status blank — the system sets it to `new` on first sync. Once an email is found/confirmed, the system sets `email_discovered` and the prospect enters the draft queue the next morning.

**Tracks** (determines which initial template):
- `product-maker` → Template A
- `ai-enablement` → Template B
- `pace-car` → Template C

The sync runs at 7:00 AM ET. Prospects added before that appear in the same day's draft run.

---

## Secrets Reference

All secrets live in **GitHub → saturdaythings/v-two-sdr → Settings → Secrets and variables → Actions** and in your local `.env` for manual runs.

| Secret | Used By | What It Is |
|---|---|---|
| `ABSTRACT_API_KEY` | enrichment-engine.js | Timezone lookup |
| `ANTHROPIC_API_KEY` | draft.js, prospect.js | Claude API key (Haiku for drafting, Sonnet for prospecting) |
| `GOOGLE_API_KEY` | sheets-connector.js | Google API key for Sheets access |
| `GOOGLE_PRIVATE_KEY` | all Sheet scripts | PEM private key (multiline) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | all Sheet scripts | Service account email |
| `GOOGLE_SHEET_ID` | sync.js, draft.js, send.js, inbox.js | Sheet ID from the URL |
| `HUNTER_IO_API_KEY` | enrichment-engine.js, bounce-handler.js | Hunter.io email verification |
| `OUTLOOK_CLIENT_ID` | mailer.js, approval-email.js, inbox.js | Azure app registration client ID |
| `OUTLOOK_CLIENT_SECRET` | mailer.js, approval-email.js, inbox.js | Azure app registration secret |
| `OUTLOOK_TENANT_ID` | mailer.js, approval-email.js, inbox.js | Azure Entra ID tenant |
| `OUTLOOK_PASSWORD` | inbox-monitor.js | oliver@vtwo.co password (IMAP basic auth) |
| `SDR_TOKEN` | approval-email.js, cloudflare worker | Shared secret for approval link validation |
| `WORKER_URL` | approval-email.js | Cloudflare Worker URL (e.g. `https://sdr-approval.kianamicari1.workers.dev`) |

**Loading locally:** Always use `node -r dotenv/config scripts/<script>.js` — never `source .env`. The PEM private key is multiline and breaks shell parsing.

---

## Workflow Reference

| Workflow | Trigger | Script | What It Does |
|---|---|---|---|
| `daily-sync.yml` | 7:00 AM ET Mon–Fri + manual | sync.js | Pull Sheet → merge local state → enrich new prospects → run follow-up scheduler → write Sheet status changes → commit prospects.json |
| `daily-draft.yml` | 7:30 AM ET Mon–Fri + manual | draft.js → approval-email.js | Find eligible prospects → one batched Haiku call → write drafts file → send approval digest email |
| `approval-handler.yml` | workflow_dispatch (Worker → GitHub API) | handle-approval.js | Approve: move draft to approved/, trigger send. Reject: reset prospect to pre-draft status |
| `send-approved.yml` | On approval + 10 AM ET cron | send.js | Send all files in outreach/approved/ via MS Graph, move to sent/, update prospects.json + Sheet |
| `inbox-check.yml` | 9 AM + 3 PM ET Mon–Fri + manual | inbox.js | IMAP scan → classify replies → route to correct state → send hot lead alert if positive → update Sheet |
| `weekly-prospect.yml` | Sun 8 PM ET + manual | prospect.js | Claude Sonnet generates 25 new ICP-matched prospects → dedup → append to Sheet |
| `weekly-digest.yml` | Fri 5 PM ET + manual | digest.js | Aggregate 7-day stats (sends, replies, pipeline) → send summary email to oliver@vtwo.co |

**Manual trigger:** Go to Actions tab → select workflow → "Run workflow" → Run.

---

## Lead Lifecycle

```
new
 └─ email_discovered     Email confirmed (manually in Sheet or by enrichment)
     └─ draft_generated  Draft created by draft.js
         └─ email_sent   Sent via send.js (fc set on touch 1, sc on touch 2, tc on touch 3)
             ├─ followup_due       Day 5 after fc, or day 7 after sc (set by sync.js scheduler)
             │   └─ draft_generated → email_sent  (loops for touches 2 & 3)
             │   └─ closed_no_reply  (7 days after touch 3 / tc)
             ├─ ooo_pending         Auto-reply detected; nfu date set
             │   └─ followup_due    (after nfu date passes)
             ├─ closed_positive     Positive reply — hot lead alert sent immediately
             ├─ closed_negative     Negative reply or opt-out
             ├─ closed_no_reply     Exhausted sequence (terminal)
             └─ bounced_no_alt      Bounce with no valid alternate email (terminal)
```

**Terminal states** (sequence stops permanently): `closed_positive`, `closed_negative`, `closed_no_reply`, `bounced_no_alt`.

---

## Follow-Up Sequence

Timing is counted from the explicit contact date columns (fc, sc, tc), set by send.js when each touch is sent:

| Touch | Status When Due | Wait Time | Date Field Used | Template |
|---|---|---|---|---|
| Touch 1 | `email_discovered` | — (initial) | sets `fc` | A, B, or C by track |
| Touch 2 | `followup_due` | 5 days after `fc` | sets `sc` | D |
| Touch 3 | `followup_due` | 7 days after `sc` | sets `tc` | E |
| Close | `closed_no_reply` | 7 days after `tc` | — | — |

The scheduler in sync.js runs daily and sets `followup_due` or `closed_no_reply` automatically.

---

## Reply Handling

inbox.js scans IMAP twice daily (9 AM + 3 PM ET) and routes by classification:

| Classification | Status Set | Notes |
|---|---|---|
| `positive` | `closed_positive` | Sequence stops; hot lead alert email sent to oliver@vtwo.co immediately |
| `negative` | `closed_negative` | Sequence stops |
| `opt_out` | `closed_negative` | Sequence stops |
| `auto_reply` | `ooo_pending` | Parses return date → sets `nfu`; falls back to tomorrow |
| `bounce` | `bounced_no_alt` or `email_discovered` | MX-check domain first; cycle untried email patterns (no Hunter cost); Hunter verify only on final candidate |
| `unknown` | no change | Logged only — review manually |

---

## Troubleshooting

### No approval email arrived

1. Check GitHub Actions → `daily-draft.yml` → last run. Look for errors.
2. Common cause: no prospects with `email_discovered` or `followup_due` status.
3. Run locally: `node -r dotenv/config scripts/draft.js` — check output.

### Approve/Reject link returns an error

- **401** → `SDR_TOKEN` mismatch between GitHub Secret and Cloudflare Worker variable. Make sure both are set to the exact same value.
- **502 — GitHub auth failed** → `GITHUB_PAT` in Cloudflare is expired or missing. Regenerate (fine-grained, Actions: read+write on v-two-sdr), update in Cloudflare dashboard.
- **Worker URL not found** → `WORKER_URL` GitHub Secret doesn't match the deployed Worker URL. Check the Cloudflare dashboard for the current URL.

### Email not sent after approval

1. Check Actions → `send-approved.yml` → was it triggered?
2. If not triggered: `approval-handler.yml` failed before dispatching. Check its logs.
3. If triggered but send failed: check for daily limit hit (`MAX_DAILY_SENDS=15`) or Outlook OAuth error.
4. The approved draft stays in `outreach/approved/` until successfully sent — the 10 AM ET cron will retry.

### Sheet not updating

- All Sheet writes are best-effort and log warnings on failure, not errors.
- Check the workflow log for `[sync] Sheet write failed` or `[send] Sheet write-back failed`.
- Common cause: service account key rotated but not updated in GitHub Secrets.
- Fix: update `GOOGLE_PRIVATE_KEY` secret with the new PEM key.

### Sync reads wrong fields / empty prospects

- The `field_mapping` in `config.sheets.js` must match the exact column headers in the Sheet.
- If a column was renamed, update the mapping key in `config.sheets.js` and commit.
- Required Sheet columns (in order): Name, Title, Company, Domain, Email, City, State, Country, Timezone, Company Size, Annual Revenue, Industry, Source, Status, Date Added, Next Contact Date, First Contact Date, Second Contact Date, Third Contact Date, Fourth Contact Date, Fifth Contact Date, Notes.

### Tests failing

```bash
npm test
```

287 tests across 10 suites. Coverage threshold warnings are expected (new scripts lack unit tests) — only hard failures matter.

---

## What To Do If Something Breaks Badly

1. **Check Actions tab first** — the failed step and error message are there.
2. **All data is in git** — `prospects.json`, `outreach/drafts/`, `outreach/approved/` are all committed after each step. Roll back with `git revert` if a bad write happened.
3. **Drafts are never auto-sent** — even if everything upstream breaks, nothing goes out without an Approve click.
4. **Approved drafts persist** — files in `outreach/approved/` survive failed send runs. The 10 AM cron retries automatically.
5. **To fully reset a prospect**: change their status in the Sheet to `new` or `email_discovered`. The next sync picks it up.

---

## Local Manual Run (any step)

```bash
cd ~/OliverRepo/workspaces/work/projects/SDR

# Full sync
node -r dotenv/config scripts/sync.js

# Generate drafts
node -r dotenv/config scripts/draft.js

# Send approval digest email
node -r dotenv/config scripts/approval-email.js

# Process an approval (simulate)
DRAFT_ID=20260327-p-000001 ACTION=approve node -r dotenv/config scripts/handle-approval.js

# Send approved drafts
node -r dotenv/config scripts/send.js

# Check inbox
node -r dotenv/config scripts/inbox.js

# Weekly prospecting
node -r dotenv/config scripts/prospect.js

# Weekly digest
node -r dotenv/config scripts/digest.js
```

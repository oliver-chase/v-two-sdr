# SDR System Runbook

**Repo:** saturdaythings/v-two-sdr
**Updated:** 2026-03-27

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
```

Git is the audit trail. Every step commits its output — `sync: prospects updated`, `drafts: generated`, `sent: approved emails dispatched`, `inbox: replies classified`.

---

## Daily Experience

You wake up to an email from Oliver SDR Bot at ~7:35 AM with subject:
**`[SDR] N drafts ready for approval — Mar 27`**

The email lists each draft with prospect details and two commands per draft:

```
APPROVE: curl -s -X POST "https://api.github.com/..." -H "Authorization: Bearer ghp_..." ...
REJECT:  curl -s -X POST "https://api.github.com/..." -H "Authorization: Bearer ghp_..." ...
```

Copy-paste the APPROVE or REJECT command into your terminal. That's it. The email fires within seconds.

If no email arrives: either no prospects were eligible today, or a workflow failed (check the Actions tab).

---

## Adding Prospects

All prospect management is in Google Sheets. Add a row to the **"Leads"** tab of **"V.Two SDR - Master Lead Repository"**.

**Required columns:** Name, Title, Company, Email
**Optional but useful:** Location, Timezone, LinkedIn, Signal, Source, Track

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
| `ANTHROPIC_API_KEY` | draft.js, prospect.js | Claude API key (Haiku for drafting, Sonnet for prospecting) |
| `OUTLOOK_TENANT_ID` | mailer.js, approval-email.js | Azure Entra ID tenant |
| `OUTLOOK_CLIENT_ID` | mailer.js, approval-email.js | Azure app registration client ID |
| `OUTLOOK_CLIENT_SECRET` | mailer.js, approval-email.js | Azure app registration secret |
| `OUTLOOK_PASSWORD` | inbox-monitor.js | oliver@vtwo.co account password (IMAP basic auth) |
| `GOOGLE_SHEET_ID` | sync.js, draft.js, send.js, inbox.js | Sheet ID from the URL |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | all Sheet scripts | Service account email |
| `GOOGLE_PRIVATE_KEY` | all Sheet scripts | PEM private key (multiline) |
| `HUNTER_IO_API_KEY` | enrichment-engine.js, bounce-handler.js | Hunter.io email verification |
| `ABSTRACT_API_KEY` | enrichment-engine.js | Timezone lookup |
| `SERPER_API_KEY` | enrichment-engine.js | Web search for enrichment signals |
| `SDR_TOKEN` | approval-email.js, cloudflare worker | Shared secret for approval link validation |
| `WORKER_URL` | approval-email.js | Cloudflare Worker URL (default: https://sdr-approval.workers.dev) |

**Loading locally:** Always use `node -r dotenv/config scripts/<script>.js` — never `source .env`. The PEM private key is multiline and breaks shell parsing.

---

## Workflow Reference

| Workflow | Trigger | Script | What It Does |
|---|---|---|---|
| `daily-sync.yml` | 7:00 AM ET Mon–Fri + manual | sync.js | Pull Sheet → merge local state → enrich new prospects → run follow-up scheduler → write Sheet status changes → commit prospects.json |
| `daily-draft.yml` | 7:30 AM ET Mon–Fri + manual | draft.js → approval-email.js | Find eligible prospects → one batched Haiku call → write drafts file → send approval digest email |
| `approval-handler.yml` | workflow_dispatch (curl from email) | handle-approval.js | Approve: move draft to approved/, trigger send. Reject: reset prospect to pre-draft status |
| `send-approved.yml` | On approval + 10 AM ET cron | send.js | Send all files in outreach/approved/ via MS Graph, move to sent/, update prospects.json + Sheet |
| `inbox-check.yml` | 9 AM + 3 PM ET Mon–Fri + manual | inbox.js | IMAP scan → classify replies → route to correct state → update Sheet |

**Manual trigger:** Go to Actions tab → select workflow → "Run workflow" → Run.

---

## Lead Lifecycle

```
new
 └─ email_discovered     Email confirmed (manually in Sheet or by enrichment)
     └─ draft_generated  Draft created by draft.js
         └─ email_sent   Sent via send.js
             ├─ followup_due       Day 5 or day 12 (set by sync.js scheduler)
             │   └─ draft_generated → email_sent  (loops for touches 2 & 3)
             │   └─ closed_no_reply  (after touch 3)
             ├─ ooo_pending         Auto-reply detected; nfu date set
             │   └─ followup_due    (after nfu date passes)
             ├─ replied             Any non-auto, non-bounce reply
             │   ├─ closed_positive
             │   └─ closed_negative
             ├─ closed_positive     Positive reply (meeting booked, etc.)
             ├─ closed_negative     Negative reply or opt-out
             ├─ closed_no_reply     Exhausted sequence (terminal)
             └─ bounced_no_alt      Bounce with no valid alternate email (terminal)
```

**Terminal states** (sequence stops permanently): `closed_positive`, `closed_negative`, `closed_no_reply`, `bounced_no_alt`.

---

## Follow-Up Sequence

Timing is counted from `lc` (last contact date), enforced by `config/sequences.js`:

| Touch | Status When Due | Days Since Last Contact | Template |
|---|---|---|---|
| Touch 1 | `email_discovered` | — (initial) | A, B, or C by track |
| Touch 2 | `followup_due` | 5 days | D |
| Touch 3 | `followup_due` | 7 days after touch 2 (day 12 total) | E |
| Close | `closed_no_reply` | 7 days after touch 3 (day 19 total) | — |

The scheduler in sync.js runs daily and sets `followup_due` or `closed_no_reply` automatically.

---

## Reply Handling

inbox.js scans IMAP twice daily (9 AM + 3 PM ET) and routes by classification:

| Classification | Status Set | Notes |
|---|---|---|
| `positive` | `closed_positive` | Sequence stops |
| `negative` | `closed_negative` | Sequence stops |
| `opt_out` | `closed_negative` | Sequence stops |
| `auto_reply` | `ooo_pending` | Parses return date → sets `nfu`; falls back to tomorrow |
| `bounce` | `bounced_no_alt` or `email_discovered` | bounce-handler tries Hunter for alternate email (score ≥ 80); if found, updates email and re-queues |
| `unknown` | no change | Logged only — review manually |

---

## Troubleshooting

### No approval email arrived

1. Check GitHub Actions → `daily-draft.yml` → last run. Look for errors.
2. Common cause: no prospects with `email_discovered` or `followup_due` status.
3. Run locally: `node -r dotenv/config scripts/draft.js` — check output.

### Approval curl command fails

- 401 → SDR_PAT is expired or wrong scope. Regenerate in GitHub (needs `actions:write`), update secret.
- 404 → Wrong repo in the URL. Check `APPROVAL_BASE_URL` in `scripts/approval-email.js`.
- 422 → `draft_id` or `action` input is wrong. Re-run the curl command as-is.

### Email not sent after approval

1. Check Actions → `send-approved.yml` → was it triggered?
2. If not triggered: approval-handler.yml failed before the curl dispatch step. Check its logs.
3. If triggered but send failed: check for daily limit hit (`MAX_DAILY_SENDS=15`) or Outlook OAuth error.
4. The approved draft stays in `outreach/approved/` until successfully sent — the 10 AM ET cron will retry.

### Sheet not updating

- All Sheet writes are best-effort and log warnings on failure, not errors.
- Check the workflow log for `[sync] Sheet write failed` or `[send] Sheet write-back failed`.
- Common cause: service account key rotated in Azure but not updated in GitHub Secrets.
- Fix: update `GOOGLE_PRIVATE_KEY` secret with the new PEM key.

### Sync reads wrong fields / empty prospects

- The `field_mapping` in `config.sheets.js` must match the exact column headers in the Sheet.
- If Kiana renamed a column, update the mapping key in `config.sheets.js` and commit.
- Required Sheet columns: Name, Title, Company, Domain, Email, City, Timezone, Industry, Source, Status, Date Added, Notes.
  Add a `Domain` column if it doesn't exist — enrichment-engine uses it for accurate email generation.

### Tests failing

```bash
npm test
```

287 tests across 10 suites. The coverage threshold warnings are expected (new scripts lack unit tests) — only hard failures matter.

---

## What To Do If Something Breaks Badly

1. **Check Actions tab first** — the failed step and error message are there.
2. **All data is in git** — `prospects.json`, `outreach/drafts/`, `outreach/approved/` are all committed after each step. Roll back with `git revert` if a bad write happened.
3. **Drafts are never auto-sent** — even if everything upstream breaks, nothing goes out without an approval curl command being run manually.
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
```

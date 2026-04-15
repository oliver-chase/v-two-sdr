# SDR System — Redesign Spec

**Date:** 2026-03-26 | **Status:** Approved for Implementation | **Owner:** Kiana

---

## Why This Redesign

The original architecture assigned OpenClaw as the daily orchestrator — a stateful AI agent running a 13-step pipeline, routing approvals via Telegram, managing multi-tier LLM fallback chains. This never ran reliably because AI agents are token-expensive, stateless between sessions, and the wrong tool for deterministic work.

**The core problem:** Most of what this system does is mechanical. Sync a sheet. Call Hunter. Call an LLM once. Send an email. Log the result. None of that needs an AI agent orchestrating it — it needs a cron job.

**The redesign principle:** GitHub Actions is the orchestrator. Git is the audit trail. The LLM does exactly one thing: write the email draft. Everything else is deterministic Node scripts triggered on a schedule.

---

## What's Kept (Do Not Touch)

These scripts work. Do not rewrite them.

- `scripts/enrichment-engine.js` — email discovery + timezone
- `scripts/hunter-verifier.js` — Hunter.io email validation
- `scripts/mailer.js` — Outlook SMTP send
- `scripts/oauth-client.js` — Microsoft Graph OAuth
- `scripts/inbox-monitor.js` — IMAP reply detection
- `scripts/reply-classifier.js` — LLM reply classification
- `scripts/state-machine.js` — lead lifecycle enforcement
- `sheets-connector.js` — Google Sheets read
- `sheets-writer.js` — Google Sheets write
- `config/config.google-sheets-write.js` — protected fields config
- `config.sheets.js` — field mappings
- `config.email.js` — sender settings

---

## What's Deleted

Remove entirely — do not migrate or reference:

- `scripts/send-queue.js` — replaced by timezone logic in send workflow
- `scripts/queue-executor.js` — replaced by GitHub Actions schedule
- `scripts/daily-run.js` — replaced by individual workflow scripts
- `scripts/approve-drafts.js` — replaced by email approval flow
- `scripts/send-approved.js` — replaced by `scripts/send.js`
- All agent role files (`agents/`) — OpenClaw is no longer the orchestrator
- `OPENCLAW.md`, `OPENCLAW_RUNBOOK.md` — superseded by this doc
- `OPENCLAW_EMAIL_RESEARCH_STRATEGY.md` — superseded
- `OliverDashboard_and_SDR_ORCHESTRATION_DESIGN_SUMMARY.txt` — superseded
- `TELEGRAM_INTEGRATION_BRIEF.md` — Telegram not used in redesign
- `IMPLEMENTATION_MANIFEST.md`, `PRESERVATION_AUDIT.md`, `DOCUMENTATION_AUDIT_REPORT.md` — consolidate into this doc

---

## What's New

Four new scripts + five GitHub Actions workflows.

**New scripts:**
- `scripts/sync.js` — thin wrapper: pulls Sheets, writes prospects.json, checks follow-up due dates
- `scripts/draft.js` — batched LLM call for all eligible prospects, saves to outreach/drafts/
- `scripts/approval-email.js` — sends Kiana one summary email with approve/reject links per draft
- `scripts/send.js` — processes approved queue, timezone-aware scheduling, sends via Outlook
- `scripts/bounce-handler.js` — Hunter retry on bounce, updates Sheet, re-queues or marks closed
- `scripts/followup-scheduler.js` — checks days-since-contact, sets followup_due status

**New workflows (`.github/workflows/`):**
- `daily-sync.yml` — 7:00 AM ET Mon-Fri
- `daily-draft.yml` — 7:30 AM ET Mon-Fri
- `approval-handler.yml` — triggered by webhook (approval click)
- `send-approved.yml` — triggered by approval OR 10 AM ET Mon-Fri
- `inbox-check.yml` — 9:00 AM + 3:00 PM ET Mon-Fri

---

## Full System Architecture

### Data Flow

```
Google Sheets (source of truth)
    ↓  [7:00 AM — daily-sync.yml]
scripts/sync.js
  - Pulls all rows from "Leads" tab
  - Writes prospects.json
  - Flags status=followup_due for day-5 and day-12 prospects
  - Commits: "sync: N prospects, M follow-ups due"
    ↓  [7:30 AM — daily-draft.yml]
scripts/draft.js
  - Finds all prospects with status: email_discovered OR followup_due
  - Makes ONE batched LLM call (all prospects in single prompt)
  - Saves drafts to outreach/drafts/YYYY-MM-DD.json
  - Commits: "drafts: generated N drafts"
    ↓
scripts/approval-email.js
  - Sends Kiana one email listing all drafts
  - Each draft has inline Approve / Reject links
  - Links trigger approval-handler.yml via GitHub workflow_dispatch
    ↓  [Kiana clicks Approve/Reject links in email]
approval-handler.yml
  - Receives draft_id + action (approve|reject) as inputs
  - Approved: moves draft to outreach/approved/, commits, triggers send
  - Rejected: marks rejected in prospects.json, commits, done
    ↓  [send-approved.yml — triggered immediately on approval]
scripts/send.js
  - Reads outreach/approved/
  - For each draft: checks prospect timezone
  - Calculates next Tue-Thu 9-11 AM window in prospect's local time
  - Sends via Outlook SMTP (mailer.js)
  - Updates prospects.json: status → email_sent, last_contact, follow_up_count
  - Writes back to Google Sheet
  - Commits: "sent: email to [prospect_id] at [timestamp]"
    ↓  [9:00 AM + 3:00 PM — inbox-check.yml]
scripts/inbox.js
  - IMAP scan of oliver@vtwo.co
  - Classifies each new message via reply-classifier.js
  - Routes by classification:
      positive   → status: closed_positive, stop sequence, flag in Sheet
      negative   → status: closed_negative, stop sequence
      ooo        → parse return date, set next_followup, status: ooo_pending
      bounce     → run bounce-handler.js
      no-reply   → followup-scheduler.js checks day-5, day-12 thresholds
  - All state changes written to Google Sheet
  - Commits: "inbox: N replies classified"
```

### Bounce Handling

```
Bounce detected by inbox.js
    ↓
scripts/bounce-handler.js
  - Calls Hunter.io with alternate email patterns
  - If confidence >= 0.8: update Sheet email field, status → email_discovered
      (re-enters draft queue on next daily-sync run)
  - If no alt found: status → bounced_no_alt, stop sequence
  - Commits: "bounce: [prospect_id] — [new_email | no_alt_found]"
```

### Follow-up Sequence

```
Day 0:  Initial email sent → status: email_sent
Day 5:  sync.js flags → status: followup_due (touch 2)
Day 12: sync.js flags → status: followup_due (touch 3)
Day 19: no reply → status: closed_no_reply, stop sequence

Total: 3 touches (initial + 2 follow-ups), sequence closes day 19
```

OOO handling: if return date is parseable from the OOO message, set `next_followup` to return date + 1 day. sync.js picks this up and flags `followup_due` on that date.

---

## GitHub Actions Workflows

### 1. `daily-sync.yml`

```yaml
name: SDR Daily Sync
on:
  schedule:
    - cron: '0 12 * * 1-5'  # 7:00 AM ET (UTC-5)
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node scripts/sync.js
        env:
          GOOGLE_SHEET_ID: ${{ secrets.GOOGLE_SHEET_ID }}
          GOOGLE_SERVICE_ACCOUNT_EMAIL: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_EMAIL }}
          GOOGLE_PRIVATE_KEY: ${{ secrets.GOOGLE_PRIVATE_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "sync: prospects updated"
```

### 2. `daily-draft.yml`

```yaml
name: SDR Daily Draft
on:
  schedule:
    - cron: '30 12 * * 1-5'  # 7:30 AM ET
  workflow_dispatch:

jobs:
  draft:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node scripts/draft.js
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - run: node scripts/approval-email.js
        env:
          OUTLOOK_TENANT_ID: ${{ secrets.OUTLOOK_TENANT_ID }}
          OUTLOOK_CLIENT_ID: ${{ secrets.OUTLOOK_CLIENT_ID }}
          OUTLOOK_CLIENT_SECRET: ${{ secrets.OUTLOOK_CLIENT_SECRET }}
          APPROVAL_BASE_URL: "https://api.github.com/repos/oliver-chase/v-two-sdr/actions/workflows/approval-handler.yml/dispatches"
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "drafts: generated"
```

### 3. `approval-handler.yml`

```yaml
name: SDR Approval Handler
on:
  workflow_dispatch:
    inputs:
      draft_id:
        description: 'Draft ID to process'
        required: true
      action:
        description: 'approve or reject'
        required: true

jobs:
  handle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node scripts/handle-approval.js
        env:
          DRAFT_ID: ${{ inputs.draft_id }}
          ACTION: ${{ inputs.action }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "approval: ${{ inputs.action }} ${{ inputs.draft_id }}"
      - if: ${{ inputs.action == 'approve' }}
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'send-approved.yml',
              ref: 'main'
            })
```

### 4. `send-approved.yml`

```yaml
name: SDR Send Approved
on:
  workflow_dispatch:
  schedule:
    - cron: '0 15 * * 1-5'  # 10:00 AM ET safety net

jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node scripts/send.js
        env:
          OUTLOOK_TENANT_ID: ${{ secrets.OUTLOOK_TENANT_ID }}
          OUTLOOK_CLIENT_ID: ${{ secrets.OUTLOOK_CLIENT_ID }}
          OUTLOOK_CLIENT_SECRET: ${{ secrets.OUTLOOK_CLIENT_SECRET }}
          GOOGLE_SHEET_ID: ${{ secrets.GOOGLE_SHEET_ID }}
          GOOGLE_SERVICE_ACCOUNT_EMAIL: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_EMAIL }}
          GOOGLE_PRIVATE_KEY: ${{ secrets.GOOGLE_PRIVATE_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "sent: approved emails dispatched"
```

### 5. `inbox-check.yml`

```yaml
name: SDR Inbox Check
on:
  schedule:
    - cron: '0 14 * * 1-5'  # 9:00 AM ET
    - cron: '0 20 * * 1-5'  # 3:00 PM ET
  workflow_dispatch:

jobs:
  inbox:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node scripts/inbox.js
        env:
          OUTLOOK_PASSWORD: ${{ secrets.OUTLOOK_PASSWORD }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GOOGLE_SHEET_ID: ${{ secrets.GOOGLE_SHEET_ID }}
          GOOGLE_SERVICE_ACCOUNT_EMAIL: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_EMAIL }}
          GOOGLE_PRIVATE_KEY: ${{ secrets.GOOGLE_PRIVATE_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "inbox: replies classified"
```

---

## Folder Structure (Final State)

```
v-two-sdr/
├── .github/
│   └── workflows/
│       ├── daily-sync.yml
│       ├── daily-draft.yml
│       ├── approval-handler.yml
│       ├── send-approved.yml
│       └── inbox-check.yml
├── scripts/
│   ├── sync.js                    # NEW: thin orchestrator for sync step
│   ├── draft.js                   # NEW: batched LLM drafting
│   ├── approval-email.js          # NEW: sends approval digest email
│   ├── handle-approval.js         # NEW: processes approve/reject
│   ├── send.js                    # NEW: timezone-aware send
│   ├── inbox.js                   # NEW: thin wrapper around inbox-monitor
│   ├── bounce-handler.js          # NEW: Hunter retry on bounce
│   ├── followup-scheduler.js      # NEW: day-5/day-12 follow-up logic
│   ├── enrichment-engine.js       # KEEP
│   ├── hunter-verifier.js         # KEEP
│   ├── mailer.js                  # KEEP
│   ├── oauth-client.js            # KEEP
│   ├── inbox-monitor.js           # KEEP
│   ├── reply-classifier.js        # KEEP
│   ├── state-machine.js           # KEEP
│   └── validate-prospects.js      # KEEP
├── outreach/
│   ├── drafts/                    # YYYY-MM-DD.json per day
│   ├── approved/                  # approved drafts pending send
│   ├── sent/                      # send log
│   └── replies/                   # reply log
├── config/
│   ├── config.google-sheets-write.js   # KEEP
│   ├── sequences.js               # NEW: follow-up timing (day 5, day 12, day 19)
│   └── templates/                 # email templates A/B/C + follow-up variants
├── sheets-connector.js            # KEEP
├── sheets-writer.js               # KEEP
├── config.sheets.js               # KEEP
├── config.email.js                # KEEP
├── prospects.json                 # generated, committed on each sync
└── __tests__/                     # KEEP all existing tests
```

---

## Approval Email Format

The email Kiana receives every morning at ~7:35 AM:

```
Subject: [SDR] 8 drafts ready for approval — Mar 26

Hi Oliver,

8 emails drafted for today. Click Approve or Reject for each.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 of 8 — INITIAL OUTREACH
   To: Jane Smith, VP Engineering @ Acme Corp
   Email: jane.smith@acme.com
   Track: product-maker

   Subject: Quick thought on your eng team

   Hi Jane,
   [draft body]

   ✅ APPROVE → https://api.github.com/...dispatch (draft_id=abc, action=approve)
   ❌ REJECT  → https://api.github.com/...dispatch (draft_id=abc, action=reject)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2 of 8 — FOLLOW-UP (Day 5)
   To: John Doe, CTO @ Beta Inc
   ...
```

Each link is a GitHub `workflow_dispatch` API call. Clicking it fires `approval-handler.yml` immediately. No login required if the token is embedded in the URL (use a scoped PAT with `actions:write` only).

---

## Google Sheet Write-Back — Full Event Table

Every state change writes to the Sheet. This is the complete list:

| Event | Fields Updated | Script |
|---|---|---|
| Sync runs | Status (if changed) | sync.js |
| Enrichment finds email | Email, Timezone, Location, Signal, Status → email_discovered | sync.js via enrichment-engine |
| Draft generated | Status → draft_generated | draft.js |
| Kiana approves | Status → approved | handle-approval.js |
| Kiana rejects | Status → rejected | handle-approval.js |
| Email sent | Status → email_sent, Last Contact, Follow-Up Count | send.js |
| Positive reply | Status → closed_positive | inbox.js |
| Negative reply | Status → closed_negative | inbox.js |
| OOO reply | Status → ooo_pending, Next Follow-Up date | inbox.js |
| Bounce + alt found | Email updated, Status → email_discovered | bounce-handler.js |
| Bounce + no alt | Status → bounced_no_alt | bounce-handler.js |
| Follow-up due | Status → followup_due | sync.js via followup-scheduler |
| Sequence exhausted (day 19) | Status → closed_no_reply | followup-scheduler.js |

---

## LLM Usage (Minimal by Design)

AI is used in exactly two places:

**1. Email drafting (draft.js)**
- One API call per run, all eligible prospects batched in a single prompt
- Model: Claude Haiku (cheapest, fast, good enough for templated outreach)
- Estimated cost: $0.01–0.05/day at 5-15 prospects
- Fallback: if API fails, skip drafting that day, log warning, no crash

**2. Reply classification (reply-classifier.js — existing)**
- One API call per reply received
- Already written and tested
- Keep as-is

No other AI usage. No orchestration. No research agents. No multi-tier fallback chains.

---

## Prospect Research (Manual Addition)

The original design had OpenClaw researching prospects autonomously. This is out of scope for the automation — prospect sourcing requires judgment. The workflow is:

1. Kiana adds prospects to the "Leads" tab in Google Sheet manually (or via a future research script)
2. Required fields at add time: Name, Title, Company, Email (if known) or just Name+Title+Company (enrichment finds email)
3. Daily sync picks them up automatically

This is intentional. Prospect quality matters more than prospect volume, and that judgment belongs with Kiana.

---

## Secrets Required (GitHub Actions)

| Secret | Purpose |
|---|---|
| GOOGLE_SHEET_ID | Lead repository sheet ID |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | Write access to Sheet |
| GOOGLE_PRIVATE_KEY | Service account key (full, untruncated JSON) |
| GOOGLE_API_KEY | Read-only fallback |
| OUTLOOK_TENANT_ID | Microsoft Graph OAuth |
| OUTLOOK_CLIENT_ID | Microsoft Graph OAuth |
| OUTLOOK_CLIENT_SECRET | Microsoft Graph OAuth |
| OUTLOOK_PASSWORD | IMAP fallback for inbox monitoring |
| ANTHROPIC_API_KEY | Email drafting + reply classification |
| HUNTER_IO_API_KEY | Email discovery + bounce retry |
| ABSTRACT_API_KEY | Timezone enrichment |
| GITHUB_TOKEN | Auto-provided by Actions (approval dispatch) |
| SDR_PAT | Personal access token for approval email links (actions:write scope only) |

Note on GOOGLE_PRIVATE_KEY: must be the complete private key from the service account JSON file. If it was truncated previously, regenerate the service account key in Google Cloud Console and paste the full value.

---

## Build Sequence for Claude Code

Build in this order. Each chunk is independently testable before proceeding.

### Chunk 1 — Workflow scaffolding (no logic yet)
- Create all 5 `.github/workflows/` YAML files (stubs that just echo "hello")
- Verify they appear in GitHub Actions tab and can be manually triggered
- Commit: "scaffold: 5 workflow stubs"

### Chunk 2 — Sync script
- Write `scripts/sync.js` using existing `sheets-connector.js`
- Wire `followup-scheduler.js` to flag day-5/day-12 prospects
- Wire into `daily-sync.yml`
- Test: run locally, verify prospects.json updates and Sheet write-back works
- Commit: "feat: sync script + followup scheduler"

### Chunk 3 — Draft script
- Write `scripts/draft.js` — single batched Anthropic call
- Use existing templates from `outreach/templates/`
- Save output to `outreach/drafts/YYYY-MM-DD.json`
- Wire into `daily-draft.yml`
- Test: run locally with 2-3 test prospects
- Commit: "feat: batched LLM drafting"

### Chunk 4 — Approval email
- Write `scripts/approval-email.js`
- Sends formatted email via existing `mailer.js`
- Each draft gets approve/reject links pointing to `approval-handler.yml`
- Uses `SDR_PAT` for authenticated dispatch URLs
- Test: send test email to oliver@vtwo.co, verify links render
- Commit: "feat: approval email"

### Chunk 5 — Approval handler + send
- Write `scripts/handle-approval.js` — moves draft to approved/ or marks rejected
- Write `scripts/send.js` — timezone window calculation + mailer call + Sheet write-back
- Wire both workflows
- Test: manually trigger approval-handler with a test draft_id, verify send fires
- Commit: "feat: approval handler + send"

### Chunk 6 — Inbox + bounce
- Write `scripts/inbox.js` as thin wrapper around existing `inbox-monitor.js`
- Write `scripts/bounce-handler.js` using existing `hunter-verifier.js`
- Wire into `inbox-check.yml`
- Test: trigger manually, verify Sheet updates on classification
- Commit: "feat: inbox check + bounce handler"

### Chunk 7 — End-to-end test + cleanup
- Delete all files marked DELETE in this spec
- Run full pipeline manually: sync → draft → approve → send → inbox
- Verify git commit trail shows every step
- Verify Google Sheet shows correct state after each step
- Commit: "cleanup: remove legacy orchestration files"

---

## Success Criteria

The system is working when:
- GitHub Actions tab shows green checkmarks daily without manual intervention
- Kiana receives one approval email by 7:35 AM each weekday
- Clicking Approve triggers a send within the prospect's timezone window
- Google Sheet reflects current state of every prospect at all times
- Git log shows a complete audit trail: sync → draft → approve → sent → inbox
- No OpenClaw involvement in any daily step

---

**Last Updated:** 2026-03-26 | **Status:** Ready for Claude Code implementation
**Supersedes:** OPENCLAW.md, SYSTEM_SPEC.md, ARCHITECTURE.md, CURRENT_STATE.md, CHECKPOINT.md, NEXT_STEPS.md

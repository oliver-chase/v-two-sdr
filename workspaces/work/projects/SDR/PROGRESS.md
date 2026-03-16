# Project: Oliver Chase AI SDR System

## Current State
- **Phase:** 2 COMPLETE — Ready for first run (pending credentials setup)
- **Last Completed:** 2026-03-16
- **Tests:** ✅ 288/288 passing | Coverage thresholds met
- **Branch:** main

## What's Built (All Complete)

| Chunk | Component | Status | Tests |
|-------|-----------|--------|-------|
| 1 | Cleanup & File Reorganization | ✅ Done | — |
| 2 | Google Sheets Integration | ✅ Done | ~60 tests |
| 3 | Enrichment Engine | ✅ Done | 54 tests |
| 4 | State Machine | ✅ Done | 55 tests |
| 5 | Email Drafting + Approval CLI | ✅ Done | included |
| 6 | Inbox Monitor + Reply Classifier | ✅ Done | included |
| 7 | Daily Orchestration (daily-run.js) | ✅ Done | included |
| 8 | Dashboard Metrics Endpoints | ✅ Done | — |

## What's Needed Before First Run

Setup steps (user action required):
1. ☐ Gmail App Password → `GMAIL_APP_PASSWORD` in `.env`
2. ☐ Google Cloud service account JSON → `secrets/google-credentials.json`
3. ☐ Google Sheet ID → `GOOGLE_SHEET_ID` in `.env`
4. ☐ Anthropic API key → `ANTHROPIC_API_KEY` in `.env`
5. ☐ Add prospects to `outreach/prospects.csv`
6. ☐ Review templates in `outreach/templates.md`

See `secrets/README.md` for step-by-step credential setup.
See `.env.example` for all environment variables.

## First Run Sequence (After Setup)
```bash
cp .env.example .env       # fill in credentials
node scripts/validate-prospects.js   # check CSV format
node scripts/sync-from-sheets.js     # optional: pull from Google Sheet
node scripts/draft-emails.js         # generate drafts → outreach/draft-plan.json
npm run approve                      # review drafts interactively
npm run send:dry                     # dry-run to verify before real sends
npm run send                         # send approved emails
npm run inbox                        # check for replies
```

## Daily Automation (After First Manual Run)
```bash
node scripts/daily-run.js            # full orchestration: sync→draft→inbox→report
node scripts/daily-run.js --step=inbox  # just inbox check
```

## Key Files

**Scripts:**
- `scripts/validate-prospects.js` — CSV → prospects.json validation
- `scripts/sync-from-sheets.js` — Google Sheets sync
- `scripts/draft-emails.js` — Draft generation
- `scripts/approve-drafts.js` — Interactive approval CLI
- `scripts/send-approved.js` — Send approved drafts
- `scripts/inbox-monitor.js` — IMAP reply detection
- `scripts/daily-run.js` — Master orchestration

**Data:**
- `outreach/prospects.csv` — Input: raw prospect list
- `prospects.json` — Canonical TOON prospect store
- `outreach/draft-plan.json` — Generated drafts
- `outreach/approved-sends.json` — Approved queue
- `outreach/sends.json` — Send log
- `outreach/replies.json` — Reply log
- `outreach/opt-outs.json` — Opt-out list

**Config:**
- `.env` — All credentials (create from `.env.example`)
- `outreach/templates.md` — Email templates A-E
- `config.email.js` — Email config (reads from .env)
- `config.sheets.js` — Sheets config (reads from .env)

## Dashboard Integration
- `GET /sdr/metrics` — Pipeline health snapshot
- `GET /sdr/pipeline` — Stage-by-stage funnel visualization
- Served from `system/dashboard/server.js` on port 3001

---
**Last Updated:** 2026-03-16
**Status:** ✅ Phase 2 Complete — Awaiting credential setup for first run

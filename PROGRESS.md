# Project: Oliver Chase AI SDR System

## Current State
- **Phase:** 2 COMPLETE — Ready for first run (pending credential testing)
- **Last Completed:** 2026-03-16
- **Tests:** ✅ 338/338 passing | Coverage thresholds met
- **Branch:** main
- **GitHub Repo:** saturdaythings/v-two-sdr
- **CI:** `.github/workflows/daily-sdr.yml` — runs 8AM ET weekdays

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

GitHub Secrets are set. Only credential testing remains — no new secrets to provision.

**GitHub Secrets (already set):**
- `GOOGLE_API_KEY` — Google Sheets read-only API key
- `GOOGLE_SHEET_ID` — ID of "V.Two SDR - Master Lead Repository"
- `OUTLOOK_PASSWORD` — oliver@vtwo.co Outlook password
- `ANTHROPIC_API_KEY` — Note: account currently has no funds (see LLM Routing below)
- `OPENROUTER_API_KEY` — OpenRouter paid tier (effective Tier 1)
- `OPENROUTER_FREE_KEY` — OpenRouter free tier fallback

**Remaining steps:**
1. ☐ Copy secrets to local `.env` and run a test sync
2. ☐ Add prospects to the Google Sheet (tab: "Leads")
3. ☐ Review templates in `outreach/templates.md`
4. ☐ Do a dry-run send to verify Outlook SMTP

See `secrets/README.md` for step-by-step credential setup.
See `.env.example` for all environment variables.

## Email Configuration

- **Provider:** Outlook / Microsoft 365
- **Sender:** oliver@vtwo.co
- **SMTP:** smtp.office365.com:587 (STARTTLS)
- **IMAP:** outlook.office365.com:993 (TLS)
- **BCC:** oliver@vtwo.co (on all outbound)

## Google Sheets Configuration

- **Auth:** API key (read-only) — no service account required
- **Sheet:** "V.Two SDR - Master Lead Repository"
- **Tab:** "Leads"
- **Column Schema:**
  Name, Title, Company, Email, Location, Timezone, LinkedIn, Company Size, Industry, Funding, Signal, Source, Status, Date Added, First Contact, Last Contact, Follow-Up Count, Next Follow-Up, Notes

## LLM Routing (AI Drafting)

3-tier fallback — system auto-routes based on availability:

| Tier | Provider | Key | Status |
|------|----------|-----|--------|
| 1 | Anthropic Claude | `ANTHROPIC_API_KEY` | No funds — skipped |
| 2 | OpenRouter paid | `OPENROUTER_API_KEY` | **Effective Tier 1** |
| 3 | OpenRouter free | `OPENROUTER_FREE_KEY` | Fallback |
| 4 | Static templates | — | Last resort |

Anthropic account currently has no funds. OpenRouter paid is the effective first tier until Anthropic is recharged.

## First Run Sequence (After Credential Testing)
```bash
cp .env.example .env       # fill in credentials
node scripts/sync-from-sheets.js     # pull from Google Sheet ("Leads" tab)
node scripts/validate-prospects.js   # check/validate prospect data
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

GitHub Actions (`daily-sdr.yml`) runs the full daily cycle at 8AM ET on weekdays automatically.

## Key Files

**Scripts:**
- `scripts/validate-prospects.js` — CSV → prospects.json validation
- `scripts/sync-from-sheets.js` — Google Sheets sync (API key auth)
- `scripts/draft-emails.js` — Draft generation (3-tier LLM fallback)
- `scripts/approve-drafts.js` — Interactive approval CLI
- `scripts/send-approved.js` — Send approved drafts via Outlook SMTP
- `scripts/inbox-monitor.js` — IMAP reply detection (Outlook)
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
- `.github/workflows/daily-sdr.yml` — GitHub Actions daily run

## Dashboard Integration
- `GET /sdr/metrics` — Pipeline health snapshot
- `GET /sdr/pipeline` — Stage-by-stage funnel visualization
- Served from `system/dashboard/server.js` on port 3001

---
**Last Updated:** 2026-03-16
**Status:** ✅ Phase 2 Complete — Credential testing + first run remaining

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


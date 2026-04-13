# Claude Code Guide — SDR Project

## What is SDR?
Automated B2B cold outreach via email. GitHub Actions runs the daily pipeline.
Claude Code does all code, tests, and git. No other agents involved.

## Source of Truth
- `REDESIGN.md` — architecture decisions and why
- `RUNBOOK.md` — how to operate the system day-to-day

## Tech Stack
- Node.js, Jest (386/386 tests passing)
- Google Sheets (prospect source of truth), GitHub Actions (orchestration)
- Outlook/Microsoft Graph (email send + IMAP)
- Anthropic Claude Haiku (batched draft generation, falls back to static templates)
- Repo: `saturdaythings/sdr`

## Your Role
✅ Code, tests, git, architecture decisions
✅ Running scripts locally with `node -r dotenv/config scripts/<script>.js`

## Key Scripts
- `scripts/sync.js` — pull Sheet, merge state, run scheduler, write prospects.json
- `scripts/draft.js` — batch LLM call, write outreach/drafts/YYYY-MM-DD.json
- `scripts/approval-email.js` — send digest email with approve/reject curl commands
- `scripts/handle-approval.js` — process approve/reject, trigger send
- `scripts/send.js` — send all approved drafts via Outlook
- `scripts/inbox.js` — IMAP scan, classify replies, update state

## Workflows
- `daily-sync.yml` — 7:00 AM ET Mon-Fri
- `daily-draft.yml` — 7:30 AM ET Mon-Fri
- `approval-handler.yml` — triggered by curl from approval email
- `send-approved.yml` — triggered on approval + 10 AM ET cron
- `inbox-check.yml` — 9:00 AM + 3:00 PM ET Mon-Fri

## Startup
```bash
cd ~/projects/v-two-sdr
cat RUNBOOK.md
```

**Last Updated:** 2026-03-27

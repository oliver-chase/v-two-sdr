# Claude Code Guide — SDR Project

## Start Here
Read `~/OliverRepo/agents/CLAUDE.md` first for startup sequence, models, and repo map.

## What is SDR?
Automated B2B sales outreach via email. AI-generated sequences, lead research, Google Sheets integration.

## Tech Stack
- Node.js (Express), Jest (375/375 tests passing)
- Google Sheets (prospects), GitHub Actions (daily orchestration)
- Outlook SMTP/IMAP
- Repo: `saturdaythings/v-two-sdr`

## Your Role (Claude Code)
✅ Code, tests, git, architecture decisions
❌ Real-time API calls, email sends, Sheets OAuth, web scraping — those are OpenClaw

## Key Files
- `PROGRESS.md` — current task status
- `MASTER.md` — full brief
- `scripts/daily-run.js` — main orchestration
- `scripts/` — all Node.js logic

## Startup
```bash
cd ~/OliverRepo/workspaces/work/projects/SDR
cat PROGRESS.md
cat CHECKPOINT.md
```

**Last Updated:** 2026-03-24

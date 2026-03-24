# OpenClaw Engagement Guide — SDR Project

How OpenClaw works on the SDR project, particularly the daily orchestration loop.

---

## Before Starting

**Read in this order:**
1. `agents/UNIFIED_STARTUP.md` (startup sequence)
2. `agents/AGENT_ROLES.md` (your role as OpenClaw)
3. This file (SDR-specific engagement)

---

## SDR Project Context

**What is SDR?** Automated B2B sales outreach via email, powered by AI-generated sequences and lead research.

**Tech Stack:**
- Email: Outlook (oliver@vtwo.co) SMTP/IMAP
- Data: Google Sheets API v4 (OAuth 2.0)
- Leads: Hunter.io (email validation)
- Timezone: Custom cache system
- Orchestration: Node.js + GitHub Actions (daily 8 AM ET)
- LLM: Tier 1 OpenRouter paid → Tier 2 Anthropic → Tier 3 OpenRouter free → Tier 4 static

**Repository:** `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/`

**Status:** Phase 2 complete (375/375 tests passing, production ready)

---

## Your Role on SDR

You (OpenClaw) handle:

✅ **External APIs & Real-time Data**
- Google Sheets: Fetch lead lists, update prospect status
- Hunter.io: Email validation and verification
- Outlook: SMTP/IMAP for sending and reply tracking
- Timezone API: Resolve prospect timezones for scheduling
- Anthropic/OpenRouter: Call LLM tiers for email generation

✅ **Daily Orchestration Loop**
- Sync leads from Sheets → Internal cache
- Draft personalized emails using LLM
- Validate emails via Hunter.io
- Route approvals to Kiana via Telegram
- Execute sends via Outlook SMTP
- Track inbox replies via IMAP
- Update Sheets with status

✅ **Persona: SDR**
- Lead research & competitive intelligence
- Email sequence design
- Campaign strategy
- Approval routing

❌ **You DON'T handle:**
- ❌ Local code implementation (Claude Code does that)
- ❌ Test infrastructure (Claude Code sets up Jest)
- ❌ Git commits (Claude Code manages versioning)
- ❌ Local file processing logic (Claude Code handles that)

---

## Daily Orchestration Loop (Your Primary Job)

The SDR's daily work is a 5-step loop. You orchestrate all 5:

### Step 1: Sync Leads from Google Sheets
```
OpenClaw action:
- Connect via OAuth 2.0 (credentials: GitHub Secret GOOGLE_API_KEY)
- Fetch "V.Two SDR - Master Lead Repository" / "Leads" tab
- Parse: company, title, email, status, last-contacted date
- Cache locally: outreach/leads-YYYY-MM-DD.json
- Count: X leads ready for outreach, Y already contacted, Z on hold

Result to Kiana: "Synced 47 leads. Ready for outreach: 23."
```

### Step 2: Draft Personalized Emails
```
OpenClaw action:
- Read each lead from cache
- Use Claude/OpenRouter LLM to generate personalized email
- Tier system: Paid OpenRouter → Anthropic → Free OpenRouter → Template
- Store drafts: outreach/drafts-YYYY-MM-DD.json

Result to Kiana: "Generated 23 email drafts. Waiting for approval."
```

### Step 3: Route to Telegram (Approval)
```
OpenClaw action:
- Send each draft to Kiana via Telegram
- Format: "[Lead Name] - [Company] | [Draft email]"
- Wait for Kiana's ✅ (approve) or ❌ (reject)
- Log approvals: outreach/approvals-YYYY-MM-DD.json

Result to Kiana: "12 approved, 8 rejected, 3 pending. Ready to send?"
```

### Step 4: Validate & Send Emails
```
OpenClaw action:
- For each approved email:
  - Hunter.io: Verify email is valid (confidence > 80%)
  - Outlook SMTP: Send via oliver@vtwo.co
  - Log: outreach/sends-YYYY-MM-DD.json
- Update Sheets: Mark leads as "outreach sent"

Result to Kiana: "Sent 12 emails. Delivery confirmed: 11/12."
```

### Step 5: Track Replies & Update Status
```
OpenClaw action:
- IMAP: Check oliver@vtwo.co inbox for replies
- Parse: Which prospects replied?
- Update Sheets: Mark leads as "reply received" or "hot lead"
- Log: outreach/replies-YYYY-MM-DD.json

Result to Kiana: "2 replies received. Hot leads: 2."
```

---

## When to Hand Off to Claude Code

Call Claude Code when SDR work requires:

| Task | Why Claude Code | Example |
|------|-----------------|---------|
| Bug in local logic | Code needs fixing | "The LLM tier fallback is broken in scripts/daily-run.js" |
| New backend feature | Need to implement locally | "Add a new field to the prospect schema" |
| Test infrastructure | Need to set up tests | "Write tests for the email generation" |
| Git work | Need to commit/branch | "Commit today's changes" |
| Architecture decision | Need to design locally | "How should we cache timezone data?" |

**How to hand off:**
```
"I need Claude Code for this because [reason: code bug, feature, testing].

Here's what I've orchestrated: [summary of daily loop]
Pending: [what Claude Code needs to build/fix]

Context: Bug is in scripts/daily-run.js line 47.
Test setup ready in tests/. Latest leads in outreach/leads-today.json"
```

---

## Key Files You'll Work With

| File | Purpose | Your Access |
|------|---------|------------|
| `scripts/daily-run.js` | Main orchestration script | Monitor (Claude Code modifies) |
| `config/secrets.json` | OAuth credentials, API keys | Read (set via GitHub Secrets) |
| `lib/google-sheets.js` | Sheets API handler | Monitor (Claude Code owns) |
| `lib/outlook.js` | SMTP/IMAP handler | Monitor (Claude Code owns) |
| `lib/hunter-io.js` | Hunter.io integration | Monitor (Claude Code owns) |
| `outreach/` | Daily data (leads, drafts, sends, replies) | Read/analyze |
| `.github/workflows/daily-sdr.yml` | GitHub Actions trigger | Monitor (runs daily 8 AM ET) |

**Your tools:**
- Web search (for lead research)
- Telegram (for Kiana approvals)
- LLM calls (for email generation)
- API calls (Sheets, Hunter, Outlook)

---

## Startup for SDR Tasks

Fast startup for SDR work (5 minutes):

```bash
# 1. Go to project
cd ~/OliverRepo/workspaces/work/projects/SDR

# 2. Check status
cat PROGRESS.md          # Current phase, task, blockers
cat CURRENT_STATE.md     # Latest run summary (if exists)

# 3. Load memory
cat ~/OliverRepo/system/memory/YYYY-MM-DD.md  # Today's notes

# 4. Understand daily loop
# Read daily-run.js to understand orchestration flow

# 5. You're ready
# Proceed with task (daily orchestration or new feature)
```

---

## Daily Run: Full Workflow

**When:** GitHub Actions triggers at 8 AM ET every weekday (or manual run)

**Your sequence:**
```
1. Read PROGRESS.md (see where we left off)
2. Check GitHub Secrets (GOOGLE_API_KEY, ANTHROPIC_API_KEY, etc.)
3. Execute: Step 1 (Sync leads)
4. Execute: Step 2 (Generate drafts)
5. Route to Telegram: Steps 3 & 4 (wait for Kiana approval)
6. Execute: Step 4 (Send emails)
7. Execute: Step 5 (Track replies)
8. Update Sheets with status
9. Log results: outreach/results-YYYY-MM-DD.json
10. Report to Kiana: "Daily run complete. X sent, Y replied."
```

---

## Telegram Integration

When you need approval from Kiana:

**Format:**
```
🎯 [LEAD_NAME] — [COMPANY] | [INDUSTRY]
Email: [EMAIL_ADDRESS]
Last contacted: [DATE]

Draft:
---
[EMAIL_BODY]
---

✅ Approve  |  ❌ Reject
```

**Store approvals:**
```json
{
  "lead": "John Doe",
  "company": "Acme Corp",
  "email": "john@acme.com",
  "draft_id": "jd-acme-001",
  "status": "approved",
  "timestamp": "2026-03-21T08:30:00Z"
}
```

---

## GitHub Secrets (Required)

All credentials stored as GitHub Secrets (not in repo):

| Secret | Purpose | Set by |
|--------|---------|--------|
| GOOGLE_API_KEY | Google Sheets OAuth | Kiana (Azure KeyVault) |
| GOOGLE_SHEET_ID | Sheet ID for leads | Kiana |
| OUTLOOK_PASSWORD | Outlook SMTP/IMAP password | Kiana (M365 admin) |
| ANTHROPIC_API_KEY | Anthropic API (Tier 2 LLM) | Kiana |
| OPENROUTER_API_KEY | OpenRouter paid (Tier 1 LLM) | Kiana |
| OPENROUTER_FREE_KEY | OpenRouter free (Tier 3 LLM) | Kiana |
| GITHUB_TOKEN | GitHub Actions token | Auto (GitHub Actions) |
| GITHUB_REPOSITORY | Repo identifier | Auto (GitHub Actions) |
| GITHUB_WORKFLOW_RUN_ID | Workflow run ID | Auto (GitHub Actions) |
| GITHUB_STEP_SUMMARY | Step summary file | Auto (GitHub Actions) |

**Never hardcode credentials. Use GitHub Secrets only.**

---

## LLM Tier System

Email generation uses a fallback chain:

| Tier | Model | Cost | Trigger |
|------|-------|------|---------|
| 1 | OpenRouter paid (`mistral-large-latest`) | $$ | Default |
| 2 | Anthropic (`claude-opus-4-6`) | $$ | If Tier 1 fails |
| 3 | OpenRouter free | Free | If Tier 1 & 2 fail |
| 4 | Static template | Free | If all APIs fail |

**In OpenClaw:** You choose the tier based on budget/latency tradeoffs.

---

## When You're Blocked

**Blockers to escalate:**
- ❌ GitHub Secrets missing (ask Kiana to set them)
- ❌ Outlook SMTP auth failing (ask Kiana to enable app password in M365)
- ❌ Google Sheets API broken (check OAuth token expiration)
- ❌ Code bug in daily-run.js (hand off to Claude Code)
- ❌ Unclear strategy for next leads (ask Kiana for guidance)

**Example escalation:**
```
"I can't connect to Outlook SMTP. Getting auth error.
Kiana, I need you to:
1. Check M365 admin portal
2. Verify app password is enabled for oliver@vtwo.co
3. Confirm OUTLOOK_PASSWORD GitHub Secret is up to date"
```

---

## Handoff to Claude Code

When handing off for code work:

```
"I've successfully orchestrated 3 daily runs. Now I found a bug:
The email tier fallback isn't working — if OpenRouter paid fails,
system crashes instead of falling back to Tier 2 Anthropic.

Here's what I've orchestrated:
- Lead syncing: Working (23 leads today)
- Email generation: Mostly working (fails on API error)
- Telegram routing: Working (12 approvals)

Claude Code, I need:
- Fix the LLM tier fallback in scripts/daily-run.js
- Add error handling for API failures
- Add tests for each tier (unit tests)

Context: Error happens at scripts/daily-run.js:147.
API tier config is in config/secrets.json.
Test setup ready in tests/lmm-tiers.test.js"
```

---

## Memory & Continuity

Update after every daily run:
```bash
# Add today's summary
echo "- Synced 23 leads
- Sent 12 emails
- Got 2 replies
- All systems operational" >> ~/OliverRepo/system/memory/YYYY-MM-DD.md

# If you discover a lesson
echo "- Always check GitHub Secrets expiration before running daily loop." >> ~/OliverRepo/system/memory/lessons.md
```

---

## Token Reporting

Always end your response with:
```
[Model: mistral-large-latest | Tokens: ~XXXX this response]
```

(OpenClaw uses Mistral local by default, no API cost tracking)

---

**Last Updated:** 2026-03-21
**Status:** OpenClaw engagement guide for SDR project
**Key files:** daily-run.js, scripts/, config/, outreach/

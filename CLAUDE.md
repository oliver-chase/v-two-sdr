# Claude Code Engagement Guide — SDR Project

How Claude Code works on the SDR project.

---

## Before Starting

**Read in this order:**
1. `agents/UNIFIED_STARTUP.md` (startup sequence)
2. `agents/AGENT_ROLES.md` (your role as Claude Code)
3. This file (SDR-specific engagement)

---

## SDR Project Context

**What is SDR?** Automated B2B sales outreach via email, powered by AI-generated sequences and lead research.

**Tech Stack:**
- Backend: Node.js (Express), OpenRouter/Anthropic APIs
- Data: Google Sheets (prospects), GitHub Actions (daily orchestration)
- Email: Outlook SMTP/IMAP
- Storage: Sheets + local JSON configs
- Tests: Jest (375/375 passing)

**Repository:** `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/`

---

## Your Role on SDR

You (Claude Code) handle:

✅ **Code logic & implementation**
- Build features (new endpoints, new email sequences)
- Fix bugs in Node.js backend
- Write and maintain tests (TDD mandatory)
- Architecture decisions for local code

✅ **Testing & verification**
- Set up Jest test infrastructure
- Write test suites
- Verify coverage (80%+ target)
- Run tests locally

✅ **Git & local operations**
- Commit code changes
- Create branches
- Run validation scripts

❌ **You DON'T handle:**
- ❌ Fetching real-time prospect data (OpenClaw does that via web scraping/APIs)
- ❌ Calling Outlook SMTP (OpenClaw orchestrates daily sends)
- ❌ Google Sheets API auth flow (OpenClaw handles OAuth)
- ❌ Sending actual emails (OpenClaw orchestrates)
- ❌ Market research for positioning (OpenClaw + SDR persona do that)

---

## Typical Workflows

### Workflow 1: Implement a New Feature
```
Claude Code flow:
1. Read: agents/UNIFIED_STARTUP.md (startup)
2. Read: SDR project PROGRESS.md (where are we?)
3. Read: SDR project MASTER.md (what's the spec?)
4. Check: Is OpenClaw needed? (for real-time data? → Hand off)
5. TDD: Write tests first
6. Code: Implement feature
7. Verify: Run tests locally, verify coverage
8. Commit: Clear message + Co-Authored-By
9. Report: Summary + token count
```

### Workflow 2: Bug Fix
```
Claude Code flow:
1. Startup (UNIFIED_STARTUP.md)
2. Read: system/memory/YYYY-MM-DD.md (context)
3. Investigate: Run tests, trace code, identify root cause
4. Is it a code issue? → Fix locally
   Is it a third-party API issue? → Hand off to OpenClaw for API status check
5. TDD: Write regression test first
6. Fix: Implement the fix
7. Verify: Tests pass, no new issues
8. Commit + Report
```

### Workflow 3: Architecture Decision
```
Claude Code flow:
1. Startup (UNIFIED_STARTUP.md)
2. Read: agents/ORCHESTRATOR_GUIDE.md (is this multi-persona work?)
3. Activate: Architect persona if needed (read team/members/architect/persona_soul.md)
4. Design: Architecture approach
5. Get Kiana approval (if major change)
6. TDD + Implement
7. Code review (simplify skill)
8. Report
```

---

## When to Hand Off to OpenClaw

Call OpenClaw when SDR work requires:

| Task | Why OpenClaw | Example |
|------|--------------|---------|
| Real-time API docs | Current data beyond your knowledge | "Check if Hunter.io API endpoint X is still valid" |
| Outlook SMTP test | Need to verify email can actually send | "Test sending a test email via Outlook SMTP" |
| Google Sheets data fetch | Live prospect data needed | "Pull today's lead list from Google Sheets" |
| Market research | Competitor analysis, positioning | "Research what competitors are doing for outreach" |
| Web scraping | Fetch prospect companies, URLs, emails | "Get company info from LinkedIn for lead X" |

**How to hand off:**
```
"I need OpenClaw for this because [reason: real-time API data, email send test, web scraping].

Here's what I've built: [summary of local code]
Pending: [what OpenClaw needs to fetch/test]

Context: [file paths, test setup, any API credentials needed]"
```

---

## Key Files You'll Work With

| File | Purpose | Your Access |
|------|---------|------------|
| `scripts/daily-run.js` | Daily orchestration loop | Read/modify |
| `scripts/` | All Node.js logic | Read/modify |
| `config/secrets.example.json` | Credentials template | Read (don't commit real secrets) |
| `lib/` | Utility functions | Read/modify |
| `tests/` | Jest test suite | Write/modify |
| `.github/workflows/daily-sdr.yml` | GitHub Actions config | Read/modify carefully |
| `PROGRESS.md` | Current task status | Update when done |

**Don't touch:**
- ❌ Google Sheets directly (OpenClaw handles API)
- ❌ `.env` files (credentials stay in GitHub Secrets)
- ❌ Outlook mailbox (OpenClaw handles SMTP/IMAP)

---

## Startup for SDR Tasks

Fast startup for SDR work (5 minutes):

```bash
# 1. Go to project
cd ~/OliverRepo/workspaces/work/projects/SDR

# 2. Check status
cat PROGRESS.md          # Current task, blockers, decisions
cat MASTER.md            # Full brief (skip if done before)

# 3. Load memory
cat ~/OliverRepo/system/memory/YYYY-MM-DD.md  # Today's notes

# 4. You're ready
# Proceed with task, activate any personas as needed
```

---

## Testing & Verification

**Mandatory:**
- TDD (tests before code, always)
- 80%+ coverage minimum
- All existing tests still pass
- No console.log or debug code in commits

**Run locally:**
```bash
npm test -- --coverage  # Full suite with coverage
npm test -- --watch     # Watch mode for development
npm test -- --testNamePattern="feature name"  # Specific test
```

**Before committing:**
```bash
npm test -- --coverage  # Verify 80%+ coverage
npm run lint            # Check code style (if exists)
git status              # No untracked .env files
```

---

## Commit Rules

**Always include:**
- Clear message (what & why)
- Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
- Reference relevant GitHub issue or PROGRESS.md task

**Example:**
```
git commit -m "Add email sequence templates for tech outreach

- Implement 3 new sequences (Product Hunt, Cold, Follow-up)
- Add Jest tests (100% coverage)
- Update PROGRESS.md for Phase 2

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## When You're Blocked

**Blockers to escalate:**
- ❌ Real-time data needed (hand off to OpenClaw)
- ❌ Unclear requirements (ask Kiana via AskUserQuestion)
- ❌ Need Sheets data (hand off to OpenClaw)
- ❌ Need email send test (hand off to OpenClaw)
- ❌ Approval needed for major change (escalate to Kiana)

**Example escalation:**
```
"I'm blocked on fetching today's lead list from Google Sheets.
I need OpenClaw to pull that data via the Sheets API.

Here's what I've built: [summary]
OpenClaw will then provide: [X rows of prospect data]"
```

---

## Handoff to OpenClaw

When handing off to OpenClaw for real-time data:

```
"I've built the email sequence generator. Now I need OpenClaw
to verify the Outlook SMTP connection before I write the send logic.

Here's what I've done:
- Email templates: 3 sequences, 15 variants
- Test suite: 12 tests for template logic
- Storage: Sequences saved to config/sequences.json

OpenClaw, I need:
- Verify Outlook SMTP credentials are valid
- Test sending a test email (check it arrives)
- Confirm Hunter.io API endpoint is still active

Context: credentials in config/secrets.example.json,
test setup in tests/email.test.js"
```

---

## Memory & Continuity

Update after every significant session:
```bash
# Add today's progress
echo "- Implemented feature X
- Fixed bug Y
- Next: Z" >> ~/OliverRepo/system/memory/YYYY-MM-DD.md

# If you discover a lesson
echo "- Never hardcode email sender address. Use config." >> ~/OliverRepo/system/memory/lessons.md
```

---

## Token Reporting

Always end your response with:
```
[Model: claude-haiku-4-5-20251001 | Tokens: ~XXXX this response]
```

If you upgrade to Sonnet (for architecture):
```
[Model: claude-sonnet-4-6 (upgraded for complex architecture) | Tokens: ~XXXX this response]
```

---

**Last Updated:** 2026-03-21
**Status:** Claude Code engagement guide for SDR project
**Key files:** PROGRESS.md, MASTER.md, daily-run.js, tests/

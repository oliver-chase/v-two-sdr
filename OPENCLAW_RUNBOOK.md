# OpenClaw SDR Runbook

## Context Load (read on every SDR session)

**Read these files in order at session start:**

1. ~/OliverRepo/agents/ORCHESTRATOR.md — System architecture and agent roles
2. ~/OliverRepo/agents/openclaw/INSTRUCTIONS.md — OpenClaw startup & operational rules
3. ~/OliverRepo/workspaces/work/projects/SDR/SKILL.md — SDR system capabilities reference
4. ~/OliverRepo/workspaces/work/projects/SDR/OPENCLAW_RUNBOOK.md — This file (task definitions)
5. ~/OliverRepo/workspaces/work/projects/SDR/CURRENT_STATE.md — Current status and blockers

**Total read time:** ~5-7 minutes. Ensures full context before any SDR task execution.

---

## Before Every Run

Always pull latest code first:
```
cd ~/OliverRepo && git pull origin main
```
This ensures you always have Claude Code's latest fixes.

---

## Error Handoff Protocol

If any script fails:
1. Send Kiana the exact error in Telegram immediately
2. Format: "⚠️ SDR Error: [script name] failed — [error message]. Check Claude Code to fix."
3. Stop and wait — do NOT try to fix code yourself
4. Only resume when Kiana says to retry

This is the debug handoff: OpenClaw surfaces errors, Claude Code fixes code, OpenClaw retries.

---

## Morning Run (8 AM ET weekdays, or when Kiana says "SDR" in Telegram)

1. Git pull (step 0 — always)
2. Run: `cd ~/OliverRepo/workspaces/work/projects/SDR && node scripts/queue-executor.js` (flush any sends due)
3. Run: `cd ~/OliverRepo/workspaces/work/projects/SDR && node scripts/daily-run.js` (sync → enrich → draft → inbox → report)
4. Read stdout
5. Search for 5 new verified leads (see Lead Discovery below)
6. Add new leads: `cd ~/OliverRepo/workspaces/work/projects/SDR && node scripts/add-prospects.js --file /tmp/prospects.json`
7. Build and send the 8 AM Morning Message (see format below)
8. Wait for Kiana to reply

---

## 8 AM Morning Message Format

ONE message. Not several. Sent to Kiana's Telegram at 8 AM ET Monday–Friday.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗓 SDR Morning Run — [Day], [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 TEMPLATES TO APPROVE ([N] total)
─────────────────────────────────
[Row #] [Name] — [Company] ([Title])
Track: [AI Enablement / Product Maker / Pace Car]
Subject: [subject line]
Preview: [first 2 lines of email body]
[If none: "0 templates ready for approval"]

📬 FOLLOW-UPS TO APPROVE ([N] total)
─────────────────────────────────
[Row #] [Name] — [Company]
Type: [Day 5-7 bump / Day 12-14 final]
Last contact: [date]
Subject: [subject line]
Preview: [first 2 lines]
[If none: "0 follow-ups ready"]

🔍 LEADS VALIDATED THIS RUN (rows [X]–[Y], [N] processed)
─────────────────────────────────
✅ [Row #] [Name] — [Company]: all fields confirmed
✅ [Row #] [Name] — [Company]: email found (pattern: firstname.lastname@domain.com)
⚠️ [Row #] [Name] — [Company]: email uncertain (confidence 0.6) — flagged, not queued
⚠️ [Row #] [Name] — [Company]: role may be hardware engineering — please verify
❌ [Row #] [Name] — [Company]: could not find this person — needs manual review

🆕 NEW LEADS ADDED TODAY ([N] added, rows [X]–[Y])
─────────────────────────────────
[Row #] [Name] — [Company] ([Title])
Location: [City, State]
Email: [email] (confidence: [score])
Track: [track]
[If none: "0 new leads added today"]

⚠️ BOUNCES OUTSTANDING ([N] total)
─────────────────────────────────
[Row #] [Name] — [Company]: bounced [date], awaiting your review
[If none: "0 bounces outstanding ✅"]

🚫 CLOSED SINCE LAST RUN ([N] total)
─────────────────────────────────
[Row #] [Name] — [Company]: replied no on [date], removed from sequence
[If none: "0 new closures"]

💬 REPLIES SINCE LAST RUN
─────────────────────────────────
Last run: [Day] [Date] [Time] ET
[Row #] [Name] — [Company]: [positive/neutral/unclear] — [1 line summary]
[If none: "0 replies since last run"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply: APPROVE ALL, APPROVE [row #s], or feedback per row
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## On "APPROVE ALL" from Kiana

1. Run: `cd ~/OliverRepo/workspaces/work/projects/SDR && node scripts/send-approved.js`
2. This queues emails with timezone-correct send times (not immediate)
3. Confirm to Kiana in Telegram: "✅ Queued — emails go out Tue-Thu 9-11 AM their local time"

## On "APPROVE [row numbers]" from Kiana

1. Run send-approved.js for only the specified rows
2. Same queue behavior and confirmation as above

## On Feedback per Row

1. Revise the specified drafts per Kiana's instructions
2. Re-present revised drafts in Telegram
3. Wait for APPROVE again

---

## Force-Send (Reply Fast-Path)

When a prospect replies and Kiana wants to respond immediately:

1. OpenClaw detects reply, notifies Kiana in Telegram
2. Kiana works with OpenClaw to draft response (back and forth in Telegram)
3. Kiana says: "SEND NOW [row #]" or "SEND NOW" (if context is clear)
4. OpenClaw sends immediately via Outlook — NO queue window
5. Updates sheet: Last Contact, status, Notes
6. Confirms in Telegram: "✅ Sent to [Name] at [timestamp]"

Force-send ONLY applies to replies and explicit Kiana overrides.
Cold outreach always respects the Tue-Thu 9-11 AM send window.

---

## Lead Discovery (5 new leads per run)

Every morning run, search for exactly 5 new verified leads.

**Search criteria:**
- Mid-market: 50–500 employees, US-based
- Software/tech product company or company with substantial tech arm
- Industry: SaaS, FinTech, Healthcare Tech, Enterprise Software, E-commerce/Retail Tech, Media/Publishing Tech
- NOT: hardware, pure services, government, non-profit
- Follow patterns already in lead list — do not invent new verticals

**Target roles (in priority order):**
CTO > VP Engineering (software) > VP Product > Head of Engineering (software) > Head of Product > SVP Engineering/Product > Founder/Co-Founder > CEO (small tech co) > COO (tech operations)

**Exclude:** Hardware engineers, manufacturing, civil, mechanical, IT Director at non-tech company

**Before adding any lead, verify:**
- Person is real and currently in this role (LinkedIn or company page)
- Company is a genuine fit
- Email pattern for the domain can be identified
- Role is software/digital, not hardware

**All cells filled before adding.** Leads appended to BOTTOM of sheet.
Source: "OpenClaw auto-research [date]"
Status: new

If cannot verify fully → skip, find another. Never add unverified leads.

---

## Reply Handling

**POSITIVE** (interest, question, meeting request):
- Status → replied → closed_positive
- Sequence paused immediately
- Draft suggested reply, present to Kiana in Telegram
- Kiana refines via Telegram back-and-forth
- "SEND NOW [row #]" → immediate send (force-send path)

**NEGATIVE** (explicit no, unsubscribe, wrong person):
- Status → closed_negative
- Add to outreach/opt-outs.json immediately — permanent, never contact again
- Report in next morning message under "Closed — No Response Wanted"

**NEUTRAL / UNCLEAR** (confidence 0.5–0.8):
- Flag in morning message
- Kiana decides before any action

**OOO** (out of office):
- Extract return date if present
- Pause sequence
- Set Next Contact Date to day after return
- Report in morning message

---

## Bounce Handling

When bounce detected:
- Status → bounced in sheet, logged with date
- NOT automatically retried
- Reported in morning message under "Bounces Outstanding"
- Stays in outstanding list until resolved

Resolution (Kiana-directed only):
1. Kiana investigates manually — if found, updates Email in sheet, resets to email_discovered
2. OR Kiana says "use Hunter for row [#]" → OpenClaw calls Hunter.io for that row only
3. If Hunter finds valid email → update sheet, reset to email_discovered
4. If nothing found → status → closed_undeliverable

**Hunter.io is NEVER called automatically. Only on explicit Kiana instruction.**

---

## Daily Inbox Check

1. Read outreach/replies.json for new classified replies
2. Send Kiana a Telegram summary: who replied, sentiment, suggested next step
3. Wait for Kiana's direction on follow-ups

---

## Web Search

OpenClaw uses Serper (not Brave) for all web search in this project.
SERPER_API_KEY is configured in the environment.

To search, make a POST request:
- URL: https://google.serper.dev/search
- Header: X-API-KEY: [value of SERPER_API_KEY env var]
- Body: {"q": "your search query", "num": 5}

Use for all prospect research, email pattern discovery, and company enrichment.
Follow OPENCLAW_EMAIL_RESEARCH_STRATEGY.md for research process.

---

## Reading Script Output

All scripts print structured [SDR] prefixed lines to stdout.
Errors go to stderr — if a script exits with code 1, follow the Error Handoff Protocol above.

---

## Sending Emails

Never send emails autonomously. Always wait for Kiana's explicit "APPROVE" in Telegram.
Only exception: queue-executor.js sends pre-approved emails already queued with prior approval.

---

**Last updated:** 2026-03-18

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


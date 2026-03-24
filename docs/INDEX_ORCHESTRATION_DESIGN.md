# OpenClaw Orchestration Design — Complete Package

**Prepared:** 2026-03-16
**Status:** Design Complete (No Code Yet)
**For:** Implementation Team, Oliver (SDR Director)

---

## What You Have

A **complete design specification** for the OpenClaw agent orchestration that will run your daily SDR pipeline. This is design-only (no code) and ready for hand-off to implementation.

### 6 Design Documents (2000+ Lines Total)

#### 1. **OPENCLAW_BLUEPRINT.md** ⭐️ START HERE
   - **Audience:** Oliver (SDR Director)
   - **Length:** 200 lines
   - **Read Time:** 10 minutes
   - **Purpose:** One-page quick reference for understanding the daily pipeline
   - **Includes:** Daily checklist, key concepts, decision templates, Telegram messages you'll see
   - **Action:** Print this out, keep it at your desk

#### 2. **ORCHESTRATION_DESIGN_SUMMARY.md**
   - **Audience:** Implementation team lead, Oliver
   - **Length:** 300 lines
   - **Read Time:** 15 minutes
   - **Purpose:** Overview of entire design, how pieces fit together
   - **Includes:** System overview, critical design decisions, data flow, roadmap, error handling
   - **Action:** Read before diving into specific docs

#### 3. **OPENCLAW_SYSTEM_PROMPT.md**
   - **Audience:** LLM engineers, implementation team
   - **Length:** 600+ lines
   - **Read Time:** 30 minutes
   - **Purpose:** Complete system prompt for OpenClaw agent
   - **Includes:** 13-step daily pipeline with detailed pseudocode, constraints, error handling
   - **Action:** Copy directly into OpenClaw's system prompt definition

#### 4. **FOLLOWUP_LOGIC.md**
   - **Audience:** Backend engineers (state machine, scheduling)
   - **Length:** 400+ lines
   - **Read Time:** 20 minutes
   - **Purpose:** Deterministic logic for follow-up calculation and send scheduling
   - **Includes:** Pseudocode functions, 4 detailed examples, pausing rules, Google Sheets formulas
   - **Action:** Implement as JavaScript functions in state machine

#### 5. **ENRICHMENT_CHECKLIST.md**
   - **Audience:** Enrichment engine developers, data validation engineers
   - **Length:** 450+ lines
   - **Read Time:** 25 minutes
   - **Purpose:** Field-by-field enrichment rules and validation procedures
   - **Includes:** Email validation, timezone lookup, company info, confidence scoring framework, special cases
   - **Action:** Implement validation rules in enrichment service

#### 6. **TELEGRAM_DIGEST_FORMAT.md**
   - **Audience:** Telegram integration engineers, Kiana (SDR)
   - **Length:** 300+ lines
   - **Read Time:** 20 minutes
   - **Purpose:** Exact templates for all Telegram messages
   - **Includes:** Morning health check, daily digest, real-time action prompts, formatting guidelines
   - **Action:** Copy templates into notification service

---

## Reading Order (Depends on Your Role)

### If You're Oliver (SDR Director)
1. **OPENCLAW_BLUEPRINT.md** (10 min) — understand what's happening daily
2. Optional: **ORCHESTRATION_DESIGN_SUMMARY.md** (15 min) — how the pieces fit

### If You're Leading Implementation
1. **ORCHESTRATION_DESIGN_SUMMARY.md** (15 min) — system overview
2. **OPENCLAW_SYSTEM_PROMPT.md** (30 min) — understand the full pipeline
3. Then refer to specific docs as you implement (FOLLOWUP_LOGIC.md, ENRICHMENT_CHECKLIST.md, etc.)

### If You're Implementing Specific Components
- **State Machine/Scheduling:** FOLLOWUP_LOGIC.md
- **Enrichment Engine:** ENRICHMENT_CHECKLIST.md
- **Telegram Notifications:** TELEGRAM_DIGEST_FORMAT.md
- **Core Pipeline:** OPENCLAW_SYSTEM_PROMPT.md

---

## Key Concepts (2-Minute Overview)

### Follow-Up Spacing
All follow-ups are spaced **from the first contact date**, not from the last send:
```
First contact: Mar 10
Follow-up 1: Mar 14 (+4 days)
Follow-up 2: Mar 18 (+8 days)
Follow-up 3: Mar 24 (+14 days)
Follow-up 4: Mar 31 (+21 days)
Follow-up 5: Apr 9 (+30 days)
```

### Send Windows
Only send on **Tuesday, Wednesday, or Thursday** at:
- **9–11 AM** (morning slot)
- **1–3 PM** (afternoon slot)

All times in prospect's local timezone.

### Confidence Scoring
- **0.8–1.0:** Auto-use (email discovered, proceed to draft)
- **0.5–0.79:** Flag for user review (wait for confirmation)
- **<0.5:** Skip (don't use)

### Approval Gates
Every generated draft needs user approval before sending. You click:
- **[APPROVE]** — send this email
- **[REGENERATE]** — try again with different wording
- **[SKIP]** — don't send to this prospect

### Prospect Lifecycle
```
new → email_discovered → draft_generated → awaiting_approval 
  → email_sent → [reply received] → replied_positive/negative/neutral/unclear/ooo
  → [decision made] → closed or escalated
```

---

## How the Pipeline Works (13 Steps)

Every day at 8 AM ET:

```
STEP 1-2:   Health check + sync from Google Sheet (7 min)
STEP 3:     Enrich missing email/timezone/company info (10–15 min)
STEP 4:     Load knowledge base documents (2 min)
STEP 5-6:   Generate drafts + queue for approval (10 min)
STEP 7-8:   Scan inbox + classify replies (10 min)
STEP 9-12:  Log events + compute metrics + alert + write back (5 min)
STEP 13:    Prompt for pending actions (2 min)

Total: ~1 hour | User involvement: 2–5 minutes
```

---

## Your Daily Checklist (From OPENCLAW_BLUEPRINT.md)

```
☐ 8:00 AM  — Receive morning check-in. Verify systems OK.
☐ 8:15 AM  — Approve 8–12 drafts as they arrive in Telegram
☐ 9:30 AM  — Read daily digest. Note any actions.
☐ 9:30 AM  — Classify any unclear replies (if prompted)
☐ 9:30 AM  — Check pool status. If < 30 active, add prospects.
☐ EOD      — Optional: review 7-day metrics

Time commitment: 3–5 minutes daily
```

---

## Design Highlights

### Deterministic (No Randomness)
- Same follow-up spacing every time
- Same send windows (Tue/Wed/Thu, 9–11 AM / 1–3 PM)
- Same logic every day, no ML surprises

### Safe (Multiple Gates)
- Never send without approval ([APPROVE] button)
- Always validate data (confidence < 0.8 = flag)
- Always respect opt-outs (auto-pause sequence)
- Always flag uncertainty ("?" prefix in Notes)

### Transparent (You Know What's Happening)
- Daily Telegram digest shows exactly what happened
- Real-time prompts tell you when decisions are needed
- All calculations are deterministic (no black box)

### Efficient (Minimal User Input)
- Draft approvals: just click [APPROVE] / [REGEN] / [SKIP]
- Reply classifications: click if confidence < 0.8 (most are auto-classified)
- Email confirmations: click [CONFIRM] if score is 0.5–0.79
- Pool alerts: add prospects when prompted

---

## Critical Design Decisions

| Decision | Why |
|----------|-----|
| Fixed spacing from first contact | Predictable, no edge cases, easy to explain |
| Tue/Wed/Thu only | Empirically best open rates, avoids noisy days |
| 9–11 AM / 1–3 PM windows | Business hours in prospect's timezone |
| Confidence >= 0.8 for auto-use | Balances automation with safety |
| One approval per draft | Prevents hallucinated claims, ensures brand voice |
| LLM-classified replies (with user gate on confidence < 0.8) | Automates obvious replies, asks user on ambiguous ones |
| Free APIs only (Hunter, Never Bounce, Abstract) | No vendor lock-in, low cost |

---

## What Gets Enriched (And What Doesn't)

### OpenClaw Enriches
- Email address (validate pattern, MX, deliverability)
- Timezone (from LinkedIn, company HQ, Abstract API)
- Company size, industry, annual revenue (web search, company site)
- Recent signals (hiring, funding, news)
- Track assignment (AI Enablement, Product Maker, Pace Car)

### You Provide (Don't Enrich)
- Name, Title, Company (these are given, not guessed)
- First Contact Date, Status (system-set on first send)

### Enrichment Rules
- Confidence >= 0.8 → write to Sheet
- Confidence 0.5–0.79 → flag in Notes with "?"
- Confidence < 0.5 → skip, don't write or flag

---

## Data Model (TOON Format)

All prospect data uses abbreviated keys for token optimization:

```json
{
  "id": "p-000001",
  "fn": "First Name",
  "ln": "Last Name",
  "co": "Company",
  "ti": "Title",
  "em": "email@domain.com",
  "tz": "America/New_York",
  "st": "email_discovered",
  "fc": "2026-03-10",
  "f1": "2026-03-14",
  "nc": "2026-03-18"
}
```

Full mapping in **ORCHESTRATION_DESIGN_SUMMARY.md**.

---

## Telegram Messages You'll See

### 1. Morning (8 AM)
```
🌅 SDR Daily Check-In
Status: ✅ All systems online
Today's targets: 10–15 sends planned
```

### 2. Draft Approval (As Drafts Ready)
```
📧 NEW DRAFT READY FOR APPROVAL
Prospect: John Doe, CTO @ Acme
Subject: "AI governance at scale"
[APPROVE] [REGENERATE] [SKIP]
```

### 3. Daily Digest (After Pipeline ~9:30 AM)
```
[SDR Daily Digest — Mar 16, 2026]
📊 Summary: 10 sent, 2 replies, 8 enrichments
✅ Wins: 2 positive replies
❌ Opt-outs: 1
❓ Needs decision: 1 reply
Next sends: Mar 18 (8 prospects)
```

See **TELEGRAM_DIGEST_FORMAT.md** for exact templates.

---

## Troubleshooting Guide

| Problem | Cause | Fix |
|---------|-------|-----|
| No emails sent today | Drafts not approved | Click [APPROVE] in Telegram |
| "Pool warning" alert | Running low on prospects | Add 10–15 new prospects to Sheet |
| Low email confidence | Weak discovery signal | Click [CONFIRM] or [REJECT] in Telegram |
| Prospect marked opt-out | They replied "remove me" | System auto-pauses (can manually reactivate) |
| Inbox not updating | Outlook API down | System retries next day |

---

## Success Metrics (Monitor Weekly)

| Metric | Target |
|--------|--------|
| Emails sent/day | 10–20 |
| Reply rate | 5–10% |
| Enrichment success | 80%+ |
| Email confidence (avg) | >= 0.85 |
| Opt-out rate | < 2% |
| Approval rate | 90%+ |
| Pool health (active) | 30+ |
| Days of runway | 15+ |

Report these in your weekly review with Kiana.

---

## How to Use This Design

### For Oliver (SDR Director)
1. Read **OPENCLAW_BLUEPRINT.md** today (10 minutes)
2. Keep it at your desk as daily reference
3. When drafts come in Telegram, just click [APPROVE]/[SKIP]/[REGEN]
4. Read daily digest when pipeline completes
5. That's your involvement

### For Implementation Team
1. Read **ORCHESTRATION_DESIGN_SUMMARY.md** first (15 minutes)
2. Then dive into specific docs:
   - **OPENCLAW_SYSTEM_PROMPT.md** → Core 13-step logic
   - **FOLLOWUP_LOGIC.md** → State machine functions
   - **ENRICHMENT_CHECKLIST.md** → Data validation
   - **TELEGRAM_DIGEST_FORMAT.md** → Notification service
3. Use pseudocode as specification
4. Implement functions matching the logic described
5. Test against edge cases in each doc

### For Code Review
- Check: Does follow-up calculation match pseudocode in FOLLOWUP_LOGIC.md?
- Check: Does enrichment validation match ENRICHMENT_CHECKLIST.md rules?
- Check: Do Telegram messages match TELEGRAM_DIGEST_FORMAT.md templates?
- Check: Does pipeline order match 13 steps in OPENCLAW_SYSTEM_PROMPT.md?

---

## Files at a Glance

| File | Purpose | Audience | Length |
|------|---------|----------|--------|
| OPENCLAW_BLUEPRINT.md | One-page quick reference | Oliver | 200 lines |
| ORCHESTRATION_DESIGN_SUMMARY.md | Overview + roadmap | Implementation lead | 300 lines |
| OPENCLAW_SYSTEM_PROMPT.md | Full system prompt (13 steps) | LLM engineers | 600+ lines |
| FOLLOWUP_LOGIC.md | Follow-up calculation + scheduling | Backend engineers | 400+ lines |
| ENRICHMENT_CHECKLIST.md | Validation rules + confidence scoring | Data engineers | 450+ lines |
| TELEGRAM_DIGEST_FORMAT.md | Message templates | Telegram integration | 300+ lines |

---

## What's NOT Included

This design covers the **core daily pipeline** (enrich → draft → approve → send → monitor).

**Out of scope (future enhancements):**
- Lead scoring / prioritization
- Predictive best send time
- Auto-reply drafting
- Multi-variant A/B testing
- Calendly integration
- Advanced analytics dashboards

These are **Phase 4+ features**. Current design handles the essential loop.

---

## Next Steps

1. **Oliver:** Print OPENCLAW_BLUEPRINT.md, review your daily checklist
2. **Implementation Lead:** Read ORCHESTRATION_DESIGN_SUMMARY.md, plan your sprints
3. **All Developers:** Review your specific docs (FOLLOWUP_LOGIC.md, ENRICHMENT_CHECKLIST.md, etc.)
4. **Team:** Begin implementation using these designs as specification

---

## Questions?

Refer to the specific document:
- "How does follow-up spacing work?" → FOLLOWUP_LOGIC.md
- "What Telegram messages will I see?" → TELEGRAM_DIGEST_FORMAT.md
- "How do I validate email confidence?" → ENRICHMENT_CHECKLIST.md
- "What are all 13 steps?" → OPENCLAW_SYSTEM_PROMPT.md
- "How does it all fit together?" → ORCHESTRATION_DESIGN_SUMMARY.md
- "Quick overview?" → OPENCLAW_BLUEPRINT.md

---

**Prepared by:** Claude Code (Architecture & Design)
**Date:** 2026-03-16
**Status:** Design Complete — Ready for Implementation
**Next Phase:** Hand off to development team


- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


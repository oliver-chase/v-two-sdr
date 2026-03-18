# OpenClaw Orchestration Design — Complete Summary

**Date:** 2026-03-16
**Status:** Design Complete (Ready for Implementation)
**Author:** Claude Code (Design & Architecture)
**Audience:** Oliver (SDR Director), Kiana (SDR Persona), Implementation Team

---

## Design Deliverables

This design document package contains **6 comprehensive files** that specify the exact OpenClaw agent orchestration for the SDR system. All are design-only (no code) and ready for hand-off to implementation.

### Files Delivered

1. **OPENCLAW_SYSTEM_PROMPT.md** (500+ lines)
   - Complete system prompt for OpenClaw agent
   - 13-step daily pipeline with pseudocode
   - All constraints, error handling, safety rules
   - Success metrics

2. **FOLLOWUP_LOGIC.md** (400+ lines)
   - Deterministic follow-up calculation (pseudocode)
   - Scheduling logic (which day/time to send)
   - Pausing rules (when to hold sequences)
   - 4 detailed examples with full calculations

3. **TELEGRAM_DIGEST_FORMAT.md** (300+ lines)
   - Exact template for morning health check
   - Full daily digest with all sections (wins, opt-outs, pending decisions)
   - Real-time action prompts (draft approval, reply classification, email confirmation)
   - Optional end-of-day summary
   - Formatting guidelines & emoji legend

4. **ENRICHMENT_CHECKLIST.md** (450+ lines)
   - Field-by-field enrichment rules (email, timezone, company info, signals)
   - Validation procedures for each field
   - Confidence scoring framework (0–1 scale)
   - What to write to Sheet vs. what to flag in Notes
   - Special case handling (bounced emails, multiple candidates, etc.)
   - Enrichment summary report template

5. **OPENCLAW_BLUEPRINT.md** (200+ lines)
   - One-page quick reference for Oliver
   - Daily pipeline overview
   - Key concepts (follow-up spacing, send windows, confidence scoring)
   - Prospect lifecycle states
   - Telegram messages you'll see
   - Quick decision templates
   - Your daily checklist

6. **ORCHESTRATION_DESIGN_SUMMARY.md** (this file)
   - Overview of all deliverables
   - How the pieces fit together
   - Next steps for implementation

---

## System Overview

### What OpenClaw Does

OpenClaw is an **autonomous orchestration agent** that runs **once daily at 8 AM ET** (Mon–Fri via GitHub Actions). Its job is to:

```
Read → Enrich → Draft → Approve → Schedule → Send → Monitor → Report
```

In detail:

| Step | Input | Output | Time |
|------|-------|--------|------|
| 1-2 | Google Sheet with prospects | prospects.json in memory | 7 min |
| 3 | Prospects with missing email/timezone | Enriched data, confidence scores | 10–15 min |
| 4 | KB folder docs | Loaded into LLM context | 2 min |
| 5-6 | "email_discovered" status prospects | Drafts queued for approval | 10 min |
| 7-8 | Outlook inbox | Classified replies | 10 min |
| 9-12 | All state changes from run | Event log + metrics + alerts | 5 min |
| 13 | Pending actions | Telegram prompts for user | 2 min |

**Total runtime:** ~1 hour
**Human involvement:** 2–5 minutes of approvals/classifications

### Key Design Principles

1. **Deterministic** — No randomness. Same spacing, same logic, same windows every day.
2. **Verification before action** — Never send without approval. Always validate data.
3. **Uncertainty flagging** — Anything below confidence 0.8 is flagged (not used).
4. **Opt-out respect** — Auto-pauses sequences on replies, always respects opt-outs.
5. **Transparent reporting** — Daily digest shows exactly what happened and what needs user input.
6. **One approval per draft** — User clicks [APPROVE] / [REGEN] / [SKIP] for each draft.

---

## Critical Design Decisions

### 1. Follow-Up Spacing (Deterministic, Not Smart)

**Decision:** Use fixed spacing from first contact date, not from last send date.

```
First Contact: Mar 10
Follow-Up 1: Mar 10 + 4 = Mar 14
Follow-Up 2: Mar 10 + 8 = Mar 18
Follow-Up 3: Mar 10 + 14 = Mar 24
Follow-Up 4: Mar 10 + 21 = Mar 31
Follow-Up 5: Mar 10 + 30 = Apr 9
```

**Why:** Predictable, no edge cases, easy to explain to prospects ("I email on a schedule"), works with Tue/Wed/Thu constraint.

### 2. Send Windows (Fixed Times in Prospect's Timezone)

**Decision:** Only send Tue/Wed/Thu at 9–11 AM or 1–3 PM in prospect's local time.

**Why:** Empirically best for cold email open rates. Avoids weekends/Mondays/Fridays (noisy inboxes).

### 3. Confidence Scoring (0.8 Threshold)

**Decision:** Confidence >= 0.8 = auto-use (write to Sheet, draft). Below 0.8 = flag for user review.

**Why:** Balances automation (don't ask on everything) with safety (catch uncertainty).

### 4. Approval Gate (One Per Draft)

**Decision:** Every generated draft requires explicit user approval before sending.

**Why:** Prevents hallucinated claims, ensures brand voice consistency, gives you control.

### 5. Reply Classification (LLM-Assisted, User Gate on Low Confidence)

**Decision:** Classify all replies with LLM. If confidence >= 0.8, auto-classify. If lower, ask user.

**Why:** Most replies are clear; user only gets bothered if genuinely unclear.

### 6. Enrichment (Free APIs Only, Batch Processing)

**Decision:** Use Hunter.io free tier, Never Bounce free, Abstract API (timezone), web search/fetch.

**Why:** No vendor lock-in, low cost, sufficient for cold email accuracy.

---

## Data Flow Architecture

```
┌─────────────────┐
│  Google Sheet   │ ← You add new prospects here
└────────┬────────┘
         │ (sync daily)
         ↓
┌─────────────────┐
│ prospects.json  │ ← OpenClaw's working copy (TOON format)
│ (in memory)     │
└────────┬────────┘
         │
         ├─→ [Enrich] ← email validation, timezone, web search
         │      ↓
         │   [confidence scoring]
         │      ↓
         │   [write back to Sheet if >= 0.8]
         │
         ├─→ [Draft] ← LLM generates email
         │      ↓
         │   [queue for approval]
         │      ↓
         │   [wait for [APPROVE] button]
         │      ↓
         │   [schedule send]
         │
         ├─→ [Monitor] ← read Outlook inbox
         │      ↓
         │   [LLM classify reply]
         │      ↓
         │   [confidence >= 0.8? auto-classify : ask user]
         │      ↓
         │   [update prospect status]
         │
         └─→ [Report] ← aggregate metrics, send Telegram digest

         └─→ [Write Back]
              ↓
         ┌─────────────────┐
         │  Google Sheet   │ ← Updated with enrichment, states, next dates
         └─────────────────┘

         └─→ [Event Log]
              ↓
         ┌─────────────────┐
         │  events.json    │ ← All sends, enrichments, classifications (TOON format)
         │  (APPEND only)  │
         └─────────────────┘
```

---

## How Each Deliverable Fits

### 1. System Prompt (OPENCLAW_SYSTEM_PROMPT.md)

**For:** Implementation team, LLM engineers
**Contains:** Full 13-step pipeline with detailed pseudocode for each step
**Use case:** Copy the "13 steps" section directly into OpenClaw's system prompt

```python
# In OpenClaw agent definition:
SYSTEM_PROMPT = """
You are Oliver Chase, an AI Sales Development Representative...
[Insert content from OPENCLAW_SYSTEM_PROMPT.md Steps 1–13]
"""
```

**Key sections:**
- Step 1: Health Check
- Step 2: Sync from Google Sheets
- Step 3: Enrich Missing Data
- Step 4: Load Knowledge Base
- Step 5: Generate Email Drafts
- Step 6: Queue for Approval
- Step 7: Scan Inbox
- Step 8: Classify Replies
- Step 9: Log Events
- Step 10: Write Back to Google Sheets
- Step 11: Compute Metrics
- Step 12: Terminal + Telegram Alert
- Step 13: Prompt for Pending Actions

### 2. Follow-Up & Scheduling Logic (FOLLOWUP_LOGIC.md)

**For:** Backend engineers implementing state machine and scheduling
**Contains:** Pseudocode for two functions:
- `calculate_followup(prospect)` — returns which follow-up is due, when, confidence
- `schedule_send(prospect)` — returns which day/time to actually send (respects Tue/Wed/Thu)

**Use case:** Implement these as JavaScript functions in `state-machine.js`

```javascript
// In src/services/state-machine.js:
function calculateFollowup(prospect) {
  // Pseudocode from FOLLOWUP_LOGIC.md, Part 1
}

function scheduleSend(prospect) {
  // Pseudocode from FOLLOWUP_LOGIC.md, Part 2
}
```

**Why separate?** Calculating "due date" (deterministic) is different from "when to actually send" (respects Tue/Wed/Thu + business hours).

### 3. Telegram Templates (TELEGRAM_DIGEST_FORMAT.md)

**For:** Telegram integration engineers
**Contains:** Exact text templates for all message types
**Use case:** Copy templates into notification service, parameterize with data

```python
# In src/services/telegram-notifier.js:
templates = {
  'morning_checkin': """...""",  # From Template 1
  'draft_approval': """...""",   # From Template 3A
  'daily_digest': """...""",     # From Template 2
  'reply_classification': """...""",  # From Template 3B
}
```

**Include:**
- Morning health check template (8 AM)
- Daily digest template with all sections (after pipeline)
- Real-time action prompts (as they arise)
- Formatting guidelines (emoji, dividers, buttons)

### 4. Enrichment Rules (ENRICHMENT_CHECKLIST.md)

**For:** Enrichment engine developers
**Contains:** Field-by-field validation, confidence scoring, special cases
**Use case:** Implement rules in `enrichment-engine.js` and `validate-prospects.js`

```javascript
// In src/services/enrichment-engine.js:
function enrichEmail(prospect) {
  // Validation rules from ENRICHMENT_CHECKLIST.md, Part 1
  // Confidence scoring from Part 4
}

function enrichTimezone(prospect) {
  // Timezone validation rules
}

function validateEnrichment(prospect) {
  // Use checklist from Part 2 to validate all fields
}
```

**Key reference:** Confidence scoring framework (Part 4)
- 0.9–1.0: Direct verification
- 0.7–0.89: Pattern + validation
- 0.5–0.69: Pattern only
- <0.5: Skip/flag

### 5. One-Page Blueprint (OPENCLAW_BLUEPRINT.md)

**For:** Oliver (SDR Director)
**Contains:** Quick reference, daily checklist, decision templates
**Use case:** Print it out, keep it next to desk

```
Your daily checklist:
☐ 8:00 AM — Morning check-in arrives
☐ 8:15 AM — Approve 8–12 drafts (click [APPROVE] in Telegram)
☐ 9:30 AM — Read daily digest
☐ 9:30 AM — Classify any unclear replies
☐ 9:30 AM — Check pool (add prospects if < 30)
```

---

## Implementation Roadmap

### Phase 1: Plumbing (No LLM Yet)
1. **Implement state machine** — status field transitions, lifecycle enforcement
2. **Implement follow-up logic** — `calculateFollowup()` and `scheduleSend()` functions
3. **Implement enrichment engine** — email validation, timezone lookup, confidence scoring
4. **Implement Sheets sync** — read prospects, write enriched data
5. **Add confidence scoring** — flag items below 0.8 in Notes column

**Success criteria:** Prospects flow through states correctly, follow-ups calculate deterministically, enrichment flags uncertain data.

### Phase 2: Integration (LLM + Approvals)
1. **Draft generation** — LLM-based email drafting with approval workflow
2. **Telegram integration** — send draft approval prompts, collect [APPROVE]/[REGEN]/[SKIP]
3. **SMTP integration** — actually send approved emails (with BCC to oliver@vtwo.co)
4. **Inbox monitoring** — read Outlook, detect replies
5. **Reply classification** — LLM classifies (positive/negative/neutral/unclear/ooo)

**Success criteria:** Drafts generate, you approve via Telegram, emails send, replies are tracked.

### Phase 3: Orchestration (Daily Automation)
1. **13-step pipeline** — wire up all steps into daily runner
2. **GitHub Actions trigger** — 8 AM ET Mon–Fri
3. **Telegram digest** — comprehensive daily report
4. **Metrics aggregation** — track sends, replies, reply rate, opt-outs
5. **Dashboard** — visualize metrics, lead pipeline, reply rate trends

**Success criteria:** Daily run completes without errors, digest is informative, metrics are accurate.

---

## What's NOT in This Design

### Out of Scope (For Later)

1. **Lead scoring** — ranking prospects by likelihood to respond (future enhancement)
2. **Predictive best send time** — ML model to optimize send windows per prospect
3. **Auto-reply drafting** — suggesting replies to inbound messages (manual for now)
4. **Multi-threaded campaigns** — sequences with multiple email variants (single template per step)
5. **A/B testing** — comparing subject lines/copy across cohorts
6. **Calendly integration** — auto-booking calls from replies

These are **Phase 4+ features**. The current design handles the core loop (enrich → draft → approve → send → monitor).

---

## Key Metrics to Track

Once implemented, monitor these daily:

| Metric | Target | How Tracked |
|--------|--------|-------------|
| Emails sent/day | 10–20 | Event log |
| Reply rate | 5–10% | Replies received / sends |
| Enrichment success | 80%+ | Emails discovered / new prospects |
| Email confidence avg | 0.85+ | Mean of all email scores |
| Opt-out rate | <2% | Opt-outs / sends |
| Approval rate | 90%+ | Approved / generated drafts |
| Pipeline health | 30+ active | Prospects in "new" or "email_discovered" status |
| Days of runway | 15+ | Active / avg sends per day |

Report these weekly to stakeholders.

---

## Error Handling Summary

All error scenarios are documented in the system prompt and enrichment checklist. Key categories:

| Scenario | Handling |
|----------|----------|
| **API down** (Sheets, Outlook, etc.) | Retry with backoff, alert user, skip step |
| **Email unverifiable** | Confidence < 0.5, flag with "?", skip drafting |
| **Timezone missing** | Use company HQ default, note in output |
| **Draft flagged for concern** | Append "⚠️ [issue]" in metadata, user reviews before approval |
| **Reply ambiguous** | Confidence < 0.8, ask user to classify |
| **Opt-out received** | Auto-classify, pause all future sends, log reason |
| **Web search timeout** | Skip enrichment for that prospect, flag for manual review |

**Golden rule:** When uncertain (< 0.8 confidence), **flag and ask**. Never proceed with uncertain data.

---

## Testing Strategy (Design Guidance)

For implementation team:

### Unit Tests
- Follow-up calculation (test all 5 follow-ups, all edge cases)
- Scheduling logic (test all days of week, all timezones)
- Confidence scoring (test boundary cases: 0.795, 0.800, 0.805)
- State transitions (test legal and illegal transitions)
- Enrichment validation (test email patterns, MX records, deliverability)

### Integration Tests
- End-to-end daily pipeline (health → sync → enrich → draft → classify → metrics)
- Approval workflow (draft → [APPROVE] → scheduled for send → actually sent)
- Reply monitoring (email arrives in inbox → classified → prospect status updated)
- Telegram messaging (message sent successfully, buttons work)

### Edge Cases
- Prospect without email (enrichment fails, flagged)
- Multiple email candidates (pick best, note alternatives)
- Timezone in unfamiliar region (use company HQ)
- Prospect moved between companies (use current company)
- Email bounces (confidence < 0.5, skip)
- Out-of-office reply (status = paused_ooo, resume on return date)
- Ambiguous reply (confidence 0.65, ask user)

### Mocking
- Mock Google Sheets API (return test data)
- Mock Outlook (return test emails)
- Mock LLM (return predictable drafts)
- Mock Telegram (verify messages sent, don't actually send)
- Mock web_search (return cached results)

---

## Hand-Off Checklist

Before implementation begins, ensure you have:

- [ ] **OPENCLAW_SYSTEM_PROMPT.md** — Full system prompt with 13 steps
- [ ] **FOLLOWUP_LOGIC.md** — Pseudocode for follow-up calculation and scheduling
- [ ] **TELEGRAM_DIGEST_FORMAT.md** — All message templates
- [ ] **ENRICHMENT_CHECKLIST.md** — Validation rules and confidence scoring
- [ ] **OPENCLAW_BLUEPRINT.md** — One-page reference for Oliver
- [ ] **Column schema** — Exact Google Sheet column names and order (documented above)
- [ ] **TOON format** — Token optimization key mappings
- [ ] **API credentials** — GOOGLE_API_KEY, OUTLOOK_PASSWORD, TELEGRAM_TOKEN, OPENROUTER_KEY, etc.

---

## Summary: Design is Complete

This design package specifies the **exact OpenClaw agent orchestration** in pseudocode and prose:

1. **OPENCLAW_SYSTEM_PROMPT.md** — What the agent does (13 steps)
2. **FOLLOWUP_LOGIC.md** — When to send (spacing + scheduling)
3. **TELEGRAM_DIGEST_FORMAT.md** — How to communicate (daily digest + prompts)
4. **ENRICHMENT_CHECKLIST.md** — How to validate data (confidence scoring)
5. **OPENCLAW_BLUEPRINT.md** — One-page quick reference

All logic is **deterministic** (no randomness), **verifiable** (confidence scoring, flag uncertainty), and **human-centered** (approval gates, transparent reporting).

**Next step:** Implementation. Hand these files to your development team to code the pipeline.

---

**Last Updated:** 2026-03-16
**Status:** Design Complete — Ready for Implementation
**Maintained By:** Claude Code (Architecture)
**Questions?** See linked files above for detailed explanations.

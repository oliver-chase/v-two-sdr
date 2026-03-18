# Telegram-Driven SDR System — Requirements & Current State

**Date:** 2026-03-17
**Status:** Phase 2 code complete | Phase 3 (Telegram) integration needed
**Owner:** Oliver Chase (AI SDR persona in OpenClaw)

---

## What You're Asking For

```
Telegram Flow:
──────────────

You: "SDR" (via Telegram)
  ↓
OpenClaw reads message in Telegram
  ↓
OpenClaw triggers SDR daily workflow:
  1. Read prospects from Google Sheets
  2. Enrich (timezone, confidence, LLM draft)
  3. Update Google Sheets with results
  4. Log enrichment data
  ↓
OpenClaw sends results back to Telegram:
  "✅ 5 prospects enriched:
   - Oliver Chase (V.Two) — draft ready
   - Sarah Chen (TechCorp) — draft ready
   - ...
   [View drafts in Google Sheets]"

PLUS: Automatic 8 AM ET daily run (same workflow)
```

---

## Current State Setup

### ✅ What's Built & Ready

| Component | Status | Location |
|-----------|--------|----------|
| **Enrichment Pipeline** | ✅ Complete | `scripts/enrichment-engine.js` |
| **Email Generation** | ✅ Complete | `scripts/draft-emails.js` |
| **Google Sheets Sync** | ✅ Complete | `scripts/sheets-connector.js` |
| **Google Sheets Write** | ✅ Complete | `scripts/sheets-writer.js` |
| **Timezone Lookup** | ✅ Complete | `lib/timezone-cache.js` |
| **Email Drafting** | ✅ Complete | `scripts/mailer.js` |
| **Daily Run Script** | ✅ Complete | `scripts/daily-run.js` |
| **GitHub Actions** | ✅ Configured | `.github/workflows/daily-sdr.yml` |
| **Tests** | ✅ 375/375 passing | `__tests__/` |
| **GitHub Secrets** | ✅ 12 configured | Outlook, Google, APIs, LLM |

### ✅ What's Documented

| Doc | Status | Purpose |
|-----|--------|---------|
| CURRENT_STATE.md | ✅ Current | Phase 2 executive summary |
| OPENCLAW_EMAIL_RESEARCH_STRATEGY.md | ✅ Current | How Oliver researches prospects |
| ARCHITECTURE.md | ✅ Current | System design (8 subsystems) |
| enrichment-engine.js comments | ✅ Current | Zero-cost email discovery notes |
| mailer.js comments | ✅ Current | Bounce handler (Phase 3) notes |

### ❌ What's Missing (Gaps)

| Gap | Impact | Effort | Phase |
|-----|--------|--------|-------|
| **Telegram Bot Integration** | Can't trigger from Telegram | Medium | Phase 3 |
| **Command Parser** | Can't read "SDR" command | Small | Phase 3 |
| **Result Logger** | Can't send results back to Telegram | Small | Phase 3 |
| **Approval Workflow** | Can't approve drafts before send | Large | Phase 3 |
| **Bounce Handler** | Can't retry failed emails | Medium | Phase 3 |
| **Inbox Monitor Integration** | Can't auto-track replies | Large | Phase 3 |

---

## How to Get There: Build Order

### Step 1: Telegram Bot Setup (Week 1)

**What:** Connect OpenClaw Telegram bot to SDR system

**Build:**
1. Create webhook/listener in OpenClaw for Telegram messages
2. Parse "SDR" command from user messages
3. Trigger `node scripts/daily-run.js` when command received
4. Capture output and send back to Telegram

**Code needed:**
```javascript
// lib/telegram-handler.js (NEW)
- Listen for Telegram messages
- Parse "SDR" command
- Trigger daily-run.js
- Log results to Telegram

// scripts/daily-run.js (MODIFY)
- Add --output=json flag for Telegram logging
- Return structured result {enriched, drafted, updated, errors}
```

**Config needed:**
```javascript
// config/config.telegram.js (NEW)
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- TELEGRAM_WEBHOOK_URL
```

**GitHub Secrets to add:**
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID

### Step 2: 8 AM Automation (Week 1)

**Current:** GitHub Actions runs at 8 AM ET

**Need:** OpenClaw also reads GitHub Actions output and logs to Telegram

**Or:** OpenClaw triggers the workflow directly (skip GitHub Actions)

**Options:**
- **Option A (Simple):** Keep GitHub Actions, OpenClaw reads workflow logs and Telegrams results
- **Option B (Better):** OpenClaw runs daily-run.js directly at 8 AM, logs to Telegram (no GitHub UI)

**Recommendation:** Option B
- Full control in OpenClaw
- Faster feedback (no GitHub latency)
- Single source of truth (Telegram logs)

### Step 3: Approval Workflow (Week 2-3)

**What:** You approve drafts before sending

**Build:**
1. After enrichment, OpenClaw sends draft preview to Telegram
2. You reply with "APPROVE" or "ITERATE {notes}"
3. If APPROVE: OpenClaw marks approved in Google Sheets
4. If ITERATE: OpenClaw refines template and re-drafts
5. Once approved: Send emails via Outlook

**Code needed:**
```javascript
// scripts/approve-drafts.js (NEW)
- Read draft_emails.json
- Format preview for Telegram
- Wait for approval message
- Mark approved in Google Sheets

// scripts/execute-sends.js (NEW)
- Read approved drafts
- Send via Outlook (mailer.js)
- Log sends to Telegram
```

### Step 4: Bounce Handler (Week 3)

**What:** If email bounces, verify and retry

**Build:**
1. Listen for bounce responses from Outlook
2. Call Hunter.io/Abstract API ($0.01 per bounce)
3. Try next email candidate
4. Retry send
5. Log result to Telegram

**Code needed:**
```javascript
// scripts/bounce-handler.js (NEW)
- Detect SMTP bounce from Outlook
- Call Hunter/Abstract verification
- Retry with verified email
- Update Google Sheets
```

---

## Quick Start for First Test

### Right Now (No Telegram, just verify system works)

```bash
# Option 1: Wait for 8 AM ET (GitHub Actions automatic)
# Option 2: Manual trigger (takes 2 minutes)

# Step 1: OpenClaw adds 1 prospect to Google Sheets
Name: Oliver Chase
Email: oliver.chase@v-two.co (optional)
Company: V.Two
Title: CEO
Location: San Francisco, CA

# Step 2: Trigger workflow manually
gh workflow run daily-sdr.yml --repo saturdaythings/v-two-sdr

# Step 3: Check results
# GitHub Actions logs (30 sec)
# Google Sheets updated with enrichment

# Step 4: Review draft email
# Currently logged in sends.json
# Telegram integration coming Phase 3
```

### With Telegram (Phase 3)

```
You: "SDR" (Telegram)
OpenClaw: triggers enrichment workflow
OpenClaw: "✅ 5 prospects enriched, drafts ready in Sheets"
You: Reviews drafts
You: "APPROVE" (Telegram)
OpenClaw: Sends via Outlook
OpenClaw: "✅ 5 sent, logged in sends.json"
```

---

## Current Telegram Bot

**Bot:** OpenClaw Telegram
**Status:** Active, can receive/send messages
**Capability:** Needs integration with SDR system

**To use:**
1. Send "SDR" message to bot
2. Bot currently does nothing (not connected yet)
3. Phase 3: Connect to daily-run.js

---

## Summary: What Needs Building

| Task | Type | Effort | Blocker? |
|------|------|--------|----------|
| Telegram message listener | Code | 2 hours | No |
| "SDR" command parser | Code | 1 hour | No |
| Result formatter + sender | Code | 2 hours | No |
| 8 AM scheduler (in OpenClaw) | Code | 1 hour | No |
| Approval workflow | Code | 6 hours | Yes (blocks sending) |
| Bounce handler | Code | 4 hours | No |

**Critical path for first live run:**
1. Telegram listener + command parser (3 hours)
2. Result logging to Telegram (2 hours)
3. Approval workflow (6 hours)
4. = **11 hours total** (1-2 days work)

---

## Files Ready to Go

```
✅ scripts/daily-run.js — Main orchestration
✅ scripts/enrichment-engine.js — Email generation + enrichment
✅ scripts/draft-emails.js — LLM email drafting
✅ scripts/sheets-writer.js — Google Sheets updates
✅ scripts/sheets-connector.js — Google Sheets reads
✅ lib/timezone-cache.js — Timezone lookup
✅ scripts/mailer.js — Email sending (Outlook)

❌ lib/telegram-handler.js — NOT BUILT (Phase 3)
❌ scripts/approve-drafts.js — NOT BUILT (Phase 3)
❌ scripts/execute-sends.js — NOT BUILT (Phase 3)
❌ scripts/bounce-handler.js — NOT BUILT (Phase 3)
```

---

## Next Step

**Option A:** Build Telegram integration now (Phase 3 work)
- 11 hours to full approval + send workflow
- Recommendation: Do this next sprint

**Option B:** Test with GitHub Actions first
- Use GitHub UI to trigger (2 minutes)
- Verify enrichment works
- Then build Telegram integration

**My recommendation:** Option B first
- Prove the system works end-to-end
- Then add Telegram wrapper
- Lower risk, faster feedback

What would you prefer?

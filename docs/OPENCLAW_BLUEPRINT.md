# OpenClaw Orchestration Blueprint — One-Page Reference

**Version:** 1.0
**Audience:** Oliver (SDR Director) — for daily execution
**Purpose:** Quick reference for understanding the daily SDR pipeline

---

## What Is OpenClaw Doing?

OpenClaw is an AI agent running **once per day at 8 AM ET** (Mon–Fri) inside GitHub Actions. It:

1. **Enriches** missing prospect data (email, timezone, company info)
2. **Drafts** personalized cold emails (LLM-generated, requires approval)
3. **Schedules** emails to send on Tue/Wed/Thu at 9–11 AM or 1–3 PM (prospect's local time)
4. **Monitors** your inbox for replies
5. **Classifies** replies (positive, negative, neutral, unclear, out-of-office)
6. **Reports** daily digest via Telegram with actions needed

**Total runtime:** ~1 hour per day. **Human involvement:** 2–5 minutes (approvals + classifications).

---

## Daily Pipeline (13 Steps)

```
8:00 AM         9:00 AM          ~9:30 AM
┌──────────────┬──────────────────┬──────────────────┐
│ 1. HEALTH    │ 2. SYNC          │ 3–5. ENRICH      │
│ 2. HEALTH    │ 3. ENRICH        │ 6. DRAFT         │
│ 3. ENRICH    │ 4. KB LOAD       │ 7. QUEUE         │
│ 4. KB LOAD   │ 5. DRAFT         │ 8. SCAN INBOX   │
│ 5. DRAFT     │ 6. QUEUE         │ 9. CLASSIFY     │
│ 6. QUEUE     │ 7. INBOX SCAN    │ 10. LOG         │
│ 7. INBOX     │ 8. CLASSIFY      │ 11. WRITE BACK  │
│ 8. CLASSIFY  │ 9. LOG           │ 12. METRICS     │
│ 9. LOG       │ 10. WRITE BACK   │ 13. ALERT       │
│ 10. WRITE    │ 11. METRICS      │ ↓ USER ACTIONS  │
│ 11. METRICS  │ 12. ALERT        │ [APPROVE]       │
│ 12. ALERT    │ 13. PROMPT       │ [CLASSIFY]      │
│ 13. PROMPT   │ ↓ USER ACTIONS   │ [CONFIRM]       │
└──────────────┴──────────────────┴──────────────────┘
```

---

## Key Concepts

### Follow-Up Spacing (All From First Contact Date)

```
Day 0:  Initial send
Day 4:  Follow-up 1
Day 8:  Follow-up 2
Day 14: Follow-up 3
Day 21: Follow-up 4
Day 30: Follow-up 5
```

**Deterministic:** No randomness. If first contact is Mar 10, follow-up 1 is always Mar 14.

### Send Windows (Prospect's Local Time)

- **9–11 AM** — morning slot
- **1–3 PM** — afternoon slot
- **Only Tue/Wed/Thu** — best open rates for cold email

If today is Mon/Fri/weekend → defer to next eligible day.

### Email Confidence Scoring

- **0.8–1.0:** Auto-use (write to Sheet, proceed to draft)
- **0.5–0.79:** User review (flag in Notes, wait for confirmation)
- **<0.5:** Skip (don't write to Sheet)

---

## Prospect Lifecycle (Status Field)

```
new
  ↓
email_discovered (email confidence >= 0.8)
  ↓
draft_generated (LLM created draft)
  ↓
awaiting_approval (queued for Oliver/Kiana)
  ├─ [APPROVE] → email_sent
  └─ [REJECT] → draft_generated (try again)

email_sent (first contact sent)
  ↓
[REPLY RECEIVED]
  ├─ replied_positive → closed or escalate to sales
  ├─ replied_negative → closed_negative (stop sends)
  ├─ replied_neutral → follow_up_scheduled
  ├─ replied_unclear → awaiting_classification
  └─ replied_ooo → paused_ooo

closed_positive / closed_negative / opt_out
  ↓
[END]
```

---

## What Needs Your Approval

### 1. Draft Approval (Daily)

```
OpenClaw generates drafts for 8–12 prospects/day.
You see them in Telegram with [APPROVE] / [REGENERATE] / [SKIP] buttons.

Approval means: "Yes, send this email."
Rejection means: "Generate a different version."
```

### 2. Reply Classification (As Replies Arrive)

```
Reply received → OpenClaw classifies (confidence 0–1)

Confidence >= 0.8 → Auto-classify (you see it in digest)
Confidence 0.5–0.79 → Needs your input (Telegram prompt)
Confidence < 0.5 → Always flag for manual review

Your job: Click [POSITIVE] or [NEUTRAL] or [DEFER] in Telegram
```

### 3. Email Verification (If Found)

```
Email discovered with confidence 0.5–0.79 → Flagged in Notes

You review: "Is john.smith@acme.com the right email?"
You click: [CONFIRM] → proceeds to draft
or [REJECT] → skipped, marked for manual search
```

---

## Telegram Messages You'll See

### Morning Check-In (8 AM)
```
🌅 SDR Daily Check-In
Status: ✅ All systems online
Today's targets: 10–15 sends planned
```

### Draft Approval (During day as drafts ready)
```
📧 NEW DRAFT READY FOR APPROVAL

Prospect: John Doe, CTO @ Acme
Subject: "AI governance at scale"
Body: [2–3 lines]

[APPROVE] [REGENERATE] [SKIP]
```

### Daily Digest (After pipeline ~9:30 AM)
```
[SDR Daily Digest — Mar 16, 2026]

📊 Summary:
• Emails sent: 10
• Replies: 2 (20% reply rate!)
• Enrichments: 8

✅ Wins: 2 positive replies
❌ Opt-outs: 1
❓ Needs decision: 1 unclear reply

Next sends: Mar 18 (8 prospects)
```

---

## Data Fields (What You Need to Know)

### Provided by You (Don't Enrich)
- Name, Title, Company, Email, City, State, Country
- Source, Date Added

### Enriched by OpenClaw (Auto-Updated)
- Email (if confidence >= 0.8)
- Timezone (if confidence >= 0.7)
- Company Size, Industry, Annual Revenue (if high confidence)

### Calculated by System (Don't Touch)
- Status, First Contact Date, Follow-Up Dates, Next Contact Date
- Last Contact Date, Reply Count, Last Updated

### Notes (Append Only)
- Enrichment notes: `"Email: john@acme.com (0.92 confidence)"`
- Flags: `"? Email needs verification"`
- Signals: `"Signal: Hired CTO Feb 2026"`
- Track assignment: `"Track: Product Maker — Series B founder"`

---

## Quick Decisions You'll Make

### Decision 1: "Is this email correct?"
```
Flag: "? john.smith@acme.com (confidence: 0.68)"

Your choice:
  ✅ [CONFIRM] — yes, use this email
  ❌ [REJECT] — no, skip this prospect
  🔍 [MANUAL] — I'll search myself
```

### Decision 2: "How should I classify this reply?"
```
Email: "Thanks, but timing isn't right for us now."

OpenClaw says: Neutral (60% confidence)
Possible replies: POSITIVE | NEUTRAL | NEGATIVE | DEFER

Your choice: [NEUTRAL] → system updates status
```

### Decision 3: "Send this draft?"
```
Subject: "AI governance at scale"
Body: 2–3 personalized sentences

Your choice: [APPROVE] → added to send queue
           [REGEN] → try again with different tone
           [SKIP] → don't send to this prospect
```

### Decision 4: "We need more prospects"
```
Alert: ⚠️ POOL WARNING
Active prospects: 28 (threshold: 30)

Your action: Add 10–15 new prospects to Sheet STAT
System will enrich them tomorrow
```

---

## How to Add Prospects

1. Go to Google Sheet: "V.Two SDR - Master Lead Repository" → "Leads" tab
2. Add new row with: Name, Title, Company, Email (optional), Timezone (optional)
3. Leave other columns blank (OpenClaw enriches them)
4. System picks them up tomorrow at 8 AM

That's it. OpenClaw handles the rest.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| No emails sent today | Drafts not approved | Click [APPROVE] in Telegram |
| "Pool warning" alert | Running out of prospects | Add 10–15 new prospects to Sheet |
| Email confidence low | Weak discovery signal | Click [CONFIRM] or [REJECT] |
| Inbox not updating | Outlook API down | Wait 24 hrs, system retries |
| Prospect marked opt-out | They replied "remove me" | System auto-pauses (can reactivate manually) |

---

## Success Metrics (Weekly)

| Metric | Target | How To Track |
|--------|--------|--------------|
| Sends/day | 10–20 | Telegram digest |
| Reply rate | 5–10% | Telegram digest |
| Opt-out rate | <2% | Telegram digest |
| Pool health | 30+ active | Telegram alert if low |
| Approval rate | 90%+ | Count approved/generated |
| Email confidence | 0.85+ avg | Telegram digest |

---

## Your Daily Checklist

```
☐ 8:00 AM — Receive morning check-in. Verify systems OK.
☐ 8:15 AM — During pipeline, approve 8–12 drafts as they arrive
☐ 9:30 AM — Read daily digest. Note any actions.
☐ 9:30 AM — Classify any unclear replies (1–2 typically)
☐ 9:30 AM — Check pool status. If < 30, add prospects.
☐ End of day — Optional: review 7-day metrics in dashboard

Typical time commitment: 3–5 minutes
Critical time: Morning (draft approvals as they arrive)
```

---

## Key Files (If You Need Details)

| Document | Purpose | Read When |
|----------|---------|-----------|
| `OPENCLAW_SYSTEM_PROMPT.md` | Full 13-step pipeline logic | You want to understand how it works |
| `FOLLOWUP_LOGIC.md` | When/how follow-ups are calculated | You want to change spacing or logic |
| `TELEGRAM_DIGEST_FORMAT.md` | Exact message templates | You want to customize alerts |
| `ENRICHMENT_CHECKLIST.md` | What gets enriched and how | You want to know enrichment rules |
| `ARCHITECTURE.md` | System design + error handling | You're debugging a bug |

---

## The Bottom Line

**OpenClaw is your co-worker.** Every morning at 8 AM, it:
- Finds missing email addresses
- Writes draft emails (you approve)
- Sends approved emails at optimal times
- Reads replies
- Reports back to you

**You just need to:** Click buttons when Telegram asks ("approve?" / "how to classify?" / "confirm email?").

**It's deterministic:** Same spacing, same send windows, same logic every day. No surprises.

**It's safe:** Never sends without approval. Always flags uncertainty. Respects opt-outs.

---

**Last Updated:** 2026-03-16
**Version:** 1.0 (Design Complete)
**For Questions:** See full system prompt or architecture docs

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


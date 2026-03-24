# Telegram Digest Format & Templates

**Version:** 1.0
**Purpose:** Exact templates for daily SDR digest messages sent to Oliver and Kiana via Telegram

---

## Overview

The OpenClaw agent sends **three types of Telegram messages** daily:

1. **Morning Health Check** — 8 AM ET, before pipeline starts
2. **Daily Digest** — After pipeline completes (~9 AM ET)
3. **Action Prompts** — Real-time, as items need approval

Each message uses emoji for visual scanning, inline buttons for quick actions, and consistent formatting.

---

## Message 1: Morning Health Check (8 AM)

Sent immediately when OpenClaw starts the daily pipeline.

### Template

```
🌅 SDR Daily Check-In

Initiating daily pipeline...

Status:
  ✅ Sheets API: Connected
  ✅ Outlook SMTP: Connected
  ✅ Outlook IMAP: Connected
  ✅ Telegram: Connected
  ✅ Web search: Online

📊 Pool Status (as of yesterday EOD):
  • Total prospects: 247
  • New (uncontacted): 23
  • Ready to draft: 45
  • Sent (awaiting reply): 120
  • Replied: 45
  • Closed: 14

🎯 Today's targets:
  • Enrichments to attempt: 8
  • Drafts to generate: 12
  • Approvals waiting from yesterday: 2

⏰ Running pipeline. Digest will arrive when complete (~1 hour).

[CANCEL_PIPELINE] [SKIP_DRAFTING]
```

---

## Message 2: Daily Digest (After Pipeline Complete)

Sent after all 13 pipeline steps finish (~9 AM ET).

### Template (Complete Example)

```
[SDR Daily Digest — Mar 16, 2026]

📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✉️  Emails sent today: 10
📧 Replies received: 2 (20% reply rate 🔥)
🔍 Enrichments completed: 8
📝 Drafts generated: 10
✅ Drafts approved: 9
⏳ Drafts awaiting approval: 1

🔄 Pool Status:
  • Total: 247 | New: 23 | Ready: 45 | Sent: 120
  • Days of runway: ~12 days (at 10 sends/day)
  • Warning: Pool below 50 active prospects

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ WINS (positive replies)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 John Doe, CTO @ Acme Corp
   Subject: "I'm interested. When's a good time?"
   Sent: Mar 14 | Replied: Mar 16
   Follow-up: Book discovery call

🎉 Jane Smith, VP Eng @ TechStart
   Subject: "This looks promising. What's the investment?"
   Sent: Mar 12 (FU1) | Replied: Mar 15
   Follow-up: Send case study, book call

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ OPT-OUTS (auto-closed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 Bob Johnson, Dir of Eng @ SoftCorp
   Reason: "Removed from list. Not interested."
   Sent: Mar 11 | Replied: Mar 15

🚫 Carol White, Product Manager @ AppCo
   Reason: "Too early for us right now."
   Sent: Mar 13 (FU1) | Replied: Mar 16

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ NEEDS YOUR DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  David Lee, VP Sales @ BigTech
   Reply: "Not right now, maybe Q3?"
   Sent: Mar 10 | Replied: Mar 16
   Sentiment: Neutral (confidence 0.72)
   Recommendation: Keep warm + follow up in Q3 (Jul 1)?

   [KEEP_WARM] [CLOSE_NEGATIVE] [MANUAL_FOLLOW]

⚠️  Maria Garcia, Architect @ CloudStart
   Reply: "Who should I talk to?"
   Sent: Mar 14 | Replied: Mar 16
   Sentiment: Positive but unclear (confidence 0.68)
   Recommendation: Introduce to sales team?

   [ESCALATE_TO_SALES] [DRAFT_REPLY] [MANUAL_FOLLOW]

❓ Email Enrichment — Low Confidence:
   • Michael Zhang @ FastPay (0.65 confidence) — Verify email?
   • Sarah King @ SecureAI (0.71 confidence) — Verify email?

   [CONFIRM_EMAILS] [SKIP_THESE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 NEXT SENDS (by date)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Mar 18 (Tuesday):  8 prospects due (3 initial, 5 FU)
📌 Mar 22 (Saturday): 0 prospects (not a send day)
📌 Mar 24 (Monday):   0 prospects (not a send day)
📌 Mar 25 (Tuesday):  12 prospects due

🎯 Most active day next: Mar 25 (12 sends planned)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 WEEKLY METRICS (Mar 10–16)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sends: 45
Replies: 7 (15.5% reply rate — excellent!)
Opt-outs: 2 (4.4% — high, review messaging?)
Positive: 3
Negative: 1
Neutral: 2
Unclear: 1

📈 By Track:
  • AI Enablement: 15 sends, 2 replies (13%)
  • Product Maker: 20 sends, 4 replies (20%) ⭐️
  • Pace Car: 10 sends, 1 reply (10%)

🏆 Best performing industry: SaaS (23% reply rate)
🔴 Lowest: Finance (8% reply rate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  DRAFT AWAITING APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prospect: Robert Chen, CIO @ MegaCorp
Track: AI Enablement
Industry: Enterprise Software
Email: robert.chen@megacorp.com

SUBJECT: "AI governance at scale"

BODY:
"Hi Robert,

We work with enterprise CTOs like you to build AI
governance systems that scale. Most of your peer set
is struggling with compliance, cost control, and safety.

We just shipped this for [Company Name]. Worth a 15-min
conversation?

—Oliver"

CTA: Reply with interest or book 15 min

[APPROVE] [REGENERATE] [SKIP]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK STATS

Reply rate trend: ↑ (last 7 days: 15.5% vs. prior 7: 12%)
Opt-out rate: 4.4% (target: <2% — review tone?)
Enrichment success: 87% (7 auto, 1 manual)
Approval rate: 90% (9/10 drafts approved)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[VIEW_FULL_DASHBOARD] [TAKE_ACTION]
```

---

## Message 3: Real-Time Action Prompts

Sent immediately when a user action is needed (not waiting for daily digest).

### Template 3A: Draft Approval Needed

```
📧 NEW DRAFT READY FOR APPROVAL

Prospect: Sarah Johnson, Dir of Eng @ StartupAI
Track: Product Maker
Industry: AI/ML
Email: sarah@startupai.com
Company Size: 50–100

SUBJECT: "Owning the product build"

BODY:
"Hi Sarah,

We see you're hiring. Building a strong eng org is hard
—especially when wearing the product hat yourself.

We bring in senior engineers who let you focus on the
vision. No long-term commitment, pure augmentation.

Chat this week?

—Oliver"

[APPROVE] [REGENERATE] [SKIP]

⏰ Waiting for response...
```

### Template 3B: Reply Classification - Need Confirmation

```
🤔 UNCLEAR REPLY — NEED YOUR CALL

From: Mike Torres, VP Product @ TechCorp
Received: Mar 16, 2:30 PM

Original email sent: Mar 12
Subject: "Scaling AI safely"

THEIR REPLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Thanks for reaching out. We have some AI
initiatives in flight, but the timing isn't
right. Check back in a few months?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 AI Assessment: Neutral (60% confidence)
   — Positive signal: "We have AI initiatives"
   — Negative signal: "Timing isn't right"
   — Unclear: What "few months" means?

Your call:
[NEUTRAL] [POSITIVE] [DEFER_TO_Q3] [MANUAL_REVIEW]

Recommendation: Mark as "defer to Q3" + follow up Jul 1?
```

### Template 3C: Low Email Confidence - Confirm?

```
⚠️  EMAIL ENRICHMENT — CONFIRM?

Prospect: Lisa Chen
Company: FutureSoftware
Title: Engineering Manager
Found email: lisa.chen@futuresoftware.com

Confidence: 72% (pattern match, MX verified, but not direct)

Options:
[CONFIRM] — Use this email, proceed to draft
[MANUAL_VERIFY] — Hold, I'll verify manually
[SKIP] — Ignore this prospect for now
```

### Template 3D: Pool Alert

```
⚠️  POOL WARNING

Active prospects below threshold:

Current active (new + ready to draft): 28
Threshold: 30

📌 Action: Add new prospects to the sheet ASAP
   (recruiting research, LinkedIn, etc.)

Adds needed: 10–15 over next week to maintain velocity

[ACKNOWLEDGE] [PAUSE_SENDS] [NEED_HELP]
```

---

## Message 4: End-of-Day Compact Summary (Optional 5 PM)

For closing out the day with a quick recap.

### Template

```
📊 TODAY'S FINAL COUNT

✅ Completed:
   • 10 emails sent
   • 2 replies received
   • 8 enrichments
   • 10 drafts generated
   • 1 opt-out processed

⏳ Pending:
   • 1 draft approval
   • 1 reply classification

✅ No blockers. Ready for tomorrow.

Next sends: Mar 18 (8 prospects)
```

---

## Formatting Guidelines

### Emoji Legend
```
🌅 Start/check-in
✅ Success/done
📊 Stats/summary
✉️  Email/send
📧 Draft/approval
📝 Notes/details
⏳ Waiting/pending
❓ Question/need decision
⚠️  Warning/attention needed
❌ Negative/opt-out
🎉 Win/positive reply
🚫 Blocked/closed
📌 Important/pinned
📅 Date/schedule
🎯 Goal/target
🔍 Enrichment/search
🔄 Status/cycle
📈 Trending up
🔴 Red alert
⭐️  Star/highlight
💡 Insight/idea
🏆 Best performer
⏰ Time/urgent
🤔 Uncertain/unclear
🤖 AI/system
📌 Note/action item
[BUTTON] Actions
```

### Text Formatting
- **Bold for headers:** `📊 SUMMARY`
- **Dividers:** `━━━━━━━` (length 16–40)
- **Inline code:** `prospect.status == "replied_positive"`
- **Line breaks:** Generous spacing between sections
- **Lists:** Use bullet points `•` for short lists, numbered `1.` for sequences
- **Quotes:** Use `"quoted text"` for emails/replies

### Button Format
```
[LABEL] — Clear action text, all caps
[APPROVE] [REGENERATE] [SKIP]
[VIEW_DASHBOARD] [TAKE_ACTION]
```

---

## Integration with OpenClaw Pipeline

Each message is triggered automatically:

| Step | Trigger | Message Type | Recipient |
|------|---------|--------------|-----------|
| 1 | Health check starts | Morning Health Check | Oliver + Kiana |
| 6 | Drafts queued | Draft Approval (real-time) | Kiana (SDR) |
| 8 | Reply classified (low confidence) | Reply Classification Prompt | Oliver |
| 11 | Pool below threshold | Pool Alert | Oliver |
| 12 | Pipeline complete | Daily Digest | Oliver + Kiana |
| End-of-day | Optional recap | Compact Summary | Oliver |

---

## Message Routing

### Primary Recipients
- **Oliver:** All digests, metrics, warnings, final decisions
- **Kiana (SDR):** Drafts needing approval, replies needing classification

### Optional Secondary
- **Slack integration:** Mirrored messages to #sdr channel (for visibility)
- **Email:** Daily digest also sent to oliver@vtwo.co as HTML email

---

## Response Flow

When user clicks a button (e.g., `[APPROVE]`), the flow is:

```
User clicks [APPROVE]
  ↓
Telegram sends callback to OpenClaw
  ↓
OpenClaw updates prospect state
  ↓
OpenClaw logs action
  ↓
OpenClaw sends confirmation: "✅ Draft approved. Queued for send."
  ↓
Continue pipeline
```

---

## Examples by Scenario

### Scenario 1: Great Day (High Reply Rate)
```
🎯 WHAT A DAY!

✉️  Emails sent: 12
📧 Replies: 4 (33% reply rate 🔥🔥🔥)
✅ Positive: 3
Neutral: 1

Pool status: Excellent (250+ active prospects)
Opt-out rate: 0%

Nothing to flag. Keep this momentum!
```

### Scenario 2: Low Activity (Waiting for Approvals)
```
📊 QUIET DAY

✉️  Emails sent: 2
📧 Replies: 1
🔍 Enrichments: 5

⏳ Bottleneck: 8 drafts awaiting approval from Kiana
   Estimated ready to send: 6 hours

Recommendation: Review + approve drafts to unblock queue

[REVIEW_DRAFTS]
```

### Scenario 3: High Opt-Out Rate (Alert)
```
⚠️  HIGH OPT-OUT RATE — REVIEW MESSAGING

Today: 4 opt-outs from 8 sends (50%!)
Weekly: 8 opt-outs from 45 sends (18% — high)

Sample reasons:
  • "Timing not right"
  • "Don't do AI yet"
  • "Too early"

Recommendation:
  • Review subject lines (too salesy?)
  • Check targeting (too early-stage?)
  • Consider new positioning for this track?

[REVIEW_TEMPLATES] [PAUSE_SENDS] [DISCUSS]
```

---

## Summary

All Telegram messages follow a consistent structure:
1. **Header** — emoji + title + date/time
2. **Summary stats** — key numbers at top
3. **Detailed sections** — wins, opt-outs, actions, metrics
4. **Action buttons** — inline prompts for decisions
5. **Footer** — next steps or quick links

Messages are designed for **fast scanning** on mobile (Oliver is often on the go) while providing **exact data** for decision-making.

---

**Last Updated:** 2026-03-16
**Version:** 1.0 (Design Complete)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


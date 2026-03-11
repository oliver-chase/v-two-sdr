# SDR Implementation Guide — Complete Configuration

**Date:** 2026-03-11 | **Status:** Ready to Execute | **Owner:** OpenClaw (all execution)

---

## The Actual Workflow (Not Theoretical)

### What OpenClaw Actually Does

1. **Reads existing Google Sheet** (prospects you already have)
2. **Enriches missing data** (emails, LinkedIn URLs, company info, etc.)
3. **Sends 10/day** based on V.Two positioning + business context
4. **Manages templates** (creates, tests, refines)
5. **Gets Kiana approval** in Git (approves send-plan markdown)
6. **Executes sends** via Outlook
7. **Monitors replies** in Outlook inbox
8. **Logs everything** back to Google Sheet + sends.json

**All of this runs out of OpenClaw. Git is used for approval gates only.**

---

## The Complete Data Pipeline

### Step 1: Google Sheet Structure (Your Existing Sheet)

Your Google Sheet has these columns (fill in what's missing):

| Column | Current Data | What's Missing | OpenClaw Fills |
|--------|--------------|-----------------|-----------------|
| FirstName | ✅ (exists) | | |
| LastName | ✅ (exists) | | |
| Company | ✅ (exists) | | |
| Title | ✅ (exists) | | |
| Email | ❓ (some missing) | OpenClaw finds via Hunter.io |
| LinkedIn | ❓ (some missing) | OpenClaw finds via web search |
| Location | ❓ | OpenClaw extracts from LinkedIn |
| Timezone | ❓ | OpenClaw infers from Location |
| Track | ✅ (you assigned) | | (ai-enablement, product-maker, pace-car) |
| Status | pending | | OpenClaw updates as sends happen |
| DateAdded | ✅ (you set) | | |
| Source | ❓ | OpenClaw notes where found/enriched |
| LastSent | | | OpenClaw fills when sent |
| LastReply | | | OpenClaw fills when reply arrives |
| ReplyStatus | | | OpenClaw fills (positive, negative, ooo, neutral) |

**OpenClaw's first job:** Fill in blanks (emails, LinkedIn, Location, Timezone) for rows you already have.

---

### Step 2: OpenClaw Accesses V.Two Context

OpenClaw needs to read **V.Two's positioning and company files** to write relevant emails:

```
Files OpenClaw should read for context:
├── workspaces/work/projects/SDR/MASTER.md       (business positioning)
├── workspaces/work/projects/SDR/RESEARCH_BRIEF.md (track definitions)
├── team/members/sdr/persona_soul.md             (SDR persona voice)
├── [V.Two internal files?]                       (product, company docs)
│   ├── company overview
│   ├── client case studies
│   ├── pricing / value prop
│   ├── recent press / announcements
│   └── team bios
```

**OpenClaw reads these to understand:**
- What V.Two does (AI infrastructure, product development, engineering augmentation)
- Who we're talking to (CTOs vs founders vs eng leads)
- Why they should care (their buying signals match our positioning)
- What story to tell (personalized to their situation)

---

### Step 3: Email Templates (Managed by Kiana + OpenClaw)

**Current templates.md:** Examples only. NOT the final templates.

**Template Workflow:**
1. OpenClaw proposes template A (cold outreach)
2. Kiana reviews, edits, approves in Git
3. Both store in `outreach/templates.md` (Git tracked)
4. OpenClaw tests template with small batch (2-3 sends)
5. Monitor reply rate
6. Iterate: Refine template or move to template B

**Template File Format:**

```markdown
# Email Templates

## Template A: Cold Outreach (Positioner)
**Status:** ✅ Approved by Kiana
**Last Updated:** 2026-03-12
**Reply Rate:** [To be measured]

### For: ai-enablement track
**Subject:** Quick question about {company}'s AI infrastructure

Hi {firstName},

I noticed {company} is {buying_signal_from_research}.

We work with {similar_company_example} on {what_we_did}.

One question: {specific_question_for_title}

{signature}

---

## Template B: Follow-up (Day 5)
**Status:** ✅ Approved by Kiana
**Last Updated:** 2026-03-12

Hi {firstName},

Following up on my previous note...

---
```

**For Kiana to approve templates:**
1. OpenClaw creates branch: `git checkout -b templates/template-A`
2. OpenClaw writes template to `outreach/templates.md`
3. OpenClaw commits: `git add outreach/templates.md && git commit -m "template: propose Template A for cold outreach"`
4. Kiana reviews commit
5. Kiana edits template if needed
6. Kiana commits approval: `git commit -m "template: approve Template A"`

---

## The Daily Send Workflow (Exact Steps)

### Tuesday Morning (Kiana Approves Send)

**1. OpenClaw: Build send-plan.md**

Reads:
- Google Sheet (prospects with Track = product-maker, Status = pending, Email filled in)
- MASTER.md (V.Two positioning)
- outreach/templates.md (approved templates)

Selects: Next 10 prospects
- Check each: Has email? Has name? In opt-outs? ✓
- Assign template based on track and buying signals
- Write merged email (substitute {{placeholders}} with actual data)
- Determine send time (9:30 AM in their timezone)
- Add rationale: Why this person? What signal made them a fit?

Writes: `outreach/send-plan.md`

```markdown
# Send Plan — 2026-03-12

## [1] Sarah Chen — TechStartup Inc (CTO) — Template A
**Track:** ai-enablement
**Send Time:** 9:30 AM PT (Tuesday)
**Rationale:** Series B Dec 2025, 3x growth in eng team, posted about LLM infrastructure

**Subject:** Quick question about TechStartup's AI infrastructure

Hi Sarah,

I noticed TechStartup shipped the AI integration last month—congrats on that.

We work with companies doing similar scale-ups on governance and cost control around LLMs.

One question: How are you thinking about eval/monitoring as you scale the models?

Happy to share what we've learned if helpful.

— Oliver
V.Two
[link]

**Status:** [ ] PENDING APPROVAL

---

## [2] James Wong — DataCorp (VP Eng) — Template A
...
```

2. OpenClaw commits: `git add outreach/send-plan.md && git commit -m "sendplan: 10 prospects for 2026-03-12"`

3. OpenClaw tells Kiana: "Send plan ready for review: outreach/send-plan.md"

---

### Tuesday Morning (Kiana Reviews & Approves)

**4. Kiana: Review send-plan.md**

Reads each prospect + email:
- Does this person fit? ✅ or ❌
- Is the email personalized and good? ✅ or ❌
- Is the timing reasonable? ✅ or ❌
- Any prospects we shouldn't contact (customer, partner, etc.)? ❌

**5. Kiana: Edit & Approve**

For each prospect:
- If good: Mark `[x] APPROVED`
- If not good: Mark `[REJECTED - reason]` or edit the email

Example:
```markdown
## [1] Sarah Chen — TechStartup Inc (CTO) — Template A
...
**Status:** [x] APPROVED

## [2] James Wong — DataCorp (VP Eng) — Template A
...
**Status:** [REJECTED - he's a customer already, don't contact]
```

**6. Kiana: Commit approval**

```bash
git add outreach/send-plan.md
git commit -m "approve: sendplan 2026-03-12 - 8 approved, 2 rejected"
```

---

### Tuesday Afternoon (OpenClaw Executes)

**7. OpenClaw: Read approved sends from Git**

Reads: Latest commit to `outreach/send-plan.md`
Filters: Only rows marked `[x] APPROVED`

**8. OpenClaw: Send emails via Outlook**

For each approved prospect:
1. Authenticate to noreply@vtwo.co (MSAL token)
2. Compose email (use merged body from send-plan.md)
3. Send via Graph API
4. BCC: kiana.micari@vtwo.co
5. Log to `outreach/sends.json`:
   ```json
   {
     "id": "send-001",
     "em": "sarah@techstartup.com",
     "fn": "Sarah",
     "co": "TechStartup Inc",
     "tpl": "A",
     "subj": "Quick question about TechStartup's AI infrastructure",
     "sd": "2026-03-12T09:30:00Z",
     "tz": "America/Los_Angeles",
     "tr": "ai-enablement",
     "st": "sent",
     "rpl": null,
     "rpl_dt": null,
     "rpl_st": null,
     "fu_sd": null,
     "no": ""
   }
   ```
6. Update Google Sheet:
   - Row Status → "sent"
   - Row LastSent → "2026-03-12"

**9. OpenClaw: Commit send logs**

```bash
git add outreach/sends.json
git commit -m "sends: executed 8 sends from approved plan"
```

---

### Tuesday Evening (OpenClaw Monitors Replies)

**10. OpenClaw: Check inbox every hour**

Reads: noreply@vtwo.co inbox via Graph API
For each new message:
- Extract sender email
- Categorize:
  - **Opt-out:** "unsubscribe", "remove", "opt out", "stop"
    → Add to opt-outs.json
    → Update Google Sheet: Status="opted-out"
    → Update sends.json: st="opted_out"
  - **OOO:** Auto-reply detected
    → Update Google Sheet: ReplyStatus="ooo", LastReply=now
    → Schedule follow-up for return date
  - **Positive:** "interested", "let's talk", "tell me more"
    → Update Google Sheet: ReplyStatus="positive", LastReply=now
    → Update sends.json: rpl_st="positive"
    → Flag in SDR_STATE.md: [HOT] {name} {company}
    → Message Kiana: "Hot lead: {name} at {company}"
  - **Negative:** "not interested", "no budget", "too busy"
    → Update Google Sheet: ReplyStatus="negative", LastReply=now
    → Update sends.json: rpl_st="negative"
  - **Other:** Questions, feedback
    → Update Google Sheet: ReplyStatus="neutral", LastReply=now
    → Log response in sends.json: rpl={message}

**11. OpenClaw: Commit reply logs**

```bash
git add outreach/sends.json
git commit -m "monitor: 4 replies received - 1 positive, 1 ooo, 2 negative"
```

---

## Exact Outlook / MSAL Configuration

### Prerequisites

**You need (from Azure admin or Kiana):**
1. Microsoft 365 tenant (V.Two's)
2. App registration with:
   - Client ID
   - Client Secret
   - Mail.Send, Mail.Read permissions

**You need to set up:**
1. `noreply@vtwo.co` account (or similar shared mailbox)
2. Azure app registration with that account authorized

### Configuration Steps (For Kiana to Complete)

**Step 1: Azure Portal Setup**

1. Go to portal.azure.com
2. Azure Active Directory → App registrations → New registration
3. Name: "V.Two SDR Agent"
4. Account type: Single tenant
5. Click Register
6. Copy: **Client ID** (save for Step 3)
7. Go to Certificates & Secrets
8. New client secret → Copy value (save for Step 3) — **CLIENT_SECRET**
9. Go to API Permissions
10. Add: Mail.Send, Mail.Read, Mail.ReadWrite
11. Grant admin consent

**Step 2: Create Shared Mailbox**

1. Microsoft 365 Admin Center
2. Resources → Shared mailboxes → Create
3. Name: "noreply@vtwo.co" (or your domain)
4. Add users: OpenClaw account (whoever runs OpenClaw)
5. Send As / Full Access: OpenClaw account

**Step 3: Store Credentials**

Create `secrets/.env` (gitignore this):

```bash
# Microsoft / Outlook
TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_SECRET=your_client_secret_here
SENDER_EMAIL=noreply@vtwo.co
BCC_EMAIL=kiana@vtwo.co
```

**Step 4: OpenClaw Configuration**

Create `SDR_CONFIG.json` (gitignore this):

```json
{
  "outlook": {
    "tenant_id": "env:TENANT_ID",
    "client_id": "env:CLIENT_ID",
    "client_secret": "env:CLIENT_SECRET",
    "sender_email": "env:SENDER_EMAIL",
    "bcc_email": "env:BCC_EMAIL"
  },
  "google_sheets": {
    "sheet_id": "your_sheet_id_here"
  }
}
```

### How OpenClaw Authenticates

**Each day, OpenClaw:**

1. Reads `SDR_CONFIG.json`
2. Loads credentials from `secrets/.env`
3. Uses MSAL (Microsoft Authentication Library) to get access token:
   ```
   POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
   client_id={CLIENT_ID}
   client_secret={CLIENT_SECRET}
   scope=https://graph.microsoft.com/.default
   ```
4. Receives access token (valid ~1 hour)
5. Uses token to call Microsoft Graph API:
   ```
   POST https://graph.microsoft.com/v1.0/me/sendMail
   Authorization: Bearer {access_token}
   ```
6. Token auto-refreshes when expired

---

## Git Workflow (Everything Lives Here)

### Repository Structure

```
main branch: Always production-ready
└── feature/sdr-execution: Daily work
    ├── outreach/send-plan.md (daily approval gate)
    ├── outreach/sends.json (execution log)
    ├── outreach/templates.md (approved templates)
    └── SDR_STATE.md (session state)

secrets/ (gitignored):
├── .env (MSAL + Outlook config)
├── google-code-credentials.json
└── google-openclaw-credentials.json
```

### Daily Commit Flow

```
Tuesday Morning:
  OpenClaw: git commit -m "sendplan: 10 prospects for 2026-03-12"
  [Kiana reviews in Git UI]

Tuesday Morning:
  Kiana: git commit -m "approve: sendplan 2026-03-12 - 8 approved"

Tuesday Afternoon:
  OpenClaw: git commit -m "sends: executed 8 sends from approved plan"

Tuesday Evening:
  OpenClaw: git commit -m "monitor: 4 replies received - 1 positive, 1 ooo, 2 negative"

Friday Evening:
  OpenClaw: git commit -m "report: week 1 complete - 40 sends, 6% reply rate"
```

All approval and execution logged in Git.

---

## 10/Day Rationale

**Why 10 per day (not 25)?**

1. **Personalization:** Each email researched + merged with prospect data (takes time per person)
2. **Manual approval:** Kiana reviews each prospect + email (10 is reasonable per morning)
3. **Quality over volume:** Better 10 relevant sends than 50 cold blasts
4. **Reply handling:** With 10/day = ~50/week = 3-5 replies/week (manageable)
5. **Scale with success:** If reply rate is 5-10%, increase to 15 or 20/day

**V.Two's context:** You're not a high-volume sales shop. You're building relationships. 10/day of personalized, researched outreach is better than 50/day of templated spam.

---

## What's NOT in This Guide

❌ **Claude Code sends emails** — No. OpenClaw does it all.
❌ **Prospects need to be found** — No. You already have them. They need enrichment.
❌ **Templates are static** — No. They're tested, refined, improved based on reply rates.
❌ **Automation is complex** — No. It's: Read Sheet → Enrich → Approve in Git → Send → Log.

---

## Activation Checklist

- [ ] Kiana provides Microsoft 365 tenant access
- [ ] Kiana creates app registration + shared mailbox
- [ ] Kiana creates `secrets/.env` with credentials
- [ ] Kiana creates `SDR_CONFIG.json` with Google Sheet ID
- [ ] Google Sheets API credentials in `secrets/google-*.json`
- [ ] `outreach/templates.md` has Template A (approved by Kiana)
- [ ] Google Sheet has prospects (with Track assigned, at least name + company)
- [ ] OpenClaw can read Google Sheet
- [ ] OpenClaw can authenticate to Outlook (test send to yourself)
- [ ] First send-plan.md built and approved
- [ ] First sends executed successfully

---

**System is now ready for execution. All workflows defined. No guessing.**

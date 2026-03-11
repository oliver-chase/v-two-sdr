# V.Two SDR System — Final Specification

**Date:** 2026-03-11 | **Status:** Ready to Deploy | **Owner:** Kiana + OpenClaw + Claude Code

---

## What We're Building

A **B2B sales pipeline generation system** that:
1. **Identifies** qualified prospects (via OpenClaw research)
2. **Validates** prospect data (via Claude Code infrastructure)
3. **Executes** outreach at scale (via OpenClaw agent + Outlook API)
4. **Tracks** engagement and replies (via OpenClaw + Claude Code dashboard)
5. **Reports** weekly metrics (via OpenClaw logs + Claude Code visualization)

**Goal:** 25 qualified emails/week by Week 4, with 5-10% reply rate

---

## System Components

### 1. Prospect Database
- **Source:** Google Sheet (collaborative, live database)
  - OpenClaw: Adds researched prospects (web_search, LinkedIn, Crunchbase, Y Combinator, AngelList)
  - Kiana: Monitors progress, can edit/comment
  - Claude Code: Reads for validation
- **Canonical Location:** Google Sheet "Prospects" tab (shared doc, single source of truth)
- **Execution Format:** `workspaces/work/projects/SDR/prospects.json` (TOON format, synced from Sheet)
- **Schema:** firstName, lastName, company, title, email, linkedin, location, timezone, track, status, dateAdded, source, lastSent, lastReply, replyStatus, notes
- **Sync:** Claude Code reads Google Sheet daily → validates → exports to prospects.json
- **Size:** Grows week-to-week (starting volume TBD by OpenClaw, minimum viable for sends)

### 2. Send Execution Pipeline
- **Approval Gate:** `outreach/send-plan.md` (markdown file, human-readable, Kiana reviews & approves)
- **Execution:** OpenClaw reads approved items → sends via Graph API to Outlook
- **Logging:** `outreach/sends.json` (every send logged with recipient, template, sent date, reply status)
- **Send Frequency:** Tue-Thu only, 10-15/day during ramp, 20-25/day at scale

### 3. Reply Monitoring
- **Source:** noreply@vtwo.co inbox (Outlook)
- **Process:** OpenClaw monitors for replies, categorizes (opt-out, OOO, positive, negative), logs status
- **Logging:** Updates `outreach/sends.json` with reply status, `outreach/opt-outs.json` for opt-outs
- **Hot Leads:** Flags positive replies in `SDR_STATE.md` for Kiana action

### 4. Metrics & Visibility
- **Dashboard API:** Claude Code `/api/sdr/metrics` (real-time send/reply rates)
- **Dashboard API:** Claude Code `/api/sdr/pipeline` (prospect pool health)
- **Weekly Report:** OpenClaw generates `outreach/weekly-reports.json` (aggregate metrics)
- **State Management:** `SDR_STATE.md` (phase, week, totals, pending follow-ups, anomalies)

### 5. Infrastructure
- **Validation:** `scripts/validate-prospects.js` (CSV → JSON, deduplication, email validation, opt-out checking)
- **Secrets:** `secrets/.env` (MSAL credentials for Graph API, gitignored)
- **Config:** `team/members/sdr/config.json` (sender_email, bcc_email, state_file paths)

---

## How It Works (Weekly Cycle)

### Monday Morning
1. **OpenClaw:** Researches prospects (300+ target for initial ramp, exact volume TBD by OpenClaw)
   - Sources: LinkedIn, Y Combinator, Crunchbase, AngelList, web_search
   - Validates emails via Hunter.io or NeverBounce API
   - Adds rows to Google Sheet "Prospects" tab with all required fields
   - Updates: Google Sheet (live source, no git commit needed)

2. **Claude Code:** Validates & syncs research
   - Reads Google Sheet "Prospects" tab (via Google Sheets API)
   - Runs `validate-prospects.js` on all rows
   - Deduplicates, cross-checks opt-outs sheet, validates email syntax
   - Outputs: `prospects.json` (TOON format, synced copy for execution)
   - Commits: `git add prospects.json && git commit -m "sync: validated N prospects from Google Sheet, M duplicates noted"`

### Tuesday Morning
3. **OpenClaw:** Builds send plan
   - Reads `prospects.json` (Claude Code's validated data)
   - Selects pending prospects (10-15 for ramp, 20-25 at scale)
   - Assigns templates A-C (cold outreach) from `outreach/templates.md`
   - Merges prospect data into email bodies
   - Generates `outreach/send-plan.md` with full email preview, rationale, send time
   - Notifies Kiana: "Send plan ready for review"

### Tuesday-Wednesday
4. **Kiana:** Reviews & approves
   - Opens `outreach/send-plan.md`
   - Reads each prospect and email body
   - Marks approved items: `[x] APPROVED` OR rejects with comments
   - Commits: `git add outreach/send-plan.md && git commit -m "approve: send-plan for DATE"`

### Tuesday-Thursday Afternoon
5. **OpenClaw:** Executes approved sends
   - Reads `outreach/send-plan.md` (looks for `[x] APPROVED` markers)
   - For each approved item:
     - Authenticates to Outlook via MSAL (device_code flow)
     - Sends email via Graph API (from noreply@vtwo.co)
     - BCC: kiana.micari@vtwo.co (for Kiana visibility)
     - Logs to `outreach/sends.json`: recipient, template, subject, sent date, status
     - Updates Google Sheet: Row status=sent, LastSent=now
   - Commits: `git add outreach/sends.json && git commit -m "sends: executed N sends from send-plan"`

### Tuesday-Thursday Evening
6. **OpenClaw:** Monitors inbox
   - Reads noreply@vtwo.co inbox via Graph API
   - For each new message:
     - **Opt-out (unsubscribe, remove me, opt out, stop):**
       - Adds to `outreach/opt-outs.json`
       - Adds to Google Sheet "OptOuts" tab
       - Updates `outreach/sends.json`: `st: opted_out`
       - Updates Google Sheet: Row status=opted-out
     - **OOO (out of office, auto-reply):**
       - Updates `outreach/sends.json`: `fu_sd: [return date + 1 day]` (schedules follow-up)
       - Updates Google Sheet: Row ReplyStatus=ooo, LastReply=now
     - **Positive (tell me more, let's talk, interested):**
       - Updates `outreach/sends.json`: `rpl_st: positive`
       - Updates Google Sheet: Row ReplyStatus=positive, LastReply=now
       - Adds to `SDR_STATE.md` anomalies with `[HOT]` flag
       - Notifies Kiana immediately (hot lead)
     - **Negative (not interested, no budget, too busy):**
       - Updates `outreach/sends.json`: `rpl_st: negative`
       - Updates Google Sheet: Row ReplyStatus=negative, LastReply=now
     - **Other (questions, feedback):**
       - Updates `outreach/sends.json`: `rpl_st: neutral`, logs reply content
       - Updates Google Sheet: Row ReplyStatus=neutral, LastReply=now
   - Marks all processed messages as read in Outlook
   - Commits: `git add outreach/sends.json SDR_STATE.md && git commit -m "monitor: inbox sweep - X replies categorized"`

### Friday EOD
7. **OpenClaw:** Generates weekly metrics
   - Computes from past 7 days: total sends, replies, reply rate, positive replies, opt-outs, top template
   - Writes to `outreach/weekly-reports.json`
   - Updates `SDR_STATE.md`: phase, week, cumulative totals, pending follow-ups, next session instructions
   - Commits: `git add outreach/weekly-reports.json SDR_STATE.md && git commit -m "report: week N metrics - X sends, Y% reply rate"`

### Any Time
8. **Claude Code:** Provides visibility
   - Dashboard reads all logs (via `/api/sdr/metrics`, `/api/sdr/pipeline`)
   - Real-time metrics: sends/day, reply rate, pipeline size, opt-out rate
   - No manual intervention needed (reads only)

---

## File Structure (Canonical Locations)

```
workspaces/work/projects/SDR/
├── MASTER.md                    ← Business brief (read-only)
├── RESEARCH_BRIEF.md            ← OpenClaw research criteria (read-only)
├── SKILL.md                     ← Operational guide (read-only)
├── ARCHITECTURE.md              ← System design (read-only)
├── OPENCLAW_HANDOFF.md          ← OpenClaw implementation spec (read-only)
├── SYSTEM_SPEC.md               ← THIS FILE (source of truth)
├── GOOGLE_SHEETS_INTEGRATION.md ← Google Sheets setup (read-only)
│
├── Google Sheet "Prospects"     ← CANONICAL SOURCE (OpenClaw + Kiana write, Claude Code reads)
│
├── prospects.json               ← Claude Code writes (TOON, synced from Google Sheet, for execution)
├── SDR_STATE.md                 ← OpenClaw writes (session state, updated Friday)
├── SDR_CONFIG.json              ← Google Sheets config (gitignored, has Sheet ID + credentials paths)
│
├── outreach/
│   ├── templates.md             ← Email templates A-E (static)
│   ├── send-plan.md             ← Kiana approval gate (updated daily by OpenClaw)
│   ├── sends.json               ← Send log (TOON, updated by OpenClaw)
│   ├── opt-outs.json            ← Opt-out list (TOON, updated by OpenClaw)
│   └── weekly-reports.json      ← Metrics (TOON, updated Friday by OpenClaw)
│
├── scripts/
│   ├── validate-prospects.js    ← Claude Code: validate prospect data
│   └── sync-from-sheets.js      ← Claude Code: read Google Sheet → write prospects.json
│
└── secrets/
    ├── .env                     ← MSAL credentials (gitignored, for Outlook)
    ├── google-openclaw-credentials.json   ← Google API creds for OpenClaw (gitignored)
    └── google-code-credentials.json       ← Google API creds for Claude Code (gitignored)
```

**Key:** Google Sheet is the live, collaborative source. prospects.json is the synced copy for execution.

---

## Data Formats (TOON Token Optimization)

### prospects.json
```json
{
  "prospects": [
    {
      "id": "p-001",
      "fn": "Sarah",
      "ln": "Chen",
      "co": "TechStartup Inc",
      "ti": "CTO",
      "em": "sarah@tech.io",
      "li": "linkedin.com/in/sarahchen",
      "lo": "San Francisco, CA",
      "tz": "America/Los_Angeles",
      "tr": "product-maker",
      "st": "pending",
      "ad": "2026-03-11",
      "no": "Series B Dec 2025"
    }
  ],
  "metadata": {
    "tot": 1,
    "by_tr": {"ai-enablement": 0, "product-maker": 1, "pace-car": 0},
    "by_st": {"pending": 1, "sent": 0, "replied": 0, "opted_out": 0, "bounced": 0, "closed": 0},
    "lu": "2026-03-11T00:00:00Z"
  }
}
```

### outreach/sends.json
```json
{
  "sends": [
    {
      "id": "send-001",
      "em": "sarah@tech.io",
      "fn": "Sarah",
      "co": "TechStartup Inc",
      "tpl": "A",
      "subj": "Quick question, Sarah",
      "sd": "2026-03-12T09:30:00Z",
      "tz": "America/Los_Angeles",
      "tr": "product-maker",
      "st": "sent",
      "rpl": null,
      "rpl_dt": null,
      "rpl_st": null,
      "fu_sd": null,
      "no": ""
    }
  ],
  "metadata": {
    "tot_sends": 1,
    "tot_replies": 0,
    "reply_rate": 0,
    "tot_bounces": 0,
    "tot_optouts": 0,
    "lu": "2026-03-12T10:00:00Z"
  }
}
```

### outreach/opt-outs.json
```json
{
  "opt_outs": [],
  "metadata": {
    "tot": 0,
    "lu": "2026-03-11T00:00:00Z"
  }
}
```

---

## Team Responsibilities

| Phase | Owner | Action |
|-------|-------|--------|
| **Research** | OpenClaw | Find prospects, validate emails, deliver prospects.csv |
| **Validation** | Claude Code | Run validate-prospects.js, produce prospects.json |
| **Send Planning** | OpenClaw | Build send-plan.md from prospects.json |
| **Approval** | Kiana | Review send-plan.md, mark [APPROVED] items, commit |
| **Execution** | OpenClaw | Execute approved sends via Graph API → Outlook |
| **Monitoring** | OpenClaw | Monitor inbox, categorize replies, log to sends.json |
| **Reporting** | OpenClaw | Generate weekly-reports.json, update SDR_STATE.md |
| **Visibility** | Claude Code | Provide /api/sdr/metrics, /api/sdr/pipeline dashboards |

---

## Success Criteria

### Week 1
- ✅ OpenClaw delivers prospects.csv (volume TBD, minimum viable for sends)
- ✅ Claude Code validates → prospects.json created
- ✅ First send-plan.md generated Tuesday
- ✅ Kiana approves sends
- ✅ First emails sent Tue-Thu
- ✅ Replies monitored, logged

### Week 4
- ✅ 500+ total prospects in database (cumulative across 4 weeks)
- ✅ 25 sends/week sustained (Tue-Thu schedule)
- ✅ 5-10% reply rate observed
- ✅ <2% opt-out rate
- ✅ Weekly reports generated every Friday
- ✅ Dashboard shows real-time metrics

---

## Blockers

⛔ **Google Sheets Setup** (prerequisite for both agents)
- Kiana or admin must complete (see GOOGLE_SHEETS_INTEGRATION.md):
  1. Create Google Cloud Project
  2. Enable Google Sheets API
  3. Create service accounts (openclaw-sdr, claude-code-sdr)
  4. Generate JSON credentials and store in `secrets/`
  5. Create/share Google Sheet with service account emails
  6. Create `SDR_CONFIG.json` with Sheet ID and credential paths
  7. Implement `scripts/sync-from-sheets.js` (Claude Code)

⛔ **Microsoft App Registration** (prerequisite for email execution)
- Kiana or Azure admin must complete:
  1. Register "V.Two SDR Agent" app in Azure
  2. Grant permissions: Mail.Send, Mail.Read, Mail.ReadWrite
  3. Create client secret
  4. Note: TENANT_ID, CLIENT_ID, CLIENT_SECRET
  5. Store in `secrets/.env` before OpenClaw starts email execution

---

## Validation Checklist

- ✅ Purpose clear? (Generate qualified pipeline via B2B outreach)
- ✅ Data flow clear? (CSV → JSON → sends → metrics)
- ✅ Team responsibilities clear? (OpenClaw research+execution, Claude Code validation+visibility, Kiana approval)
- ✅ Success criteria measurable? (Volume, reply rate, opt-out rate)
- ✅ Approval gate human? (Kiana reviews markdown, no auto-sends)
- ✅ Infrastructure independent? (Claude Code works whether OpenClaw delivers 50 or 500 prospects)
- ✅ TOON format optimized? (80% token savings on logs)
- ✅ Secrets secure? (gitignored, one canonical location)

---

## Deployment

### Step 1: Approve Spec (Kiana)
- Review this document + GOOGLE_SHEETS_INTEGRATION.md
- Confirm team assignments
- Approve success criteria

### Step 2: Complete Google Sheets Setup (Kiana or admin)
- Follow GOOGLE_SHEETS_INTEGRATION.md
- Create Google Cloud Project + service accounts
- Create/share Google Sheet
- Store credentials in `secrets/`
- Create `SDR_CONFIG.json`

### Step 3: Implement Sync Script (Claude Code)
- Implement `scripts/sync-from-sheets.js`
- Test: Read Google Sheet → write prospects.json
- Verify: prospects.json generated correctly in TOON format

### Step 4: Complete App Registration (Kiana or Azure admin)
- Follow prerequisite steps (Microsoft side)
- Create `secrets/.env` with MSAL credentials
- Test: OpenClaw can authenticate to Outlook

### Step 5: Activate OpenClaw
- Read `OPENCLAW_HANDOFF.md`
- Read `GOOGLE_SHEETS_INTEGRATION.md` (OpenClaw section)
- Start Week 1 research (Monday morning)
- Add rows to Google Sheet (live source)

### Step 6: Validate & Deploy (Claude Code + OpenClaw)
- Claude Code syncs Google Sheet → prospects.json
- OpenClaw builds send-plan.md Tuesday
- Execute → monitor → report

---

**System ready for deployment. Waiting on:**
1. Kiana approval of spec + Google Sheets plan
2. Google Sheets infrastructure setup (Cloud Project, service accounts, creds)
3. Claude Code sync script implementation
4. Microsoft App Registration completion
5. OpenClaw activation signal

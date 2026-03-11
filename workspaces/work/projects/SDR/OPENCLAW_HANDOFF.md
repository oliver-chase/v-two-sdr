# OpenClaw ↔ Claude Code Handoff Specification

**For:** OpenClaw agent implementing SDR execution phase
**Date:** 2026-03-11
**Status:** Ready for OpenClaw implementation

---

## What Claude Code Has Built

✅ **Infrastructure Layer:**
- `validate-prospects.js` — Converts CSV → JSON, validates emails, cross-checks opt-outs
- `/api/sdr/metrics` — Dashboard endpoint (reads logs, returns TOON metrics)
- `/api/sdr/pipeline` — Dashboard endpoint (pipeline visualization)
- `prospects.json` schema — TOON format spec for prospect database
- `SDR_STATE.md` — Cross-session state management

✅ **Data Structure:**
- `prospects.csv` (empty, waiting for your research)
- `prospects.json` (canonical prospect database, TOON format)
- `outreach/sends.json` (TOON format)
- `outreach/opt-outs.json` (TOON format)
- `outreach/weekly-reports.json` (metrics)

---

## What OpenClaw Must Implement

### Phase 1: Research & Data Delivery

**Monday-Friday: Research & Deliver prospects.csv**

1. **Web Research**
   - LinkedIn: Search for CTO/CDO/VPE/Founder at Series B-C companies
   - Y Combinator directory (2024-2025 batches)
   - Crunchbase (Series B funding)
   - AngelList, company websites, GitHub
   - Target: 300+ prospects (Week 1), 500+ by Week 4

2. **Email Validation**
   - Use Hunter.io, NeverBounce, or similar API
   - Validate each email: syntax + domain + mailbox exists
   - Confidence threshold: 90%+ likely valid

3. **Compile CSV**
   - Format: `workspaces/work/projects/SDR/prospects.csv`
   - Headers: FirstName,LastName,Company,Title,Email,LinkedIn,Location,Timezone,Track,Status,AddDate,Notes
   - Example row: `Sarah,Chen,TechStartup Inc,CTO,sarah@tech.io,linkedin.com/in/sarahchen,San Francisco CA,America/Los_Angeles,product-maker,pending,2026-03-11,Series B Dec 2025`
   - Track assignment: `ai-enablement`, `product-maker`, or `pace-car` (see RESEARCH_BRIEF.md)
   - Status: Always `pending` for new prospects
   - All fields required except Notes

4. **Commit & Notify**
   - `git add prospects.csv`
   - `git commit -m "research: add {X} new prospects (week {N})"`
   - Message to Kiana: "Week {N} research complete: {X} prospects researched, {Y}% email validation pass rate"

5. **Claude Code Action**
   - Reads prospects.csv (your deliverable)
   - Runs `validate-prospects.js` → deduplicates, validates, converts to TOON
   - Writes `prospects.json` (canonical database)
   - Reports: "Validated {X} prospects, {Y} duplicates, {Z} invalid emails"

---

### Phase 2: Send Planning & Execution

**Tuesday-Thursday: Build, Approve, Send, Monitor**

1. **Build Send Plan**
   - Read `prospects.json` (Claude Code's validated data)
   - Filter: status = `pending`, not in `opt-outs.json`, valid email
   - Select: 10-15 prospects for ramp phase, 20-25 at scale
   - For each prospect:
     - Assign template A/B/C (cold outreach) — see `outreach/templates.md`
     - Merge: {{firstName}}, {{company}}, {{title}} into email body
     - Determine: timezone-adjusted send time (9:30 AM local)
     - Rationale: Why this prospect? (e.g., "Series B Jan 2026, scaling AI team")

2. **Generate send-plan.md**
   - Location: `outreach/send-plan.md`
   - Format: Markdown, human-readable
   - One section per prospect with: prospect name, company, title, track, template, full merged email body, send time, rationale
   - Mark each as: `[ ] PENDING APPROVAL`
   - Example:
     ```
     ## [1] Sarah Chen — TechStartup Inc (CTO) — Template A
     **Track:** Product Maker | **Send Time:** 9:30 AM PT (Tuesday)
     **Rationale:** Series B Dec 2025, shipping AI features, VP Eng hired
     **Status:** [ ] PENDING APPROVAL

     Subject: Quick question, Sarah
     Body: Hi Sarah, I noticed TechStartup just shipped AI integration...
     ```

3. **Get Kiana Approval**
   - Push branch: `git push -u origin feature/sdr-execution`
   - Notify Kiana: Link to send-plan.md
   - Kiana reviews, edits file, marks items: `[x] APPROVED` or comments `[REJECTED - reason]`
   - Kiana commits: `git commit -m "approve: send-plan for 2026-03-12"`

4. **Execute Approved Sends**
   - Read: `outreach/send-plan.md`
   - For each item marked `[x] APPROVED`:
     - Authenticate via Graph API (MSAL device_code flow)
     - Send email via Outlook (noreply@vtwo.co)
     - BCC: kiana.micari@vtwo.co
     - Log to `outreach/sends.json`:
       ```json
       {
         "id": "send-NNN",
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
       ```

5. **Monitor Inbox (Same Day)**
   - Read inbox via Graph API (noreply@vtwo.co account)
   - For each new message:
     - **Opt-out keywords** ("unsubscribe", "remove me", "opt out", "stop"):
       - Immediately add to `outreach/opt-outs.json`
       - Update `sends.json`: mark as `st: opted_out`
       - Do NOT follow up
     - **OOO replies** ("out of office", auto-reply detected):
       - Extract return date if available
       - Update `sends.json`: mark as `st: pending`, set `fu_sd` to return date + 1 day
       - Schedule follow-up for that date
     - **Positive replies** (interest signals: "tell me more", "let's talk", "when can you meet"):
       - Update `sends.json`: mark as `st: replied`, set `rpl_st: positive`
       - Add to `SDR_STATE.md` anomalies with `[HOT]` prefix
       - Message Kiana: "Hot lead: {name} at {company} interested"
       - Do NOT auto-reply; wait for Kiana guidance
     - **Negative replies** ("not interested", "no budget", "too busy"):
       - Update `sends.json`: mark as `st: replied`, set `rpl_st: negative`
       - Optionally close sequence (no follow-up)
     - **Other replies** (questions, feedback):
       - Update `sends.json`: mark as `st: replied`, set `rpl_st: neutral`
       - Log in sends.json: `rpl_c: "{reply content}"`
   - Mark all processed messages as read in Outlook
   - Commit: `git add outreach/sends.json SDR_STATE.md && git commit -m "monitor: inbox sweep - {X} replies processed"`

---

### Phase 3: Follow-Up Sequencing

**Wednesday-Thursday: Scheduled Follow-ups**

1. **Read sends.json**
   - Find entries where: `fu_sd` is today or earlier AND `st: pending`

2. **Build follow-up plan**
   - Use Templates D (5-day follow-up) or E (12-day follow-up) — see `outreach/templates.md`
   - Merge prospect data
   - Add to daily send-plan.md (under "Follow-ups" section)

3. **Execute & Log** (same as initial sends)
   - Get Kiana approval (if policy requires)
   - Send via Graph API
   - Log to sends.json with `tpl: D` or `tpl: E`
   - Set `fu_sd: null` (follow-up complete)

---

### Phase 4: Weekly Reporting

**Friday EOD: Generate Metrics**

1. **Compute metrics from past 7 days**
   - Total sends: count where `sd` this week
   - By track: breakdown (ai-enablement/product-maker/pace-car)
   - Total replies: count where `rpl: not null`
   - Reply rate: replies / sends
   - Positive replies: count where `rpl_st: positive`
   - Opt-outs: count entries in `outreach/opt-outs.json`
   - Top template: which template (A-E) had highest reply rate

2. **Write to weekly-reports.json**
   - Add entry: week #, dates, metrics, top template, recommendations

3. **Update SDR_STATE.md**
   - Phase, week, cumulative totals
   - Last session: date, actions, tokens used
   - Pending follow-ups: list due dates
   - Anomalies: hot leads, bounces, etc.
   - Next session instructions

4. **Commit**
   - `git add outreach/weekly-reports.json SDR_STATE.md`
   - `git commit -m "report: week {N} metrics - {X} sends, {Y}% reply rate"`

---

## Data Structures (TOON Format)

### prospects.csv → prospects.json

**CSV Input (OpenClaw produces):**
```csv
FirstName,LastName,Company,Title,Email,LinkedIn,Location,Timezone,Track,Status,AddDate,Notes
Sarah,Chen,TechStartup Inc,CTO,sarah@tech.io,linkedin.com/in/sarahchen,San Francisco CA,America/Los_Angeles,product-maker,pending,2026-03-11,Series B funded
```

**JSON Output (Claude Code validates → TOON):**
```json
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
  "no": "Series B funded"
}
```

### Send Log (outreach/sends.json)

```json
{
  "id": "send-001",
  "em": "sarah@tech.io",
  "fn": "Sarah",
  "ln": "Chen",
  "co": "TechStartup Inc",
  "ti": "CTO",
  "tpl": "A",
  "subj": "Quick question, Sarah",
  "sd": "2026-03-12T09:30:00Z",
  "tz": "America/Los_Angeles",
  "tr": "product-maker",
  "st": "sent",
  "rpl": "Yes, I'm interested",
  "rpl_dt": "2026-03-12T14:22:00Z",
  "rpl_st": "positive",
  "fu_sd": null,
  "no": ""
}
```

**Key Abbreviations:**
- `fn/ln` = firstName/lastName
- `co` = company | `ti` = title | `em` = email | `li` = linkedin
- `lo` = location | `tz` = timezone | `tr` = track | `st` = status
- `ad` = addDate | `no` = notes
- `tpl` = template | `subj` = subject
- `sd` = sentDate | `rpl` = reply | `rpl_dt` = replyDate | `rpl_st` = replyStatus | `fu_sd` = followupScheduled

---

## GitHub Workflow

**Each week, OpenClaw:**
1. Creates feature branch (or works on existing): `feature/sdr-execution`
2. Commits research: `git commit -m "research: add X new prospects"`
3. Commits monitoring: `git commit -m "monitor: inbox sweep - X replies"`
4. Commits reporting: `git commit -m "report: week N metrics"`
5. At session end: `git add SDR_STATE.md && git commit -m "state: end-of-session update"`

**Claude Code watches:**
- Reads new prospects.csv → validates → updates prospects.json
- Reads new sends.json → aggregates for dashboard
- Provides metrics via `/api/sdr/metrics` and `/api/sdr/pipeline`

---

## Questions?

If OpenClaw encounters:
- **Email validation issues** → Ask Claude Code to refine validate-prospects.js
- **Graph API auth problems** → Debug MSAL config in secrets/.env
- **Data structure questions** → Refer to TOON spec in this doc or prospects.json schema

**Success criteria:**
- ✅ prospects.csv has 300+ by Friday (Week 1)
- ✅ prospects.json validated by Claude Code by Friday
- ✅ First send-plan.md ready by Tuesday (Week 1)
- ✅ Sends logged daily, replies monitored same-day
- ✅ Weekly report generated Friday EOD

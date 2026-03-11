# SDR System — Deployment Checklist & Team Activation

**Date:** 2026-03-11 | **Status:** Ready for Team Activation | **Owner:** Kiana (Strategic Lead)

---

## What We've Built

**Complete SDR system:**
- ✅ Prospect enrichment (Google Sheet as source)
- ✅ Personalized send workflow (10/day with Kiana approval)
- ✅ Outlook integration (Graph API + MSAL)
- ✅ Reply monitoring (automatic categorization)
- ✅ Dashboard visibility (real-time metrics)
- ✅ Git-based approval (all sends logged transparently)

**Documentation:**
- ✅ SYSTEM_SPEC.md (what we're building)
- ✅ IMPLEMENTATION_GUIDE.md (exact operational steps)
- ✅ GOOGLE_SHEETS_INTEGRATION.md (data setup)
- ✅ OPENCLAW_HANDOFF.md (OpenClaw operational spec)
- ✅ PRODUCT_REVIEW.md (strategic assessment + risks)
- ✅ DEPLOYMENT_CHECKLIST.md (this document)

---

## Team Activation (Before Week 1 Launch)

### Kiana's Pre-Launch Checklist (Product/GTM Lead)

**Strategic Decisions** (Answer these 6 questions):
- [ ] **Prospect baseline audit:**
  - Total prospects in Google Sheet: _____
  - % with complete data: _____%
  - Quality assessment: _____ (good prospects or need filtering?)
- [ ] **Business success metric defined:**
  - Revenue target: $_____
  - Meetings target: _____
  - Deal size assumption: $____
  - Pipeline target: $_____
  - [Use these to calculate required sends: shows if 10/day is enough]
- [ ] **Qualified reply definition:**
  - Title(s) of buyer: _____
  - Budget indicator: _____
  - Timeline indicator: _____
  - Can they say "yes"? _____
- [ ] **Time budget committed:**
  - Hours/week for approvals: _____ (recommend 5-10 hours for sustainable 10/day)
  - Response SLA for [HOT] leads: _____ (recommend <4 hours)
- [ ] **Follow-up sequence decision:**
  - [ ] All sends (including Template D/E) require Kiana approval
  - [ ] Follow-ups auto-execute on schedule (no approval needed)
- [ ] **Reply handling workflow:**
  - When [HOT] flag fires, I will: _____ (draft response, take over, assign to AE)
  - SLA: _____ (hours to first response)

**Infrastructure Setup** (Kiana or IT admin):
- [ ] **Microsoft / Outlook:**
  - [ ] Create app registration in Azure (note Client ID + Secret)
  - [ ] Grant Mail.Send, Mail.Read, Mail.ReadWrite permissions
  - [ ] Create shared mailbox: noreply@vtwo.co (or your domain)
  - [ ] Add OpenClaw user to shared mailbox (Full Access)
  - [ ] Store credentials in: `secrets/.env`
  - [ ] Test: Can you receive emails at noreply@vtwo.co?

- [ ] **Google Sheets API:**
  - [ ] Create GCP project
  - [ ] Enable Google Sheets API
  - [ ] Create 2 service accounts (openclaw-sdr, claude-code-sdr)
  - [ ] Download JSON credentials → store in `secrets/`
  - [ ] Share Google Sheet with both service accounts
  - [ ] Document Sheet ID in `SDR_CONFIG.json`

- [ ] **Verify credentials work:**
  - [ ] OpenClaw can read/write Google Sheet
  - [ ] Claude Code can read Google Sheet
  - [ ] OpenClaw can authenticate to Outlook
  - [ ] Test send works (send test email to yourself)

**Template Approval:**
- [ ] **Template A (Cold Outreach) approved by me**
  - [ ] Subject line feels right
  - [ ] Body is personalized, on-brand, specific
  - [ ] Clear ask (tell me more, let's talk)
  - [ ] Signed with my name / V.Two branding
  - [ ] Commit to `outreach/templates.md` with message: `git commit -m "template: approve Template A for cold outreach"`

**Google Sheet Prep:**
- [ ] **Prospect data cleaned:**
  - [ ] Remove duplicates
  - [ ] Verify Track field is filled (ai-enablement, product-maker, pace-car)
  - [ ] Sort by Track (to batch OpenClaw's enrichment work)
  - [ ] Note any quality issues (will discuss with OpenClaw)

**Documentation Review:**
- [ ] **I've read all docs:**
  - [ ] SYSTEM_SPEC.md (understand the data flow)
  - [ ] IMPLEMENTATION_GUIDE.md (understand daily workflow)
  - [ ] PRODUCT_REVIEW.md (understand risks and success metrics)
- [ ] **Decisions documented** in a Decision Log (linked in Slack/email)

---

### OpenClaw's Pre-Launch Checklist (Execution Lead)

**Credential Setup:**
- [ ] Clone repo and pull latest
- [ ] Create `secrets/.env` with values from Kiana:
  ```
  TENANT_ID=xxxxx
  CLIENT_ID=xxxxx
  CLIENT_SECRET=xxxxx
  SENDER_EMAIL=noreply@vtwo.co
  BCC_EMAIL=kiana@vtwo.co
  ```
- [ ] Create `SDR_CONFIG.json` with Google Sheet ID from Kiana
- [ ] Verify `.gitignore` excludes `secrets/` and `SDR_CONFIG.json`

**Google Sheets Connection:**
- [ ] Place Google Sheets credentials in `secrets/google-openclaw-credentials.json`
- [ ] Test: `node -e "require('@google-cloud/sheets').GoogleSpreadsheet" 2>&1 && echo 'OK'"`
- [ ] Test: Read a row from Google Sheet (verify connection works)

**Outlook Connection:**
- [ ] Test MSAL authentication with `secrets/.env` credentials
- [ ] Test: Send test email to yourself from noreply@vtwo.co
- [ ] Test: Read inbox via Graph API
- [ ] Verify BCC works (email goes to kiana.micari@vtwo.co)

**Enrichment Pilot:**
- [ ] [ ] **Enrich 10 test prospects from Google Sheet**
  - Pick top 10 (highest-fit based on company + track)
  - For each:
    - [ ] Find work email (try linkedin.com/in/{name}, Hunter.io, ZoomInfo)
    - [ ] Verify email syntax + domain exists
    - [ ] Find LinkedIn profile URL
    - [ ] Note company size, recent funding, industry
    - [ ] Add source note (where found/verified)
  - Measure: Time per prospect? (should be ~5-10 min)
  - Log: Which sources worked? Which didn't?
  - Update Google Sheet with filled data

**Process Documentation:**
- [ ] **Document your enrichment process:**
  - What sources do you use? (LinkedIn, Hunter.io, Clearbit, etc.)
  - How long does each prospect take?
  - What % are you able to enrich?
  - Any patterns in what's hard to find?
  - Share findings with Kiana

**First Send-Plan Draft:**
- [ ] Build `outreach/send-plan.md` with those 10 enriched prospects
- [ ] Use Template A from `outreach/templates.md`
- [ ] Merge: {{firstName}}, {{company}}, {{title}} with actual data
- [ ] Add rationale for each (why this person? what signal?)
- [ ] Add send time (9:30 AM in their timezone)
- [ ] Mark all as `[ ] PENDING APPROVAL`
- [ ] Commit: `git add outreach/send-plan.md && git commit -m "sendplan: initial 10 for approval"`

**Ready Check:**
- [ ] I've read IMPLEMENTATION_GUIDE.md (understand the daily workflow)
- [ ] I've read OPENCLAW_HANDOFF.md (understand my role)
- [ ] I can read/write Google Sheet
- [ ] I can send emails via Outlook (tested with test email)
- [ ] I can read Outlook inbox
- [ ] First send-plan.md ready for Kiana approval

---

### Claude Code's Pre-Launch Checklist (Infrastructure Lead)

**Setup:**
- [ ] Clone repo and pull latest
- [ ] Create `secrets/google-code-credentials.json` from Kiana
- [ ] Verify `.gitignore` excludes credentials

**Google Sheets Sync Script:**
- [ ] [ ] **Implement `scripts/sync-from-sheets.js`** (if not done)
  - Reads Google Sheet "Prospects" tab
  - Validates each row (email syntax, deduplication, opt-out check)
  - Exports to `prospects.json` (TOON format)
  - Logs validation results (how many valid? how many issues?)

  Example:
  ```javascript
  const {GoogleSpreadsheet} = require('google-spreadsheet');
  const fs = require('fs');

  // Load credentials + config
  const creds = require('../secrets/google-code-credentials.json');
  const config = require('../SDR_CONFIG.json');

  // Read Google Sheet
  const doc = new GoogleSpreadsheet(config.google_sheets.sheet_id);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['Prospects'];
  const rows = await sheet.getRows();

  // Validate + export to TOON
  const validated = rows
    .map(row => ({
      id: `p-${row.rowNumber}`,
      fn: row.get('FirstName'),
      ln: row.get('LastName'),
      co: row.get('Company'),
      ti: row.get('Title'),
      em: row.get('Email').toLowerCase(),
      li: row.get('LinkedIn'),
      lo: row.get('Location'),
      tz: row.get('Timezone'),
      tr: row.get('Track'),
      st: row.get('Status'),
      ad: row.get('DateAdded'),
      no: row.get('Notes') || ''
    }))
    .filter(p => validateEmail(p.em)); // Your validation logic

  fs.writeFileSync('prospects.json', JSON.stringify({
    prospects: validated,
    metadata: {
      tot: validated.length,
      // ... build metadata
    }
  }, null, 2));
  ```

**Dashboard Endpoints:**
- [ ] `/api/sdr/metrics` implemented (reads sends.json, returns TOON)
- [ ] `/api/sdr/pipeline` implemented (reads prospects.json, returns TOON)
- [ ] Both tested with curl or Postman
- [ ] Both return valid JSON

**Initial Data Export:**
- [ ] Run `sync-from-sheets.js` against current Google Sheet
- [ ] Verify `prospects.json` is created
- [ ] Verify format is TOON (abbreviated keys: fn, ln, co, etc.)
- [ ] Verify dashboard endpoints return data

**Ready Check:**
- [ ] I can read Google Sheet via API
- [ ] Sync script works (exports to prospects.json)
- [ ] Dashboard endpoints return data
- [ ] `prospects.json` is in TOON format
- [ ] No code changes needed; ready to monitor and report

---

## Phase 1 Launch (Week 1: Enrichment + First Send)

### Sunday Evening (Kiana)
- [ ] All pre-launch checklist items complete
- [ ] Decision Log shared with team
- [ ] Team sync: "We're launching Monday. Everyone clear?"

### Monday (OpenClaw)
- [ ] Enrich first 10 prospects (if not done in pre-launch)
- [ ] Build send-plan.md
- [ ] Commit and notify Kiana: "Send plan ready for review"

### Monday-Tuesday (Kiana)
- [ ] Review send-plan.md
- [ ] Mark [APPROVED] / [REJECTED] for each
- [ ] Commit approval
- [ ] Notify OpenClaw: "Approved sends: [X]"

### Tuesday Afternoon (OpenClaw)
- [ ] Execute approved sends via Outlook
- [ ] Log to sends.json
- [ ] Update Google Sheet (Status=sent, LastSent=date)
- [ ] Commit

### Tuesday Evening - Friday (OpenClaw)
- [ ] Monitor inbox every 2-4 hours
- [ ] Categorize replies
- [ ] Update sends.json + Google Sheet
- [ ] Commit each monitoring run

### Friday Evening (OpenClaw)
- [ ] Generate weekly-reports.json
- [ ] Update SDR_STATE.md (totals, learnings, next week plan)
- [ ] Commit: "report: week 1 complete - X sends, Y% reply rate"

### Friday Evening (Kiana + Claude Code)
- [ ] Review results:
  - [ ] How many sends completed? (Target: 40)
  - [ ] How many replies? (Target: 2-10, or 5-25%)
  - [ ] Any [HOT] leads? (Target: 1+)
  - [ ] What worked? What didn't?
  - [ ] Template A feedback
- [ ] Dashboard shows correct metrics
- [ ] Decide: Proceed to week 2 or iterate?

---

## Go/No-Go Decision Points

### After Week 1 Pilot (Friday EOD)

**GO:** Proceed to Week 2 if:
- ✅ 40 sends completed (quality > quantity)
- ✅ Reply rate 2-25% (anything in this range is learning)
- ✅ At least 1 qualified positive reply (proof of concept)
- ✅ Kiana not overwhelmed (approvals sustainable)
- ✅ No technical blockers (auth, email sending, logging works)

**NO-GO (Iterate):** If:
- ❌ <20 sends completed (enrichment is bottleneck? fix this)
- ❌ 0 replies and sent to wrong prospects (redefine quality)
- ❌ Kiana can't sustain approval load (reduce to 5/day)
- ❌ Technical failures (auth broken, emails not sending)

**DECISION:** Kiana makes final call Friday evening.

---

## Success Criteria (Not Just Activity)

### Week 1-2 (Pilot)
- ✅ 40 personalized sends executed
- ✅ 2-10 replies (5-25% reply rate on small sample)
- ✅ 1+ qualified positive reply (person, company, title match)
- ✅ Kiana approval process sustainable (not overloaded)
- ✅ Template A working (getting replies, not spam complaints)

### Week 3-4
- ✅ 80 total sends (2 weeks of 40)
- ✅ 4-8 qualified replies (aiming for 5-10%)
- ✅ 1-2 meetings scheduled / in pipeline
- ✅ Template variation test (Template A vs. B reply rates)
- ✅ Follow-up sequence working (Template D getting re-engagement)

### Month 2+
- ✅ ~250 sends/month sustained
- ✅ 5-10% reply rate consistent
- ✅ 2-5 meetings/week
- ✅ Pipeline growing ($ value increasing)
- ✅ Revenue impact measurable (attribution to SDR system)

---

## Risk Watch (Red Flags)

🚩 **Enrichment takes >15 min per prospect** → System can't sustain 10/day. Either: automate enrichment, reduce daily sends, or hire another enricher.

🚩 **Kiana overwhelmed by approvals** → Reduce volume immediately (go to 5/day). Don't scale until approval is easy.

🚩 **0 replies by Wednesday (week 1)** → Wrong prospects or wrong email. Iterate fast. Try different angle/template.

🚩 **[HOT] leads unanswered >4 hours** → Defeats purpose. Define SLA and meet it, or it's wasted.

🚩 **Template A getting spam complaints** → Kill it immediately. Move to Template B. Refine.

---

## Team Communication Cadence

**Daily:**
- OpenClaw sends status in Slack: "Built send-plan.md, awaiting approval"
- Kiana reviews + approves (same day)
- OpenClaw: "Executed 8 approved sends, monitoring replies"

**Weekly:**
- Friday EOD sync (all 3): Results, learnings, next week plan
- Update SDR_STATE.md together
- Decide: Scale, iterate, or pause

---

## How to Actually Start

1. **Kiana:** Answer the 6 strategic questions (30 min)
2. **Kiana:** Complete infrastructure setup (2-4 hours, mostly waiting for IT)
3. **OpenClaw:** Verify credentials + enrich 10 prospects (2 hours)
4. **Claude Code:** Verify sync script works (1 hour)
5. **Kiana:** Approve Template A (30 min)
6. **OpenClaw:** Build first send-plan.md (1 hour)
7. **Kiana:** Approve first sends (30 min)
8. **OpenClaw:** Execute + monitor (ongoing)

**Total setup time:** 6-8 hours over 2-3 days.

---

## Files Ready to Use

Location: `/Users/oliver/OliverRepo/workspaces/work/projects/SDR/`

- ✅ SYSTEM_SPEC.md — High-level overview
- ✅ IMPLEMENTATION_GUIDE.md — Step-by-step operational guide
- ✅ GOOGLE_SHEETS_INTEGRATION.md — Setup instructions
- ✅ OPENCLAW_HANDOFF.md — OpenClaw detailed spec
- ✅ PRODUCT_REVIEW.md — Risk assessment + strategic questions
- ✅ DEPLOYMENT_CHECKLIST.md — This document

---

**System is ready. Team activation can begin immediately upon decision.**

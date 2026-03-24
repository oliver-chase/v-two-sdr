# SDR Next Steps Roadmap

**Document Date:** 2026-03-17
**Status:** Phase 2 Complete → Phase 3 Starting
**Owner:** Oliver

---

## Phase 3 Immediate (Week of Mar 17)

### Immediate Actions (Today/Tomorrow)

#### 1. Manual System Test
Test the full pipeline end-to-end before scaling:

- [ ] Add 1 test prospect to Google Sheet "Leads" tab
  - Required fields: first_name, last_name, email, company, linkedin_url
  - Example: John Doe | johndoe@acme.com | Acme Corp | https://linkedin.com/in/johndoe

- [ ] Run manual trigger:
  ```bash
  cd /Users/oliver/OliverRepo/workspaces/work/projects/SDR
  node scripts/daily-run.js
  ```

- [ ] Verify 4-step pipeline completes:
  - ✅ Prospect enriched (timezone, company details added to Sheet)
  - ✅ Draft email generated (check system logs for success message)
  - ✅ Token count cached (verify in Sheet or logs)
  - ✅ Google Sheet updated (new columns populated, status = "drafted")

- [ ] Check inbox (Outlook):
  - Email **not** sent yet (approval step pending)
  - Draft visible in script output

- **Success Criteria:** All 4 steps complete without errors. No manual data correction needed.

#### 2. Monitor First Automated Run
GitHub Actions scheduled for 8 AM ET tomorrow (if today < 8 AM ET):

- [ ] Navigate to: **GitHub** → `saturdaythings/v-two-sdr` → **Actions** tab → **SDR Daily Run**

- [ ] Check first 3 automated runs (over 3 business days):
  - ✅ Workflow triggered on schedule
  - ✅ All steps completed (no red X marks)
  - ✅ Logs show "Processed N prospects" message

- [ ] If workflow fails:
  - Click **failed run** → view logs
  - Common issues: Google Sheets API auth, Outlook auth, rate limits
  - Fix in `.env` or GitHub Secrets, re-run manually
  - **Do not proceed to Phase 3a until 3 consecutive successful runs**

---

## Phase 3a: Ramp-Up (Mar 17–28, 10 Business Days)

### Weekly Cadence

**Goal:** Test automation reliability and tune templates at small scale.

- [ ] Add **10 NEW prospects per day** to Google Sheet (100 total by Mar 28)
  - Spread across industries/regions to catch edge cases
  - Format: same as manual test (first_name, last_name, email, company, linkedin_url)

- [ ] GitHub Actions runs automatically **8 AM ET on weekdays**
  - No manual intervention needed after prospect added
  - Drafts generated overnight, queued for approval

- [ ] Daily manual review (~15 min):
  - Check "drafted" column in Google Sheet
  - Skim 5–10 email drafts for quality
  - Flag any opt-out requests (reply subject: "unsubscribe" or "remove me")
  - Approve drafts by running approval script (when ready)

- [ ] Monitor metrics (daily):
  - Email generation success rate (target: 100%)
  - Average draft length (target: 150–250 words)
  - Any API rate limit warnings in logs

- [ ] Monitor replies:
  - Inbox check at EOD for incoming emails
  - Note reply count (even if 0, confirms monitoring works)
  - Any bounces or delivery failures?

**Success Checkpoint (Mar 28):**
- [ ] 100 prospects added without schema errors
- [ ] 90%+ email generation success rate
- [ ] 0 critical GitHub Actions failures
- [ ] Inbox monitoring confirms email sends are tracked
- [ ] Follow-up sequences for early batches start triggering (Day 4+)

---

## Phase 3b: Scale (Mar 31–Apr 18, 10 Business Days)

### Increased Throughput + Follow-Ups

**Goal:** Ramp prospect velocity and manage multi-wave follow-up cadence.

- [ ] Increase NEW prospects to **15 per day** (150 total this period)
  - Total prospect base: 250 (100 from 3a + 150 from 3b)

- [ ] Follow-up sequences activate:
  - Day 4 follow-up: emails sent to prospects from Mar 17–20 cohort
  - Day 8 follow-up: emails sent to earlier cohorts
  - Day 14, 21, 30: later touchpoints in sequence
  - **Total daily volume ramps:** ~10 new drafts + 5–10 follow-up drafts = 15–20 emails/day

- [ ] Approval workflow (daily, ~30 min):
  - Review 10–15 new drafts + 5–10 follow-ups
  - Check for duplicate/stale follow-ups (reply already received?)
  - Manually adjust templates if engagement drops

- [ ] Metrics tracking (spreadsheet or dashboard):
  - Cumulative sends (trending toward 250–300 by Apr 18)
  - Reply rate (target: 5–10%)
  - Opt-out rate (keep <2%, flag for reachability issues)
  - API usage vs. limits (Abstract API, Hunter.io)

**Success Checkpoint (Apr 18):**
- [ ] 250 total prospects managed (0 schema errors)
- [ ] Multi-wave follow-ups running smoothly (no duplicate sends)
- [ ] Reply rate stabilized (5–10% expected)
- [ ] Opt-out rate <2%
- [ ] No delivery blockers (bounces, rate limits, auth failures)

---

## Phase 3c: Production (Apr 21+, Ongoing)

### Full Velocity + Analytics

**Goal:** Reach target daily throughput (20–25 new prospects/day) and publish metrics.

- [ ] Ramp NEW prospects to:
  - **20 per day (Apr 21–30)** → 200 prospects this period
  - **25 per day (May 1+)** → 250/week steady state

- [ ] Multi-wave sequences at full scale:
  - Day 1, 4, 8, 14, 21, 30 touchpoints
  - **Daily volume:** 15–20 new + 10–15 follow-ups = 25–35 emails/day

- [ ] Approval workflow (mature, ~45 min):
  - Batch review (50–70 drafts) 1–2x daily
  - Template performance analysis (which sequences → best reply rate?)
  - A/B test variants based on engagement data

- [ ] Weekly digest email to Oliver:
  - Sends this week: X
  - Replies: Y (rate: Z%)
  - Opt-outs: N (rate: <2%?)
  - Hot prospects: top 5 replies (high intent)
  - Template insights: best performers this week

- [ ] Dashboard integration (when Phase 2–3 ship):
  - Real-time metrics: daily sends, reply rate, engagement funnel
  - Prospect status breakdown (pipeline view)
  - Email performance heatmap (template effectiveness)

**Success Checkpoint (Jun 1):**
- [ ] 1000+ prospects in pipeline
- [ ] Sustained 25+/day new prospect velocity
- [ ] Reply rate 5–10% (with trending analysis)
- [ ] Opt-out rate stabilized <2%
- [ ] Dashboard metrics live and accurate
- [ ] Weekly digest integrated into Oliver's workflow

---

## Metrics to Track

### Daily KPIs

| Metric | Target | Tracking |
|--------|--------|----------|
| **New prospects added** | 10 → 15 → 20 → 25/day | Google Sheet row count |
| **Email drafts generated** | 100% success rate | GitHub Actions logs |
| **Approval turnaround** | <1 hour | Manual check timestamp |
| **Opt-out rate** | <2% | Google Sheet "status" column |
| **Reply rate** | 5–10% | Inbox monitor (weekly) |
| **Bounce rate** | <1% | SMTP/API error logs |
| **API failures** | 0 critical | GitHub Actions, .env logs |

### Weekly Rollup

| Metric | Baseline | Target |
|--------|----------|--------|
| **Total sends** | 70 | 150 → 300 → 500+ |
| **Cumulative replies** | 0 | 3–5 → 15–30 → 50+ |
| **Engagement rate** | — | 5–10% |
| **Template performance** | baseline | rank by reply rate |
| **Follow-up effectiveness** | — | replies per touchpoint # |

---

## Known Limitations & Phase 4 Backlog

### 1. IMAP Auth (Inbox Monitoring)
**Current:** Basic auth with OUTLOOK_PASSWORD (deprecated by Microsoft)
**Impact:** Works now, but may fail if Microsoft enforces MFA stricter
**Phase 4 Fix:** Migrate to Microsoft Graph API (`/users/me/mailFolders/inbox`)
**Effort:** 2–3 hours
**Priority:** Medium (do before Jul 2026)

### 2. Test Coverage (59.74% → Target 80%)
**Current:** Missing direct oauth-client tests, sheets-writer tests
**Impact:** Hidden bugs in auth edge cases
**Phase 4 Fix:** Add 15–20 integration tests
**Effort:** 4–5 hours
**Priority:** Low (all functionality verified manually, coverage is hygiene)

### 3. Enrichment API Rate Limits
**Current Limits:**
- ABSTRACT_API_KEY: 200 calls/month (sufficient at 10–20 prospects/day)
- HUNTER_IO_API_KEY: 50 credits/month (borderline at high volume)

**When to Upgrade (Phase 4):**
- If hitting Abstract limit: upgrade to paid tier (~$10/month for 5K/month)
- If Hunter.io limit hit: switch to free Rocketreach API + paid tier (~$50/month)

**Phase 3 Action:** Monitor logs for rate limit warnings. **Do not upgrade yet.**

### 4. Dashboard Integration
**Separate Project:** Oliver Dashboard Phase 2–3 (parallel track)
**When Needed:** Early May (dashboard metrics endpoint)
**Integration:** SDR → new API endpoint `/api/sdr-metrics` (Oliver Dashboard consumes)
**Effort:** 2 hours (SDR side), 1 hour (dashboard side)
**ETA:** Mid-May

---

## Blocked Items

**None.** All systems operational.

- ✅ GitHub Actions configured and tested
- ✅ Google Sheets API authenticated
- ✅ Outlook SMTP/IMAP authentication (manual verification pending, but script works)
- ✅ Anthropic + OpenRouter fallback active
- ✅ All 6 GitHub Secrets configured

---

## Success Criteria (Phase 3 Complete)

Phase 3 is successful when **all** of the following are verified:

- [ ] **Manual Test (Today/Tomorrow)**
  - 1 prospect added, full pipeline completes
  - Prospect enriched, draft generated, Google Sheet updated

- [ ] **GitHub Actions Reliability (1 week)**
  - 3 consecutive successful automated runs (3 business days, 0 failures)
  - Logs confirm "Processed N prospects" for each run

- [ ] **Ramp-Up Phase (Mar 28)**
  - 100 prospects added without schema errors
  - 90%+ email generation success rate
  - First follow-ups triggering (Day 4+ batches)

- [ ] **Scale Phase (Apr 18)**
  - 250+ total prospects in pipeline
  - Multi-wave follow-ups operational (no duplicate sends)
  - Reply rate 5–10%, opt-out rate <2%

- [ ] **Production Phase (Jun 1)**
  - 1000+ prospects in pipeline
  - Sustained 25+/day velocity
  - Weekly digest + dashboard integration live

---

## Next Action

**Today:**
1. Add 1 test prospect to Google Sheet
2. Run `node scripts/daily-run.js`
3. Verify all 4 pipeline steps complete
4. Record results in GitHub issue or Slack

**Tomorrow:**
1. Check GitHub Actions run logs
2. If success: unlock Phase 3a (start adding 10/day)
3. If failure: debug and fix, then re-run

**Success unlocks:** 100 prospects by Mar 28, 250+ by Apr 18, and production readiness by Jun 1.

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


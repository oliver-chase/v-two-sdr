# SDR System — Product & Strategy Review

**Date:** 2026-03-11 | **Reviewer Role:** Product Expert | **Status:** Ready for Validation

---

## Executive Summary

**What's Right:**
- Clear data flow (Google Sheet → enrichment → personalized sends → monitoring)
- Human approval gate (Kiana controls all sends, prevents spam)
- Quality over volume (10/day personalized > 50/day templated)
- OpenClaw has business context and continuity
- Git-based transparency (all approvals logged)

**Critical Questions:**
1. **Baseline prospect quality?** How many prospects do you have? What's the quality threshold?
2. **Enrichment scope?** What % are missing data? Enrichment time estimate?
3. **Success metric?** Replies ≠ qualified leads. What's the actual business goal?
4. **Follow-up sequence?** How are Template D/E executed with daily manual approvals?
5. **Reply handling SLA?** When [HOT] flag fires, who does the follow-up conversation?
6. **Personalization sustainability?** Can OpenClaw write 10 contextual emails/day consistently?

---

## Strategic Assessment

### The Core Assumption

**You're building a *relationship-driven* outreach system, not a *volume-driven* one.**

This is correct for V.Two:
- You're not a high-volume SaaS sales org
- Prospects care about personalization + fit
- You have niche positioning (AI, product, engineering)
- You want "warm introductions disguised as cold outreach"

**BUT:** This requires:
1. **High-quality prospect list** (not just names)
2. **Deep context** (understanding why THIS prospect + THIS angle)
3. **Consistent personalization** (not template-based)
4. **Fast feedback loops** (reply rates, what works)

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Baseline quality unknown** | 🔴 HIGH | Kiana defines quality threshold BEFORE enrichment starts |
| **Enrichment time underestimated** | 🟡 MEDIUM | Measure: How long to enrich 10 prospects? (Is it 1 hour or 4 hours?) |
| **Reply rate targets unrealistic** | 🟡 MEDIUM | Industry baseline for cold B2B outreach is 2-5%. 5-10% is optimistic. |
| **Personalization burnout** | 🔴 HIGH | Writing 10 contextual emails/day for weeks burns out agents. Need breaks/iteration. |
| **Follow-up sequence broken** | 🟡 MEDIUM | Template D/E need automation OR daily Kiana approval (pick one) |
| **[HOT] lead handoff unclear** | 🔴 HIGH | Who does the "next call" after positive reply? OpenClaw? Human? |
| **Kiana approval bottleneck** | 🟡 MEDIUM | If she rejects 3/10 sends, does OpenClaw re-select and re-propose? Re-approval loop? |
| **Small sample size testing** | 🟡 MEDIUM | 10/day = 2-3 replies/week. Too small to measure template effectiveness. |

---

## Questions That Must Be Answered First

### 1. Prospect Baseline
**Current state:**
- How many prospects in Google Sheet? (50? 200? 1000?)
- What % have complete data? (email, LinkedIn, title, company info)
- What's the quality bar? (How do we know they're worth contacting?)

**Action:** Kiana audits the sheet. Documents:
- Total count
- Data completeness %
- Quality assessment (% are real prospects vs. false leads)

### 2. Enrichment Scope
**Current state:**
- What data is missing? (Emails? LinkedIn? Company details? Buying signals?)
- How long does OpenClaw take to enrich 10 prospects? (Is it 30 min or 3 hours?)

**Action:** OpenClaw enriches 10 test prospects. Documents:
- Time per prospect
- Data sources used
- Success rate (% were enrichable)
- Estimated time for full list

### 3. Business Success Metric (Not Just Replies)
**Current spec:** "5-10% reply rate"

**What you ACTUALLY need:**
- Replies → Qualified replies (how do you define "qualified"?)
- Qualified replies → Meetings booked
- Meetings → Pipeline (# of active deals)
- Pipeline → Revenue (deal size, win rate)

**Action:** Kiana + OpenClaw define:
- What's a "qualified" reply? (Technical buyer? Budget? Timeline?)
- What's the conversion funnel? (Replies → Meetings → Deals → $)
- What's the revenue target? (If you need $X in deals, how many sends does that require?)

**Example:**
```
Target: $500K pipeline by end of Q2 (12 weeks)
Avg deal size: $50K
Deals needed: 10
Win rate assumption: 20%
Meetings needed: 50
Meeting close rate: 30%
Qualified replies needed: 166
Reply rate needed: 5% (given 3300 sends)
Daily send target: ~40/day for 12 weeks
[This would require 4x the current 10/day plan]
```

### 4. Follow-Up Sequence Clarity
**Current gap:** Template D/E are defined but unclear how they execute.

**Questions:**
- Does OpenClaw propose Template D in daily send-plan.md (like first sends)?
- Or does OpenClaw auto-send Template D on day 5 (without Kiana approval)?
- If Kiana must approve each follow-up, that's 40 approvals/week (10 initial + 30 follow-ups). Is that sustainable?

**Action:** Choose one:
- **Option A:** All sends (including follow-ups) go through Kiana approval gate
- **Option B:** Initial sends need approval; follow-ups auto-execute on schedule (Template D day 5, E day 12)

### 5. Reply Handling & Escalation
**Current gap:** [HOT] flag is set, but then what?

**Questions:**
- When OpenClaw flags [HOT] (positive reply), does OpenClaw respond or does Kiana?
- What's the SLA? (Reply within 2 hours? Same day? Next day?)
- Who owns the sales conversation? (OpenClaw drafts? Kiana sends?)
- When does it become a "real" sales cycle (CRM, deal tracking, etc.)?

**Action:** Define the handoff:
```
Hot Reply Flow:
1. OpenClaw flags [HOT] in SDR_STATE.md + notifies Kiana
2. Kiana reviews reply within 2 hours
3. Kiana either:
   a) Drafts response to be sent by OpenClaw
   b) Takes over conversation directly
   c) Assigns to human SDR / AE
4. Prospect moves from SDR system to CRM / sales pipeline
```

### 6. Personalization Sustainability
**Current assumption:** OpenClaw can write 10 contextual emails/day for months.

**Reality check:**
- Writing good personalized emails requires: research (prospect), context (V.Two), angle (fit)
- 10/day = 50/week = 200/month
- At 4-6 min per email (research + write + merge), that's 6-10 hours/week of cognitive work
- Sustainable for 4 weeks? Maybe. For 12 weeks? Probably not.

**Action:** Plan for iteration:
- Week 1-2: OpenClaw writes all 10 (learn the angles)
- Week 3-4: Batch template variations (create 3-4 angle templates, apply to prospects)
- Week 5+: Refine based on reply data (kill low-performing angles, double-down on winners)

---

## Recommended Team Structure

### Phase 1: Setup & Validation (Week 1)

**Kiana (Product/GTM Owner)**
- Audit Google Sheet (prospect count, quality, data completeness)
- Define business success metric (what does "success" mean for V.Two?)
- Define qualified reply (buyer title, budget, timeline?)
- Set revenue target + working backwards to send volume target
- Approve MSAL + Google Sheets setup
- Create/approve Template A

**OpenClaw (Enrichment & Execution)**
- Enrich 10 test prospects (measure time, success rate)
- Propose Template A (cold subject + body)
- Build first send-plan.md
- Test Outlook authentication

**Claude Code (Infrastructure & Validation)**
- Complete Google Sheets API integration (sync-from-sheets.js)
- Test: Read Google Sheet → validate → export to prospects.json
- Verify dashboard endpoints work

**Gate before proceeding:**
- ✅ Baseline prospect data documented
- ✅ Business success metric defined
- ✅ Enrichment time estimate < 1 hour per 10 prospects
- ✅ Template A approved
- ✅ MSAL authentication working
- ✅ Google Sheets sync working

### Phase 2: Pilot (Week 2-3)

**Kiana (Approval & Strategy)**
- Review send-plan.md daily (10 prospects/day)
- Mark [APPROVED] / [REJECTED]
- Monitor replies (watch for patterns)
- Refine Template A based on first 20 replies
- Document what's working vs. not

**OpenClaw (Execution & Learning)**
- Execute approved sends (40 total in 4 days)
- Monitor inbox
- Categorize replies
- Log learnings (what subjects work? which companies reply?)
- Iterate Template A based on feedback

**Claude Code (Visibility)**
- Dashboard shows: # sent, # replies, reply rate
- No intervention needed

**Success criteria:**
- 40 sends completed
- 2-10 replies (5-25% reply rate on small sample)
- At least 1 qualified positive reply
- Template A refined based on data
- Kiana approval bottleneck identified/addressed
- Enrichment routine established

### Phase 3: Scale (Week 4+)

**Kiana (Strategy & Selective Approval)**
- Move from daily approval to pattern approval (approve "types" rather than every send)
- Focus on hot leads (respond to [HOT] flags)
- Measure: Pipeline generated, meetings booked
- Strategic pivots (change angles, target new segments)

**OpenClaw (Autonomous Execution)**
- Daily send-plan.md (can be more standardized templates as patterns emerge)
- Inbox monitoring (can flag [HOT] but less surprise needed)
- Follow-up sequences (auto-execute Template D/E)
- Weekly reporting

**Claude Code (Analytics & Insights)**
- Dashboard shows: Cohort analysis (sends by week, reply rates, patterns)
- Help identify what's working

---

## Success Definition (Not Just "Reply Rate")

### Week 1-2 (Pilot)
- ✅ 40 sends executed with quality (personalized, on-brand)
- ✅ 2-10 replies (5-25% expected on small sample)
- ✅ 1+ qualified positive reply
- ✅ Kiana can sustainably review 10 prospects/day
- ✅ Enrichment is <1 hour per batch

### Week 3-4
- ✅ 80 sends total
- ✅ 4-8 qualified replies (5-10%)
- ✅ 1-2 meetings booked
- ✅ Template A / B tested (know which works better)
- ✅ Follow-up sequence working (Template D generating some re-engagements)

### Month 2+
- ✅ ~250 sends/month
- ✅ 5-10% reply rate sustained
- ✅ 2-5 meetings/week
- ✅ Pipeline growing
- ✅ Revenue impact measurable

---

## Critical Decisions Before Starting

### Decision 1: Prospect Count
**Ask Kiana:** How many prospects are currently in the sheet?
- If <100: Enrichment takes 1 week. Then 2-3 months of sustain.
- If 100-500: Enrichment takes 2 weeks. Then longer sustained run.
- If >500: Too many to enrich manually. Need automation or filtering.

**Recommendation:** Start with top 100 (highest-fit prospects). Enrich those. Prove model. Then expand.

### Decision 2: Success Metric
**Ask Kiana:** What's the actual business goal?
- Option A: "I just want qualified conversations (meetings booked)"
- Option B: "I want to build a funnel and measure pipeline impact"
- Option C: "I want to test messaging and learn what angles work"

This changes the entire success definition.

### Decision 3: Kiana's Time Budget
**Ask Kiana:** How many hours/week can you spend on approvals?
- 1 hour/day (5 hours/week) = 10 prospects/day sustainable
- 2 hours/day (10 hours/week) = 20 prospects/day possible
- >2 hours/day = Unsustainable, need to reduce volume or get help

If she's maxed at 10/day, that's the hard limit. Plan for that.

### Decision 4: Reply Handling SLA
**Ask Kiana:** When [HOT] flag fires, how fast do you need to respond?
- <2 hours: Very fast, human-like response
- <4 hours: Same-day response
- <24 hours: Next-business-day response

This determines whether OpenClaw can handle it or needs human handoff.

---

## Recommended Go/No-Go Gates

### Before Phase 1 Starts
- [ ] Prospect baseline audited (count, quality, data %)
- [ ] Business success metric defined (not just "replies")
- [ ] Kiana's time budget committed (# hours/week for approvals)
- [ ] Reply handling SLA defined (who responds, how fast)
- [ ] All credentials ready (MSAL, Google Sheets)

### After Phase 1 Week 1
- [ ] 10 test prospects enriched
- [ ] Enrichment time estimated (<1 hour per batch?)
- [ ] Template A drafted and approved by Kiana
- [ ] Outlook authentication verified
- [ ] Google Sheets sync verified

### After Phase 2 Week 2 (Pilot)
- [ ] 40 sends executed
- [ ] Reply rate in 5-25% range (industry-normal for cold B2B)
- [ ] At least 1 qualified positive reply
- [ ] Kiana approval process working without bottleneck
- [ ] Dashboard shows metrics

### Decision: Proceed to Scale or Iterate?
- **If metrics are good:** Scale to 15-20/day (or whatever Kiana can sustain)
- **If metrics are weak:** Debug before scaling (wrong angles? bad prospects? poor email quality?)
- **If Kiana is overloaded:** Reduce volume or change approval model

---

## Deployment Recommendation

### Team Roles

**Kiana = Strategy & Gatekeeper**
- Not tactical execution
- High-level decisions: targets, success metrics, pivots
- Approval gate (ensures quality)
- Hot lead owner (takes over conversations)
- Executive sponsor

**OpenClaw = Executioner & Learner**
- Enrichment (fills data gaps)
- Sends (executes daily after Kiana approval)
- Monitoring (categorizes replies)
- Reporting (weekly metrics)
- Cannot change strategy without Kiana approval

**Claude Code = Infrastructure & Visibility**
- Keeps data clean (validates, deduplicates)
- Keeps systems running (Google Sheets sync, Outlook)
- Provides dashboards (so everyone sees results)
- Suggests optimizations (but doesn't execute)

### Success Requires

1. **Kiana owns the strategy** (not OpenClaw deciding who to target)
2. **OpenClaw is disciplined** (follows Kiana's approval, doesn't improvise)
3. **Fast feedback loops** (daily replies monitored, weekly learnings)
4. **Clear metrics** (everyone knows what success means)
5. **Iterative refinement** (template A doesn't work? Try B next week)

---

## Red Flags to Watch

🚩 **Kiana too busy to review sends** → System breaks. Reduce volume immediately.
🚩 **Hot leads sitting unanswered** → Defeats purpose. Define SLA and meet it.
🚩 **Reply rate drops week 2-3** → Something broke (wrong targets? poor template?). Debug before scaling.
🚩 **OpenClaw inventing new angles without approval** → Kills brand consistency. Require Kiana sign-off.
🚩 **No meetings booked after 100 sends** → Model might not work for your market. Pivot fast.

---

## Next Steps

1. **Kiana:** Schedule 1-hour sync to answer the 6 critical questions above
2. **Document answers** in a Decision Log (becomes source of truth)
3. **Complete Phase 1 setup** (credentials, templates, baseline)
4. **Run Phase 2 pilot** (40 sends, measure results)
5. **Make go/no-go decision** (scale or iterate)

**Until these decisions are made, the system is not ready to launch.**

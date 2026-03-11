# SDR Project — Master Brief

**Company:** V.Two | **Status:** Week 1 — Ramp Phase | **Owner:** Kiana + OpenClaw + Claude Code

---

## Session Protocol

Load and follow `skills/project-protocol/SKILL.md`. Then:
- Start from current phase and task in PROGRESS.md — skip everything before it
- For any outreach work: read `skills/work-outreach/SKILL.md` and `team/members/sdr/persona_soul.md`
- Update PROGRESS.md before stopping
- Report: model used, tokens consumed, actions completed

---

## Project Purpose

**Goal:** Generate qualified sales pipeline for V.Two through B2B outreach

**Approach:** Three positioning tracks (AI Enablement, Product Maker, Pace Car) to different buyer personas

**Budget:** 4-week ramp (target 500+ prospects researched, 200+ qualified, 25 sends/week by week 4)

---

## Positioning Tracks

**Track 1: AI Enablement** — Enterprise CTOs/CDOs struggling with AI at scale
- Hook: "We build what's missing for AI to work at scale"
- Message: Infrastructure, governance, ROI, cost control

**Track 2: Product Maker** — Founders and product-focused CTOs
- Hook: "We own the product build so you don't have to split attention"
- Message: End-to-end ownership, shipping, velocity

**Track 3: Pace Car** — Engineering leads needing senior capacity
- Hook: "Senior engineers who slot in and accelerate what you're already building"
- Message: Augmentation, no commitment, AI co-pilot

---

## Phase 1: Week 1-2 Ramp

**OpenClaw:** Research 300+ prospects (web_search, LinkedIn, email validation)
**Claude Code:** Validate, deduplicate, flag issues in prospects.json
**SDR:** Build send list, prepare templates, get Kiana approval
**Target:** 10-15 sends/week

**Deliverables:**
- prospects.json with 300+ entries (track, status, contact info)
- Email templates A-C (cold outreach) ready for review
- Send approval workflow documented
- Weekly report template

---

## Phase 2: Week 3-4 Scale

**OpenClaw:** Expand to 500+ prospects, monitor reply patterns
**Claude Code:** Analyze send metrics, optimize workflows
**SDR:** Increase sends to 25/week, test variations
**Target:** 25 sends/week, 5-10% reply rate

**Deliverables:**
- 500+ prospect database
- A/B test results on templates
- Reply tracking logs
- Weekly success metrics

---

## Phase 3: Week 5+ Optimization

**Focus:** Highest-reply templates, refined track assignment, new messaging variations
**Goal:** Consistent pipeline generation, improve conversion downstream

---

## Data Structure

**prospects.json** (TOON format)
```
prospect[N]{firstName,lastName,company,title,email,linkedin,location,timezone,track,status,dateAdded,notes}
```

**outreach/sends.json** — Full send log (recipient, template, subject, date, reply status)
**outreach/opt-outs.json** — Permanent opt-out list (immediate action)
**outreach/weekly-reports.json** — Friday EOD summaries

---

## Workflows

**Weekly Cycle:**
- **Monday AM:** OpenClaw researches, Claude Code validates, SDR prepares send list
- **Tue-Thu:** Kiana reviews → approves → SDR schedules → monitor replies
- **Friday EOD:** Compile report, log opt-outs/bounces

**Send Approval (Non-Negotiable):**
1. SDR prepares (who, title, company, template, why)
2. Kiana approves/revises
3. SDR executes (never autonomous)
4. Monitor replies same day
5. Weekly report Friday EOD

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Prospect research | 500+ | Week 1 starting |
| Qualified prospects | 200+ | In progress |
| Weekly sends | 25/week | Starting 10-15 |
| Reply rate | 5-10% | TBD |
| Opt-out rate | <2% | TBD |

---

## Key Files & Team

**Project Files:** See `SKILL.md` for detailed structure
**SDR Persona:** `team/members/sdr/persona_soul.md`
**Outreach Skills:** `skills/work-outreach/SKILL.md`
**JTBD:** `skills/jtbd/SKILL.md` (buyer job-to-be-done)

**Agents:**
- **OpenClaw:** Research, web_search, email validation
- **Claude Code:** Data validation, tooling, workflow testing
- **SDR Persona:** Coordination, approval workflow, execution

---

## Token Budget

- OpenClaw research: 3-5k tokens/week
- Claude Code validation: 1-2k tokens/week
- SDR coordination: 500-1k tokens/week

---

**Last Updated:** 2026-03-11 | **Next Review:** Week 1 Checkpoint

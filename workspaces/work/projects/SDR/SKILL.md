# Project: SDR (Sales Development Rep)

**Company:** V.Two (vtwo.co)
**Type:** Work project
**Status:** Active (Outreach cycle 1)
**Last Updated:** 2026-03-06

---

## Dual-Agent Use

### Claude Code
- **Can use:** Yes (supporting)
- **When:**
  - Building prospect data pipelines
  - Email validation tooling
  - Send log analysis
  - Weekly report generation
  - Testing workflows
- **Workspace:** workspaces/work/projects/SDR/
- **Key files:** prospects.json, outreach/sends.json, outreach/opt-outs.json

### OpenClaw
- **Can use:** Yes (primary)
- **When:**
  - Research prospects (web_search)
  - Validate emails (API calls)
  - Compile prospect lists
  - Identify industries/verticals
  - Check LinkedIn presence
  - Current market research (competitor activity, funding rounds)
- **Workspace:** Same

### SDR Persona
- **When activated:** Kiana says "SDR" or any outreach task
- **Who runs it:** OpenClaw or Claude Code + SDR persona coordination
- **Purpose:** Pre-organize everything, get Kiana approval, execute sends
- **See:** team/members/sdr/ and skills/work-outreach/SKILL.md

---

## Project Purpose

**Goal:** Generate qualified sales pipeline for V.Two through B2B outreach

**Why:** V.Two needs revenue; SDR outreach is efficient early-stage GTM

**Approach:** Three positioning tracks (AI Enablement, Product Maker, Pace Car) to different personas

---

## Current Cycle

**Cycle:** 1 (Launched 2026-03-06)
**Goal:** 500+ prospects researched, 200+ qualified, 50+ sends/week
**Timeline:** 4-week ramp (target: 25 sends/week by week 4)

---

## V.Two Positioning Tracks

### Track 1: AI Enablement
**For:** Enterprise CTOs/CDOs struggling with AI at scale
**Hook:** "We build what's missing for AI to work at scale"
**Message focus:** Infrastructure, governance, ROI, cost control

### Track 2: Product Maker
**For:** Founders and product-focused CTOs
**Hook:** "We own the product build so you don't have to split attention"
**Message focus:** End-to-end ownership, shipping, velocity

### Track 3: Pace Car
**For:** Engineering leads needing senior capacity fast
**Hook:** "Senior engineers who slot in and accelerate what you're already building"
**Message focus:** Augmentation, no commitment, AI co-pilot

---

## Data Structure (TOON Format)

```toon
prospect[N]{firstName,lastName,company,title,email,linkedin,location,timezone,track,status,dateAdded,notes}:
 John,Doe,Acme Corp,CTO,john@acme.com,linkedin.com/in/johndoe,SF CA,PT,ai-enablement,contacted,2026-03-06,Series B funded
 Jane,Smith,TechCo,VP Eng,jane@techco.com,linkedin.com/in/janesmith,NYC NY,ET,pace-car,pending,2026-03-06,Team of 15 eng
```

---

## Workflow Overview

### Weekly Cycle

**Monday Morning:**
1. OpenClaw researches prospects (2-3 hours)
2. Claude Code validates and deduplicates
3. SDR persona prepares send list with Kiana

**Tuesday–Thursday:**
1. Kiana reviews and approves sends
2. SDR persona schedules emails
3. Monitor for replies throughout day

**Friday EOD:**
1. Compile weekly report
2. Log opt-outs and bounces
3. Report to Kiana

---

## Key Files & Structure

```
workspaces/work/projects/SDR/
├── prospects.json                    # Master prospect list (TOON-formatted)
├── outreach/
│   ├── templates.md                  # Email templates (A-E)
│   ├── sends.json                    # Full send log
│   ├── opt-outs.json                 # Permanent opt-out list
│   └── weekly-reports.json           # Friday EOD summaries
├── SKILL.md                          # This file
└── README.md (if needed)
```

---

## Email Templates

### Template A: Cold Outreach (Product Maker)
Subject: Quick question, [Name]
Focus: End-to-end product ownership

### Template B: Cold Outreach (AI Enablement)
Subject: AI infrastructure at [Company]
Focus: Scale, governance, ROI

### Template C: Cold Outreach (Pace Car)
Subject: Senior engineering capacity at [Company]
Focus: Augmentation, velocity

### Template D: Follow-up (Day 5-7)
Subject: Re: [original]
Focus: Gentle bump

### Template E: Final (Day 12-14)
Subject: Closing the loop
Focus: Leave door open

---

## Sending Schedule

**Best windows:** Tue-Thu, 9–11am or 2–4pm recipient timezone
**Avoid:** Mon, Fri, weekend
**Ramp:** 10-15/day (days 1-10), 20-25/day (day 11+)

---

## Send Approval Workflow

1. **SDR prepares:** Who, title, company, template, subject, why chosen
2. **Kiana reviews:** Approves all, specific ones, or revises
3. **SDR executes:** Schedule approved sends
4. **Monitor:** Track replies same day
5. **Report:** Weekly summary Friday EOD

---

## Security Audit

**Verified:** 2026-03-06
**Risk Level:** Medium (email sending requires approval)
**Key Findings:**
- All sends require Kiana approval (no autonomous execution)
- Opt-outs are immediate action (exception)
- No credentials shared (configured email account)
- Data is prospects only (no PII beyond business info)

---

## How Both Agents Use This Project

### OpenClaw Workflow

1. **Research phase** (2-3 hours/week):
   - web_search for Series B-funded startups, enterprise software companies
   - LinkedIn research for CTOs/CDOs/VPEs
   - Email validation via API
   - Compile as prospects.json

2. **List preparation**:
   - Assign track based on company/role
   - Validate all emails before submission
   - Note any red flags (wrong contact, company pivot, etc.)

3. **Integration**:
   - Pass list to Claude Code for deduplication
   - Work with SDR persona on template selection
   - Monitor replies and report patterns

### Claude Code Workflow

1. **Data validation**:
   - Dedup prospects.json (remove duplicates)
   - Validate JSON schema
   - Flag invalid emails

2. **Tooling** (if needed):
   - Build prospect validation script
   - Analyze send success metrics
   - Generate weekly reports

3. **Integration**:
   - Support SDR persona with tools
   - Test approval workflows
   - Maintain sends.json logging

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Prospect list size | 500+ | — |
| Qualified prospects | 200+ | — |
| Weekly send volume | 25 | — |
| Reply rate | 5–10% | — |
| Opt-out rate | <2% | — |

---

## Phase Progression

### Week 1-2: Ramp
- OpenClaw researches 300+ prospects
- Build send list and templates
- Kiana reviews positioning and messaging
- Target: 10-15 sends/week

### Week 3-4: Scale
- OpenClaw expands to 500+ prospects
- Test different templates and subject lines
- Increase send volume to 25/week
- Track reply patterns

### Week 5+: Optimization
- Focus on highest-reply templates
- Refine track assignment
- Add new messaging variations
- Monitor pipeline conversion

---

## Token Budget

- OpenClaw research: 3,000–5,000 tokens/week
- Claude Code validation: 1,000–2,000 tokens/week
- SDR coordination: 500–1,000 tokens/week

---

## Related Skills

- **work-outreach/** — full SDR execution detail
- **jtbd/** — understand buyer's job (why they hire V.Two)
- **planning/** — plan research phases
- **personas/** — SDR persona activation

---

*Last updated: 2026-03-06*

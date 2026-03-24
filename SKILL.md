# SDR Project

**co:** V.Two (vtwo.co)
**type:** work
**status:** Phase 2 complete, ready for prod
**updated:** 2026-03-21

## Agents

| Agent | Role | When |
|-------|------|------|
| OpenClaw | Primary | Research, API calls, daily loop orchestration |
| Claude Code | Support | Script bugs, tests, weekly reports |

## Goal

Generate B2B sales pipeline via cold outreach. Target: 25 sends/week by week 4.

## Positioning Tracks

| Track | For | Hook |
|-------|-----|------|
| AI Enablement | Enterprise CTOs/CDOs | "We build what's missing for AI at scale" |
| Product Maker | Founders, product CTOs | "We own the product build so you don't split attention" |
| Pace Car | Eng leads needing senior capacity | "Senior engineers who slot in and accelerate" |

## Daily Loop (OpenClaw)

1. Sync: Google Sheets → local cache
2. Enrich: Hunter.io (email validation), timezone, signals
3. Draft: LLM tiers (OpenRouter → Anthropic → free → template)
4. Queue: Timezone-aware (Tue-Thu 9-11 AM local)
5. Approve: Telegram → Kiana reviews drafts
6. Send: Outlook SMTP (on approval)
7. Track: IMAP replies → classify → update Sheets
8. Report: Morning summary

## TOON Schema

```
nm=name, ti=title, co=company, em=email, tz=timezone
li=linkedin, sz=size, ind=industry, fnd=funding
sig=signal, src=source, st=status, da=date_added
fc=first_contact, lc=last_contact, fuc=followup_count
nfu=next_followup, no=notes
```

## Key Files

| File | Purpose |
|------|---------|
| prospects.json | Master lead list |
| outreach/sends.json | Send log |
| outreach/opt-outs.json | Permanent opt-outs |
| outreach/queue.json | Pending sends |
| templates.md | Email templates A-E |

## Send Schedule

- **When:** Tue-Thu, 9–11 AM recipient timezone
- **Ramp:** 10-15/day (weeks 1-2), 20-25/day (week 3+)
- **Delay:** 30s between sends
- **Max:** 25/day

## Approval

1. SDR prepares: who, template, subject
2. Kiana reviews via Telegram: ✅ or ❌
3. SDR executes approved
4. Opt-outs: immediate, no approval

## Templates

- **A:** Cold (Product Maker) — end-to-end ownership
- **B:** Cold (AI Enablement) — scale, governance, ROI
- **C:** Cold (Pace Car) — augmentation, velocity
- **D:** Follow-up (day 5-7) — gentle bump
- **E:** Final (day 12-14) — leave door open

## Security

- All sends require approval (no autonomous execution)
- Opt-outs immediate exception
- Credentials in GitHub Secrets (not code)
- No PII beyond business info

## Metrics

| Metric | Target |
|--------|--------|
| Prospect list | 500+ |
| Qualified | 200+ |
| Weekly sends | 25 |
| Reply rate | 5–10% |
| Opt-out | <2% |

## Handoff

**To Claude Code:** Script bugs, test failures, code fixes
**From Claude Code:** Resume orchestration

---

**v:** 1.1 | **Updated:** 2026-03-21

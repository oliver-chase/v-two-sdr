# SDR Project

**co:** V.Two (vtwo.co)
**type:** work
**status:** Redesign complete, production ready
**updated:** 2026-03-27

## What It Is

GitHub Actions-orchestrated B2B cold outreach system. Runs fully automated
Mon-Fri. Kiana approves or rejects each draft via email before anything sends.

## Goal

Generate B2B sales pipeline via cold outreach. Target: 25 sends/week.

## Positioning Tracks

| Track | For | Hook |
|-------|-----|------|
| AI Enablement | Enterprise CTOs/CDOs | "We build what's missing for AI at scale" |
| Product Maker | Founders, product CTOs | "We own the product build so you don't split attention" |
| Pace Car | Eng leads needing senior capacity | "Senior engineers who slot in and accelerate" |

## Daily Pipeline (GitHub Actions)

1. **7:00 AM ET** — `daily-sync.yml` → sync.js → pull Sheet, flag follow-ups, write prospects.json
2. **7:30 AM ET** — `daily-draft.yml` → draft.js → ONE batched Claude Haiku call, save drafts
3. **7:35 AM ET** — approval-email.js → send digest to oliver@vtwo.co with approve/reject curl commands
4. **On approval** — `approval-handler.yml` → handle-approval.js → triggers send-approved.yml
5. **On approval / 10 AM ET** — `send-approved.yml` → send.js → Outlook send, update Sheet
6. **9 AM + 3 PM ET** — `inbox-check.yml` → inbox.js → IMAP scan, classify, update state + Sheet

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
| prospects.json | Local prospect state (synced from Sheet) |
| outreach/drafts/YYYY-MM-DD.json | Daily drafts |
| outreach/approved/ | Approved drafts awaiting send |
| outreach/sent/ | Completed sends |
| outreach/sends.json | Full send log |
| outreach/opt-outs.json | Permanent opt-outs |
| outreach/templates.md | Email templates A–E |

## Approval Flow

1. draft.js generates drafts → approval-email.js sends digest to oliver@vtwo.co
2. Each draft has APPROVE and REJECT curl commands in the email body
3. Run the curl command → triggers approval-handler.yml via GitHub workflow_dispatch
4. Approved → moved to outreach/approved/ → send-approved.yml fires immediately

## Templates

- **A:** Cold (Product Maker) — end-to-end ownership
- **B:** Cold (AI Enablement) — scale, governance, ROI
- **C:** Cold (Pace Car) — augmentation, velocity
- **D:** Follow-up (touch 2, day 5) — gentle bump
- **E:** Final (touch 3, day 12) — leave door open

## Follow-Up Sequence

- Touch 1 (initial): `email_discovered` → draft → send
- Touch 2 (day 5): `followup_due` → draft → send
- Touch 3 (day 12): `followup_due` → draft → send
- Day 19: `closed_no_reply` (terminal)

## Security

- All sends require approval (no autonomous execution)
- Credentials in GitHub Secrets + local .env (never committed)
- SDR_PAT scoped to actions:write only

## Docs

- `REDESIGN.md` — why this architecture, what was replaced
- `RUNBOOK.md` — operational guide, troubleshooting

---

**v:** 2.0 | **Updated:** 2026-03-27

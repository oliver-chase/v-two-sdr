# SDR System Architecture — Corrected

**Last Updated:** 2026-03-11 | **Status:** Redesigned for proper agent responsibilities

---

## Core Principle

**OpenClaw = Intelligence & Execution** | **Claude Code = Infrastructure & Validation** | **SDR Persona = Approval & Coordination**

---

## The Data Flow (OpenClaw → Claude Code)

```
OpenClaw Research Phase
│
├─ 1. Web search + LinkedIn + Crunchbase + Y Combinator
├─ 2. Validate emails (Hunter.io / NeverBounce API)
├─ 3. Compile prospects into CSV format
└─ 4. COMMIT: workspaces/work/projects/SDR/prospects.csv

Claude Code Validation Phase
│
├─ 5. Read prospects.csv (OpenClaw deliverable)
├─ 6. Run validate-prospects.js (check email, dedup, opt-out cross-ref)
├─ 7. Convert to TOON format → prospects.json (canonical source of truth)
└─ 8. COMMIT: workspaces/work/projects/SDR/prospects.json

OpenClaw Execution Phase
│
├─ 9. Read prospects.json (validated data)
├─ 10. Build send plan (10-15/day ramp, 25/day at scale)
├─ 11. Generate send-plan.md with full email bodies
├─ 12. Wait for Kiana approval (edit/mark [APPROVED] in markdown)
├─ 13. Execute approved sends via Graph API → Outlook
├─ 14. Monitor inbox for replies (categorize, flag, schedule follow-ups)
├─ 15. Update outreach logs (sends.json, opt-outs.json)
└─ 16. Generate weekly metrics → weekly-reports.json

Dashboard (Claude Code)
│
└─ Visualize: prospects.json, sends.json, opt-outs.json, weekly-reports.json
```

---

## File Structure (Canonical Locations)

```
workspaces/work/projects/SDR/
├── prospects.csv              ← OpenClaw writes (research output)
├── prospects.json             ← Claude Code writes (TOON, validated, canonical)
├── MASTER.md, RESEARCH_BRIEF.md, SKILL.md, etc.
├── outreach/
│   ├── templates.md           ← Email templates A-E
│   ├── sends.json             ← Execution log (TOON format)
│   ├── opt-outs.json          ← Opt-out list (TOON format)
│   ├── weekly-reports.json    ← Metrics (TOON format)
│   └── send-plan.md           ← Current approval gate (updated daily)
├── scripts/
│   ├── validate-prospects.js  ← Claude Code: CSV→JSON validation
│   └── [send/monitor scripts] ← **These belong in OpenClaw, not here**
└── SDR_STATE.md               ← Cross-session state (updated by OpenClaw)
```

**Key Rule:** One file per data source, never duplicates.

---

## TOON Format Spec (Token Optimization)

All outreach logs MUST use abbreviated keys to minimize tokens:

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
      "no": "Series B funded"
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
      "id": "s-001",
      "em": "sarah@tech.io",
      "fn": "Sarah",
      "co": "TechStartup Inc",
      "tpl": "A",
      "subj": "Quick question for you, Sarah",
      "sd": "2026-03-12T09:00:00Z",
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
  "opt_outs": [
    {
      "em": "nope@company.com",
      "fn": "John",
      "ln": "Nope",
      "co": "Company Inc",
      "ad": "2026-03-11T14:23:00Z",
      "rs": "unsubscribe",
      "no": "Replied 'remove me'"
    }
  ],
  "metadata": {
    "tot": 1,
    "lu": "2026-03-11T14:23:00Z"
  }
}
```

**Key Abbreviations:**
- `fn/ln` = firstName/lastName
- `co` = company | `ti` = title | `em` = email | `li` = linkedin
- `lo` = location | `tz` = timezone
- `tr` = track | `st` = status
- `ad` = addDate | `no` = notes
- `sd` = sentDate | `rpl` = reply | `rpl_dt` = replyDate | `rpl_st` = replyStatus | `fu_sd` = followupScheduled
- `tpl` = template | `subj` = subject | `rs` = reason
- `tot` = total | `by_tr` = byTrack | `by_st` = byStatus | `lu` = lastUpdated

---

## Agent Responsibilities

| Phase | OpenClaw | Claude Code | SDR Persona |
|-------|----------|-------------|-------------|
| **Research** | ✅ Web search, LinkedIn, validation | ✅ Validate CSV, deduplicate | - |
| **Data** | Write: prospects.csv | Write: prospects.json | - |
| **Send Planning** | ✅ Build send-plan.md, decide timing | - | Review/approve |
| **Execution** | ✅ Graph API sends, reply monitoring | - | - |
| **Approval Gate** | - | - | ✅ Edit/mark [APPROVED] |
| **Logging** | ✅ Update sends.json, opt-outs.json, SDR_STATE.md | - | - |
| **Reporting** | ✅ weekly-reports.json | ✅ Dashboard visualization | - |
| **Infrastructure** | - | ✅ validate-prospects.js, /api/sdr endpoints | - |

---

## Claude Code's Scope (Infrastructure Only)

### What Claude Code DOES:
1. **validate-prospects.js** — CSV→JSON conversion, email validation, opt-out checking, deduplication
2. **/api/sdr/metrics** — Dashboard endpoint (reads logs, returns metrics)
3. **/api/sdr/pipeline** — Dashboard endpoint (pipeline visualization)
4. **SDR_STATE.md schema** — State file documentation
5. **prospects.json schema** — TOON format spec
6. **Data structure** — File organization, format consistency

### What Claude Code DOES NOT DO:
- ❌ Email sending (OpenClaw via Graph API)
- ❌ Inbox monitoring (OpenClaw)
- ❌ Send plan generation (OpenClaw)
- ❌ Reply categorization (OpenClaw intelligence)
- ❌ Follow-up sequencing (OpenClaw logic)

---

## OpenClaw Responsibilities

### Continuous Workflow
1. **Research** — Find prospects, validate emails, compile CSV
2. **Validation Handoff** — Commit prospects.csv, trigger Claude Code validation
3. **Send Planning** — Read prospects.json, build send-plan.md, structure for Kiana approval
4. **Execution** — Execute approved sends, monitor inbox, categorize replies
5. **Logging** — Update sends.json, opt-outs.json, weekly-reports.json
6. **State Management** — Update SDR_STATE.md weekly

### Skills Needed
- **web_search** — Research prospects
- **email_validation** — Hunter.io, NeverBounce APIs
- **Graph API** — Send emails, read inbox via Outlook
- **Markdown parsing** — Read Kiana's approvals from send-plan.md
- **JSON manipulation** — Update log files
- **Business judgment** — Categorize replies (hot/cold/ooo), decide follow-ups

---

## The Approval Gate (Non-Technical)

**Process:**
1. OpenClaw generates `outreach/send-plan.md` with all candidates and full email bodies
2. OpenClaw notifies Kiana: "Send plan ready at [path]"
3. Kiana reviews: opens file, reads each prospect/email
4. Kiana edits: marks approved items with `[APPROVED]` label, rejects with comments
5. Kiana commits: `git add send-plan.md && git commit -m "approve: send-plan for {date}"`
6. OpenClaw watches: reads send-plan.md, executes `[APPROVED]` items, skips others
7. OpenClaw logs: updates sends.json with results

**No code needed for approval gate** — it's a human-readable markdown file + git commits.

---

## Success Metrics

**By Week 1 End:**
- ✅ prospects.csv has 300+ researched leads (OpenClaw)
- ✅ prospects.json has 300+ validated entries (Claude Code)
- ✅ Dashboard shows pipeline health (Claude Code)
- ✅ Send-plan.md ready for Kiana approval (OpenClaw)

**By Week 4 End:**
- ✅ 500+ total prospects in database
- ✅ 25 sends/week sustainable
- ✅ 5-10% reply rate
- ✅ Weekly metrics tracked in weekly-reports.json

---

**Next Step:** Refactor data files to match this spec (TOON format, single locations, clear handoffs).

# SDR Preservation Audit

**Date:** 2026-03-23  
**Auditor:** OpenClaw  
**Status:** Phase 2 Complete, Ready for Production  
**Constraint:** DO NOT DELETE — Document only

---

## Executive Summary

SDR is a B2B cold outreach automation system at **Phase 2 completion** (386/386 tests passing). Daily 8-step loop: sync → enrich → draft → approve → send → track → report.

**Current State:** Production-ready, awaiting first live run.

---

## File Inventory (Preservation Priority)

### 🔴 CRITICAL — Do Not Touch

| File | Purpose | Why Critical |
|------|---------|--------------|
| `SKILL.md` | Project specification | Source of truth |
| `OPENCLAW_RUNBOOK.md` | Daily execution guide | Step-by-step workflow |
| `prospects.json` | Master lead database | Revenue data |
| `outreach/opt-outs.json` | Permanent opt-outs | **Legal compliance (CAN-SPAM)** |
| `outreach/sends.json` | Send audit trail | Compliance + debugging |
| `outreach/replies.json` | Reply tracking | Sales pipeline |
| `outreach/templates.md` | Email templates A-E | Messaging |
| `scripts/daily-run.js` | Main orchestration | Entry point |
| `scripts/draft-emails.js` | Email generation | Core function |
| `scripts/send-queue.js` | Email sending | Core function |
| `scripts/inbox-monitor.js` | Reply tracking | Core function |
| `config/config.oauth.js` | OAuth credentials | Authentication |
| `config/config.sheets.js` | Google Sheets config | Data source |
| `__tests__/*.test.js` (16 files) | Test suite | 386 tests |

### 🟡 HIGH — Preserve Context

| File | Purpose | Why High |
|------|---------|----------|
| `README.md` | Entry point | Onboarding |
| `CURRENT_STATE.md` | Implementation status | Continuity |
| `SYSTEM_SPEC.md` | Technical spec | Architecture |
| `ARCHITECTURE.md` | System design | Understanding |
| `.env.example` | Secrets template | Security |
| `MASTER.md` | Project overview | Context |
| `PROGRESS.md` | Development log | History |
| `ROADMAP.md` | Future plans | Direction |

### 🟢 MEDIUM — Reference Material

| File | Purpose | Notes |
|------|---------|-------|
| `CHECKPOINT.md` | Dev checkpoint | Historical |
| `NEXT_STEPS.md` | Task list | May be outdated |
| `TEAM-MANIFEST.md` | Team roles | Reference |
| `TELEGRAM_INTEGRATION_BRIEF.md` | Integration spec | Implementation complete |
| `OPENCLAW_EMAIL_RESEARCH_STRATEGY.md` | Research notes | Historical |
| `SHEETS_WRITE_IMPLEMENTATION.md` | Sheets integration | Complete |
| `SHEETS_WRITE_QUICK_START.md` | Setup guide | For new installs |

### 📁 docs/ — Implementation History

**Purpose:** Record of how system was built

**Critical subdirectories:**
- `docs/ARCHIVE/` — Historical decisions (OAuth migration, state machine)
- `docs/TIMEZONE_CACHE_*` — Timezone implementation (5 files)
- `docs/OPENCLAW_*` — OpenClaw system design

**These document WHY decisions were made. Preserve for future maintainers.**

### ⚠️ agents/ — Nested Agent Instructions

**Status:** DUPLICATE of root agents/

**Action:** Can be consolidated to root, but **do not delete** until consolidation complete.

Files:
- `agents/CLAUDE.md`
- `agents/OPERATING_SYSTEM.md`
- `agents/ORCHESTRATOR.md`
- etc. (12 files)

---

## Story/Evolution (Must Preserve)

### Phase 0: Manual
- Kiana manually researched and sent emails
- Time-consuming, inconsistent

### Phase 1: Scripts
- Basic Google Sheets sync
- Command-line prospect add
- No automation

### Phase 2: Automation (Current)
- Full 8-step loop implemented
- Telegram approval workflow
- Hunter.io validation
- Timezone-aware scheduling
- IMAP reply tracking
- 386 tests passing

### Phase 3: Integration Tests (Planned)
- oauth-client.js integration tests
- sheets-writer.js integration tests
- Coverage: 60.97% → 80%

---

## Key Decisions (Documented in files)

1. **TOON Format** — Token optimization (40% savings)
2. **Telegram Approvals** — Async, mobile-friendly
3. **Hunter.io Validation** — Quality over quantity
4. **Timezone Scheduling** — Respect recipient (Tue-Thu 9-11am local)
5. **OAuth Migration** — Service account → OAuth 2.0

**All documented in:**
- `docs/ARCHIVE/OAUTH_MIGRATION.md`
- `docs/TIMEZONE_CACHE_ADR.md`
- `OPENCLAW_RUNBOOK.md`

---

## Dependencies (External Services)

| Service | Config Location | Status |
|---------|-----------------|--------|
| Google Sheets | `config/config.sheets.js` | Required |
| Hunter.io | Secrets | Required |
| Outlook SMTP | Secrets | Required |
| IMAP | Secrets | Required |
| Abstract API | Secrets | Required |
| Telegram | `~/.openclaw/openclaw.json` | Required |

---

## Test Coverage

**Current:** 60.97% (386/386 tests passing)

| Component | Coverage | File |
|-----------|----------|------|
| State machine | High | `__tests__/state-machine.test.js` |
| Send queue | High | `__tests__/send-queue.test.js` |
| Draft emails | High | `__tests__/draft-emails.test.js` |
| OAuth client | **0%** | (integration tests needed) |
| Sheets writer | **0%** | (integration tests needed) |

**Gap:** Phase 3 targets 80% coverage via integration tests.

---

## Data Files (JSON)

| File | Schema | Purpose |
|------|--------|---------|
| `prospects.json` | TOON | Lead database |
| `outreach/sends.json` | Log | Send audit |
| `outreach/opt-outs.json` | List | Legal compliance |
| `outreach/replies.json` | Log | Reply tracking |
| `outreach/approved-sends.json` | Queue | Approved emails |
| `outreach/timezone-cache.json` | Cache | Timezone lookups |
| `outreach/weekly-reports.json` | Reports | Metrics |

**All append-only. Never delete entries (opt-outs permanent).**

---

## Cleanup Recommendations (Non-Destructive)

### Consolidate Duplicates

**agents/ folder:** Contains 12 files duplicating root agents/

**Safe approach:**
1. Compare root agents/ vs SDR/agents/
2. If identical, update SDR docs to reference root
3. Archive SDR/agents/ (don't delete yet)

### Archive Historical Docs

**docs/ARCHIVE/** already exists. Ensure all historical decisions preserved there.

### Verify Cross-References

Check all docs reference current files (not deleted during cleanup).

---

## Access Pattern

**When OpenClaw runs SDR:**
1. Read `SKILL.md` — project spec
2. Read `OPENCLAW_RUNBOOK.md` — execution steps
3. Read `prospects.json` — leads
4. Execute `scripts/daily-run.js`
5. Write to `outreach/*.json` — logs

**Critical path:** SKILL → RUNBOOK → scripts → outreach data

---

## Continuation Notes

**Next session:** Can resume without context loss

**Checkpoints:** See `system/CONTINUATION_PROTOCOL.md`

**Fallbacks:** `kimi-k2.5:cloud` → `gemma3:4b` → `qwen2.5:7b`

---

**Audit Complete:** All files documented, context preserved, no deletions.

**Recommendation:** System is production-ready. Suggest first live run with Kiana approval.

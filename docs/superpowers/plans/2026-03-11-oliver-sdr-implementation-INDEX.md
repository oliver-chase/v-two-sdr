# Oliver Chase SDR System — Implementation Plan INDEX

> **Status:** READY FOR EXECUTION | **Created:** 2026-03-11 | **Target Completion:** 2026-03-31 (3 weeks)

**For execution:** Use `superpowers:subagent-driven-development` with parallel task dispatch OR execute chunks sequentially with checkpoints.

---

## EXECUTIVE SUMMARY

**Goal:** Build a production-grade AI Sales Development Representative persona (Oliver Chase) that lives in OpenClaw, with full Google Sheets integration, enrichment engine, email drafting, approval workflow, inbox monitoring, and metrics dashboard.

**Scope:** 8 implementation chunks across 3 phases, executing partially in parallel.

**Team:** Dev (infrastructure), FE Designer (dashboard), SDR Persona (execution coordination), OpenClaw (enrichment research).

**Architecture:**
```
Foundation (Sheets + Enrichment + State Machine) [Phase 1]
    ↓
Execution Core (Drafting + Approval) [Phase 2]
    ↓
Intelligence (Inbox + Classification) [Phase 2]
    ↓
Orchestration (CLI + Daily Flow) [Phase 3]
    ↓
Analytics (Metrics + Dashboard) [Phase 3]
```

---

## PHASE TIMELINE

| Phase | Duration | Start | Chunks | Status |
|-------|----------|-------|--------|--------|
| **Phase 1: Foundation + Cleanup** | Week 1 | Mar 11 | 1, 2, 3, 4 | 📋 READY |
| **Phase 2: Execution + Intelligence** | Week 2 | Mar 18 | 5, 6 | 📋 READY |
| **Phase 3: Orchestration + Analytics** | Week 3 | Mar 25 | 7, 8 | 📋 READY |

---

## CHUNK MANIFEST

### Chunk 1: Cleanup & File Reorganization
**Owner:** Claude Code (autonomous)
**Duration:** 2-4 hours
**Parallel:** Yes (no dependencies)
**Status:** 📋 Ready to execute
**File:** `chunk-1-cleanup-and-reorganization.md`

**Deliverables:**
- ✅ Delete outdated files (3 files)
- ✅ Consolidate & expand MASTER.md (142 → 300 lines)
- ✅ Expand ARCHITECTURE.md (~180 → 400 lines)
- ✅ Create ROADMAP.md (new)
- ✅ Rewrite PROGRESS.md (new structure)
- ✅ Git commit

---

### Chunk 2: Google Sheets Integration
**Owner:** Dev
**Duration:** 6-8 hours
**Parallel:** Yes (independent foundation layer)
**Blocks:** Chunks 5, 6, 7
**Status:** 📋 Ready to execute
**File:** `chunk-2-google-sheets-integration.md`

**Deliverables:**
- ✅ Google Sheets OAuth connector
- ✅ Dynamic schema inference & confirmation
- ✅ TOON format field mapping
- ✅ Read/write/append operations
- ✅ Full test coverage
- ✅ Git commit

**Async Dependencies:** None blocking; unblocks Chunks 5-7 when complete.

---

### Chunk 3: Enrichment Engine
**Owner:** OpenClaw + Dev
**Duration:** 8-10 hours
**Parallel:** Yes (independent foundation layer)
**Blocks:** Chunk 5, 7
**Status:** 📋 Ready to execute
**File:** `chunk-3-enrichment-engine.md`

**Deliverables:**
- ✅ Email candidate generation (pattern-based)
- ✅ MX record validation
- ✅ Deliverability checks
- ✅ Confidence scoring (0.5–0.8 → user review; ≥0.8 → auto-use)
- ✅ Web search wrapper (OpenClaw integration)
- ✅ Web fetch wrapper (company context enrichment)
- ✅ Caching logic per run
- ✅ Full test coverage
- ✅ Git commit

**Async Dependencies:** Requires OpenClaw web_search + web_fetch tools enabled.

---

### Chunk 4: State Machine
**Owner:** Dev
**Duration:** 4-6 hours
**Parallel:** Yes (independent foundation layer)
**Blocks:** Chunks 5, 6, 7, 8
**Status:** 📋 Ready to execute
**File:** `chunk-4-state-machine.md`

**Deliverables:**
- ✅ Lead state definitions (new → email_discovered → ... → closed_positive/negative)
- ✅ Transition validation & blocking
- ✅ State persistence (Google Sheet write-back)
- ✅ Minimum lead pool monitoring (< 30 alerts)
- ✅ Full test coverage
- ✅ Git commit

**Async Dependencies:** Depends on Chunk 2 (Google Sheets).

---

### Chunk 5: Execution Core (Email Drafting + Approval)
**Owner:** SDR + Dev
**Duration:** 10-12 hours
**Parallel:** No (depends on Chunks 2, 3, 4)
**Blocks:** Chunk 7
**Status:** 📋 Ready to execute (after Foundation complete)
**File:** `chunk-5-execution-core.md`

**Deliverables:**
- ✅ Email drafting engine (LLM + verified data + knowledge base)
- ✅ Knowledge base system (dynamic doc loading, live folder monitoring)
- ✅ Draft lifecycle (generated → awaiting_approval → approved/rejected/regenerated)
- ✅ Approval workflow (sdr review, approve, rewrite, regenerate, skip)
- ✅ Template management & evolution
- ✅ Full test coverage
- ✅ Git commit

**Async Dependencies:** Requires Chunks 2, 3, 4 complete + knowledge base documents available.

---

### Chunk 6: Intelligence (Inbox + Reply Classification)
**Owner:** Dev + OpenClaw
**Duration:** 8-10 hours
**Parallel:** Yes (independent from Chunk 5, depends on Chunk 4)
**Blocks:** Chunk 7
**Status:** 📋 Ready to execute (after Chunk 4 complete)
**File:** `chunk-6-intelligence-system.md`

**Deliverables:**
- ✅ Outlook / Microsoft Graph connector
- ✅ Reply classification (positive/negative/neutral/unclear/ooo; LLM-based)
- ✅ Confidence-based user prompting (>0.8 auto, 0.5–0.8 confirm, <0.5 manual)
- ✅ Out-of-office detection & sequence pause/resume
- ✅ Draft reply suggestions
- ✅ Lead state updates on reply
- ✅ Full test coverage
- ✅ Git commit

**Async Dependencies:** Requires Chunk 4 (state machine) + Outlook credentials.

---

### Chunk 7: Orchestration (CLI + Daily Flow + Alerts)
**Owner:** Dev
**Duration:** 12-14 hours
**Parallel:** No (depends on Chunks 5, 6)
**Blocks:** Nothing (final)
**Status:** 📋 Ready to execute (after Chunks 5, 6 complete)
**File:** `chunk-7-orchestration-system.md`

**Deliverables:**
- ✅ Deterministic CLI commands (sdr run, sync, review, approve, send, inbox, metrics, status, knowledge *)
- ✅ Natural Language → CLI parser (ambiguity detection + user clarification)
- ✅ 13-step daily flow automation (health check → sync → enrich → draft → classify → metrics)
- ✅ Telegram bot integration (alerts, command dispatch)
- ✅ Terminal status output
- ✅ Scheduled execution (OpenClaw daily 09:00)
- ✅ Full test coverage
- ✅ Git commit

**Async Dependencies:** Requires Chunks 5, 6 + Telegram bot token.

---

### Chunk 8: Analytics (Metrics + Dashboard)
**Owner:** FE Designer + Dev
**Duration:** 10-12 hours
**Parallel:** Yes (independent from Chunk 7, depends on Chunk 4)
**Blocks:** Nothing (final)
**Status:** 📋 Ready to execute (after Chunk 4 complete)
**File:** `chunk-8-analytics-system.md`

**Deliverables:**
- ✅ Event logging (timestamp, lead_id, event_type, email_type, industry, title, sequence_stage)
- ✅ Metrics aggregation (emails_sent, replies, reply_rate, bounce_rate, etc.)
- ✅ Industry baseline benchmarks & comparison
- ✅ Metric filters (date, industry, title, company size, sequence stage)
- ✅ Sensitive field hashing/redaction
- ✅ Dashboard UI (React components in system/dashboard)
- ✅ Dashboard API endpoints (/api/sdr/metrics, /api/sdr/pipeline)
- ✅ Full test coverage
- ✅ Git commit

**Async Dependencies:** Requires Chunk 4 (state machine) for data schema.

---

## EXECUTION DEPENDENCY GRAPH

```
Chunk 1 (Cleanup) — independent, runs anytime
    ↓
Chunks 2, 3, 4 (Foundation) — run in parallel, no dependencies
    ├─ Chunk 2 (Sheets) ─┐
    ├─ Chunk 3 (Enrichment) ─┼─→ Chunk 5 (Execution)
    ├─ Chunk 4 (State Machine) ─┤   ├─ Chunk 6 (Intelligence) ─┐
    │                       ├─→ Chunk 7 (Orchestration) ←─┘
    │                       ├─→ Chunk 8 (Analytics)
    └─ (Chunk 1 optional parallel) ←─┘
```

**Parallel Execution Groups:**
- **Group A (Phase 1):** Chunks 1, 2, 3, 4 (all parallel, independent)
- **Group B (Phase 2):** Chunks 5, 6 (parallel after Chunks 2-4 complete)
- **Group C (Phase 3):** Chunks 7, 8 (parallel after Chunks 5-6 complete for 7; Chunk 4 complete for 8)

---

## FILE CLEANUP ACTIONS (Chunk 1)

### Delete (Outdated)
```
❌ workspaces/work/projects/SDR/IMPLEMENTATION_GUIDE.md
❌ workspaces/work/projects/SDR/DEPLOYMENT_CHECKLIST.md
❌ workspaces/work/projects/SDR/PRODUCT_REVIEW.md
```

### Create/Update (New Structure)
```
✨ workspaces/work/projects/SDR/MASTER.md (expand to 300 lines)
✨ workspaces/work/projects/SDR/ARCHITECTURE.md (expand to 400 lines)
✨ workspaces/work/projects/SDR/ROADMAP.md (new, 150 lines)
✨ workspaces/work/projects/SDR/PROGRESS.md (rewrite, new structure)
```

---

## TASK TRACKING SETUP

**Total Tasks:** 8 (one per chunk)

**Task Structure:**
```
Task 1: Execute Chunk 1 (Cleanup & Reorganization)
  └─ Status: pending → in_progress → completed
  └─ No blockers
  └─ Owner: Claude Code (autonomous)

Task 2: Execute Chunk 2 (Google Sheets Integration)
  └─ Status: pending → in_progress → completed
  └─ No blockers (parallel)
  └─ Owner: Dev

Task 3: Execute Chunk 3 (Enrichment Engine)
  └─ Status: pending → in_progress → completed
  └─ No blockers (parallel)
  └─ Owner: OpenClaw + Dev

Task 4: Execute Chunk 4 (State Machine)
  └─ Status: pending → in_progress → completed
  └─ No blockers (parallel)
  └─ Owner: Dev

Task 5: Execute Chunk 5 (Execution Core)
  └─ Status: pending → in_progress → completed
  └─ Blocked by: Tasks 2, 3, 4
  └─ Owner: SDR + Dev

Task 6: Execute Chunk 6 (Intelligence System)
  └─ Status: pending → in_progress → completed
  └─ Blocked by: Task 4
  └─ Owner: Dev + OpenClaw

Task 7: Execute Chunk 7 (Orchestration System)
  └─ Status: pending → in_progress → completed
  └─ Blocked by: Tasks 5, 6
  └─ Owner: Dev

Task 8: Execute Chunk 8 (Analytics System)
  └─ Status: pending → in_progress → completed
  └─ Blocked by: Task 4
  └─ Owner: FE Designer + Dev
```

---

## PROGRESS TRACKING

**Update PROGRESS.md after each task completes:**
- Phase indicator (Phase 1 | Phase 2 | Phase 3)
- Subsystem status grid (✅ complete | 🔄 in-progress | ⏳ blocked | 📋 pending)
- Task checklist
- Blocker/Risk log
- Last updated timestamp

**Sync to Git after each chunk commit.**

---

## FILE LOCATIONS

```
docs/superpowers/plans/
├── 2026-03-11-oliver-sdr-implementation-INDEX.md (this file)
├── chunk-1-cleanup-and-reorganization.md
├── chunk-2-google-sheets-integration.md
├── chunk-3-enrichment-engine.md
├── chunk-4-state-machine.md
├── chunk-5-execution-core.md
├── chunk-6-intelligence-system.md
├── chunk-7-orchestration-system.md
└── chunk-8-analytics-system.md

workspaces/work/projects/SDR/
├── MASTER.md (UPDATED)
├── ARCHITECTURE.md (UPDATED)
├── ROADMAP.md (NEW)
├── PROGRESS.md (REWRITTEN)
├── prospects.json
├── outreach/
├── scripts/
└── [old files deleted]
```

---

## SUCCESS CRITERIA (End of 3 Weeks)

- ✅ All 8 chunks implemented, tested, committed
- ✅ Google Sheets bidirectional sync working
- ✅ Enrichment engine validates & scores all prospects
- ✅ State machine enforces lead lifecycle
- ✅ Email drafting generates verified-data-only emails with knowledge base
- ✅ Approval workflow tested with Kiana sign-off
- ✅ Inbox monitoring detects replies, classifies them
- ✅ CLI commands functional (sdr run, sdr review, sdr approve, sdr send, etc.)
- ✅ Daily flow automation runnable (manual + scheduled)
- ✅ Dashboard shows metrics, filtered by industry/track/stage
- ✅ All code tested (Jest + integration tests)
- ✅ Documentation complete & current
- ✅ Ready for OpenClaw deployment

---

**Next:** Execute Chunk 1 (Cleanup) immediately, then dispatch Chunks 2-4 in parallel.


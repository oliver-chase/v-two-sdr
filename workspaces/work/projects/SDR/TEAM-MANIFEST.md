# SDR Phase 1 Team Manifest & Work Coordination

**Project:** Oliver Chase AI SDR System
**Phase:** 1 — Foundation + Cleanup
**Duration:** Mar 11-17 (2026)
**Owner:** Kiana (VP Strategic Growth)

---

## Team Roster & Assignments

| Role | Persona | Task/Chunks | Responsibilities |
|------|---------|------------|------------------|
| **Dev (Senior)** | dev/persona_soul.md | Chunks 2, 4, 5, 6, 7 | Core infrastructure, state machine, email drafting, orchestration |
| **OpenClaw (Research/API)** | — | Chunks 3, 6 | Web search/fetch, enrichment, inbox monitoring |
| **SDR (Execution)** | sdr/persona_soul.md | Chunk 5 approval | Lead approval workflow, tone review, send strategy |
| **FE Designer** | fe-designer/persona_soul.md | Chunk 8 | Dashboard UI, metrics visualization |
| **Architect** | architect/persona_soul.md | All phases | File structure, ARCHITECTURE.md, OPERATING_SYSTEM enforcement |
| **Test Engineer** | tester/persona_soul.md | All phases | TDD, test coverage ≥80%, Jest config |

---

## Phase 1 Chunk Assignments

### Chunk 1: Cleanup & File Reorganization ✅
- **Owner:** Claude Code (Completed)
- **Status:** DONE
- **Deliverables:** ✅ MASTER.md expanded, ARCHITECTURE.md expanded, ROADMAP.md created, PROGRESS.md rewritten
- **Files Created:** ROADMAP.md, rewritten PROGRESS.md
- **Files Deleted:** IMPLEMENTATION_GUIDE.md, DEPLOYMENT_CHECKLIST.md, PRODUCT_REVIEW.md

### Chunk 2: Google Sheets Integration (🔄 IN PROGRESS)
- **Owner:** Dev (Claude Code subagent)
- **Branch:** feature/sdr-phase1-parallel
- **Duration:** 6-8 hours
- **Assignee:** Agent ad81c1f320775ac31
- **Tech Stack:** Node.js, @google-cloud/sheets, googleapis, Jest
- **Files to Create:**
  ```
  workspaces/work/projects/SDR/sheets-connector.js
  workspaces/work/projects/SDR/config.sheets.js
  workspaces/work/projects/SDR/__tests__/sheets-connector.test.js
  ```
- **Key Tasks:**
  - [ ] OAuth connector (authenticate, refresh, store credentials securely)
  - [ ] Dynamic schema inference (detect columns → TOON field mapping)
  - [ ] Field confirmation workflow (user confirms each mapping)
  - [ ] Read operations (sync all leads from Sheet)
  - [ ] Write operations (append enriched fields, state updates, metrics)
  - [ ] Batch API optimization (respect rate limits, cache)
  - [ ] Full test coverage (unit + integration + mocks)
  - [ ] Commit with message
- **Review Gate:** Spec compliance ✓, Code quality ✓, Coverage ≥80%
- **Dependencies:** None (parallel with 3, 4)
- **Blocks:** Chunks 5, 7

### Chunk 3: Enrichment Engine (🔄 IN PROGRESS)
- **Owner:** OpenClaw + Dev (Claude Code subagent)
- **Branch:** feature/sdr-phase1-parallel
- **Duration:** 8-10 hours
- **Assignee:** Agent aab2961b34b2e0823
- **Tech Stack:** Node.js, dns module, web_search + web_fetch (OpenClaw), Jest
- **Files to Create:**
  ```
  workspaces/work/projects/SDR/enrichment-engine.js
  workspaces/work/projects/SDR/config.enrichment.js
  workspaces/work/projects/SDR/__tests__/enrichment-engine.test.js
  ```
- **Key Tasks:**
  - [ ] Email candidate generation (pattern-based from domain)
  - [ ] MX record validation (check if domain accepts mail)
  - [ ] Deliverability scoring (≥0.8 auto, 0.5–0.8 flag, <0.5 skip)
  - [ ] Web search wrapper (OpenClaw integration)
  - [ ] Web fetch wrapper (company enrichment)
  - [ ] Per-run caching (avoid duplicates within execution)
  - [ ] Confidence thresholds enforced
  - [ ] Full test coverage (unit + mocks)
  - [ ] Commit with message
- **Review Gate:** Spec compliance ✓, Code quality ✓, Coverage ≥80%
- **Dependencies:** None (parallel with 2, 4)
- **Blocks:** Chunks 5, 7

### Chunk 4: State Machine (🔄 IN PROGRESS)
- **Owner:** Dev (Claude Code subagent)
- **Branch:** feature/sdr-phase1-parallel
- **Duration:** 4-6 hours
- **Assignee:** Agent a7f4d4fbfb012b882
- **Tech Stack:** Node.js, state-machine logic, Google Sheets write-back, Jest
- **Files to Create:**
  ```
  workspaces/work/projects/SDR/state-machine.js
  workspaces/work/projects/SDR/config.state.js
  workspaces/work/projects/SDR/__tests__/state-machine.test.js
  ```
- **Lead States (8):**
  1. new
  2. email_discovered
  3. draft_generated
  4. awaiting_approval
  5. email_sent
  6. replied
  7. closed_positive
  8. closed_negative
- **Key Tasks:**
  - [ ] Define all 8 states with semantics
  - [ ] Implement transition rules (legal only)
  - [ ] Block illegal transitions (log + alert)
  - [ ] Persist to Google Sheet + JSON
  - [ ] Minimum pool monitoring (<30 → alert)
  - [ ] State query functions (filter by state, track, industry)
  - [ ] Full test coverage (all transitions, edge cases)
  - [ ] Commit with message
- **Review Gate:** Spec compliance ✓, Code quality ✓, Coverage ≥80%
- **Dependencies:** Chunk 2 (Google Sheets)
- **Blocks:** Chunks 5, 6, 7, 8

---

## File Structure & Ownership

**Project Root:** `workspaces/work/projects/SDR/`

| File | Owner | Status | Notes |
|------|-------|--------|-------|
| MASTER.md | Architect | ✅ Complete | 300 lines, all phases |
| ARCHITECTURE.md | Architect | ✅ Complete | 400 lines, 8 subsystems |
| ROADMAP.md | Architect | ✅ Complete | 140 lines, timeline |
| PROGRESS.md | Dev | 🔄 Updating | Chunk 1 complete, Chunks 2-4 in progress |
| CHECKPOINT.md | Claude Code | ✅ Complete | Session recovery guide |
| AUDIT.md | Architect | ✅ Complete | Security findings |
| TEAM-MANIFEST.md | Architect | ✅ NEW | This file (work coordination) |
| prospects.json | Data | ✅ Complete | TOON format, 500+ prospects |
| sheets-connector.js | Dev | 🔄 Building (Chunk 2) | OAuth + sync logic |
| enrichment-engine.js | OpenClaw+Dev | 🔄 Building (Chunk 3) | Email validation + enrichment |
| state-machine.js | Dev | 🔄 Building (Chunk 4) | Lead lifecycle enforcement |
| config.sheets.js | Dev | 🔄 Building (Chunk 2) | Sheet credentials, ranges |
| config.enrichment.js | OpenClaw+Dev | 🔄 Building (Chunk 3) | Confidence thresholds, patterns |
| config.state.js | Dev | 🔄 Building (Chunk 4) | State definitions, limits |
| __tests__/ | Test Engineer | 🔄 Building | Jest suite with ≥80% coverage |
| outreach/ | SDR | Existing | sends.json, opt-outs.json, weekly-reports.json |
| scripts/ | Dev | Existing | validate-prospects.js, etc. |

---

## Code Standards (From agents/OPERATING_SYSTEM.md)

**File Size Limits:**
- JavaScript files: ≤500 lines (split if exceeded)
- Test files: ≤400 lines per suite
- Markdown: ≤200 lines (split by topic)

**Data Format:**
- All data in TOON format (abbreviated keys: em, fn, ln, co, ti, tr, st, sd, rpl, etc.)
- No hardcoded values — all from config or API
- Secure credential storage (.env, not in git)

**Testing Requirements:**
- TDD mandatory (tests first, implementation second)
- Coverage minimum: 80%
- All state transitions tested
- All error paths tested
- No flaky tests

**Git Protocol:**
- Commit message format: `feat/fix: [chunk-name] — [what was done]`
- Include: `Co-Authored-By: Team Member <email>`
- One commit per chunk completion
- Branch: feature/sdr-phase1-parallel (all chunks)

---

## Cleanup Checklist (What to Remove/Update)

**From Previous Sessions:**
- ✅ IMPLEMENTATION_GUIDE.md (deleted)
- ✅ DEPLOYMENT_CHECKLIST.md (deleted)
- ✅ PRODUCT_REVIEW.md (deleted)
- ✅ system/souls/oliver-chase.md (deleted, consolidated into MASTER.md/ARCHITECTURE.md)

**What Should NOT Be Touched:**
- team/ directory (team member personas are owned by team members, not chunks)
- agents/ directory (orchestrator rules, don't modify during phase execution)
- system/souls/ (shared identity, read-only during phase execution)
- system/memory/ (session notes only, don't modify during work)

---

## Blockers & Dependencies

**Phase 1 Critical Path:**
```
Chunk 1 (Cleanup) ✅
    ↓
Chunks 2, 3, 4 (parallel, no dependencies on each other)
    ├─ Chunk 2 (Sheets) ─┐
    ├─ Chunk 3 (Enrichment) ─┤
    └─ Chunk 4 (State) ────┼─→ unblock Phase 2
```

**Known Risks:**
- Google Sheets API rate limits (mitigate: batch + cache)
- OpenClaw web_search/web_fetch availability (mitigate: fallback patterns)
- Email validation accuracy (mitigate: confidence scoring + user review)

---

## Success Criteria (End of Phase 1)

- ✅ All 3 chunks (2, 3, 4) implemented, tested (≥80%), committed
- ✅ Google Sheets bidirectional sync working
- ✅ Enrichment engine validates & scores all prospects
- ✅ State machine enforces legal transitions only
- ✅ All code in correct file locations
- ✅ PROGRESS.md updated with Phase 1 completion
- ✅ Next session can jump to Phase 2 with no gaps

---

**Last Updated:** 2026-03-12
**Created By:** Claude Code (Session 2026-03-12 20:30 UTC)
**Authority:** Kiana (VP Strategic Growth)

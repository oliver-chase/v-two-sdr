# Oliver Chase SDR System — Roadmap

**Build Start:** 2026-03-11 | **Target Completion:** 2026-03-31 | **Status:** Phase 1 Starting

---

## Three-Phase Timeline

### Phase 1: Foundation + Cleanup (Mar 11-17)
**Objective:** Build core infrastructure, clean documentation, establish baseline

**Chunks:** 1, 2, 3, 4 (parallel)

| Chunk | Component | Owner | Duration | Target Date |
|-------|-----------|-------|----------|-------------|
| 1 | Cleanup & File Reorganization | Claude Code | 2-4h | Mar 11 |
| 2 | Google Sheets Integration | Dev | 6-8h | Mar 13 |
| 3 | Enrichment Engine | OpenClaw + Dev | 8-10h | Mar 14 |
| 4 | State Machine | Dev | 4-6h | Mar 13 |

**Milestone (Mar 17):** All chunks committed, foundation tested
**Success Criteria:**
- ✅ Sheets bidirectional sync working
- ✅ Enrichment validates & scores prospects
- ✅ State machine prevents illegal transitions

---

### Phase 2: Execution + Intelligence (Mar 18-24)
**Objective:** Build email drafting and reply monitoring

**Chunks:** 5, 6 (parallel after Phase 1)

| Chunk | Component | Owner | Duration | Target Date |
|-------|-----------|-------|----------|-------------|
| 5 | Execution Core (Drafting + Approval) | SDR + Dev | 10-12h | Mar 21 |
| 6 | Intelligence (Inbox + Classification) | Dev + OpenClaw | 8-10h | Mar 22 |

**Milestone (Mar 24):** All chunks committed, approval workflow tested
**Success Criteria:**
- ✅ Drafts generate from verified data + knowledge base
- ✅ Approval workflow functional
- ✅ Inbox connector reads replies
- ✅ Replies classified + state updated

---

### Phase 3: Orchestration + Analytics (Mar 25-31)
**Objective:** Build automation and metrics

**Chunks:** 7, 8 (parallel after Phase 2)

| Chunk | Component | Owner | Duration | Target Date |
|-------|-----------|-------|----------|-------------|
| 7 | Orchestration (CLI + Daily Flow + Alerts) | Dev | 12-14h | Mar 28 |
| 8 | Analytics (Metrics + Dashboard) | FE Designer + Dev | 10-12h | Mar 29 |

**Milestone (Mar 31):** All chunks committed, system live
**Success Criteria:**
- ✅ CLI commands functional
- ✅ Daily flow automation runnable
- ✅ Dashboard shows metrics
- ✅ System ready for OpenClaw deployment

---

## Feature Rollout

### Week 1 (Mar 11-17)
- Foundation systems live (Sheets, Enrichment, State Machine)
- Documentation complete & current
- Ready for Phase 2

### Week 2 (Mar 18-24)
- Email drafting + approval workflow
- Inbox monitoring + reply classification
- Ready for Phase 3

### Week 3 (Mar 25-31)
- Full daily automation (13-step pipeline)
- Metrics dashboard
- Live on OpenClaw

---

## Dependency Graph

```
Phase 1 (Foundation)
  ├─ Chunk 1 (Cleanup) — independent
  ├─ Chunk 2 (Sheets) ─┐
  ├─ Chunk 3 (Enrichment) ─┼─ blocks Phase 2
  └─ Chunk 4 (State Machine) ─┘

Phase 2 (Execution + Intelligence)
  ├─ Chunk 5 (Drafting) ─┐
  └─ Chunk 6 (Inbox) ─────┼─ blocks Phase 3
                          │
Phase 3 (Orchestration + Analytics)
  ├─ Chunk 7 (CLI + Daily Flow) ←─┘
  └─ Chunk 8 (Metrics + Dashboard)
```

---

## Success Metrics (Final)

| Metric | Target | Current |
|--------|--------|---------|
| Prospects researched | 500+ | TBD (Week 1) |
| Prospects qualified | 200+ | TBD (Week 2) |
| Weekly sends | 25+ | TBD (Week 3) |
| Reply rate | 5-10% | TBD (Week 3) |
| Opt-out rate | <2% | TBD (Week 3) |
| Code coverage | 80%+ | TBD (Phase 1) |
| Documentation complete | Yes | TBD (Mar 31) |
| OpenClaw deployment ready | Yes | TBD (Mar 31) |

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Google Sheets API down | Blocks enrichment + state sync | Cache locally, retry with backoff |
| Enrichment low-quality | Poor email drafts | Confidence threshold (≥0.8 only) + user review |
| Reply classification ambiguous | Wrong state updates | Confidence 0.5–0.8 requires user confirm |
| Knowledge base missing | Can't draft emails | Halt drafting, alert user (not blocking) |
| Outlook API rate limits | Inbox backlog | Batch API calls, cache replies |
| Team context loss (conversation compaction) | Execution stalled | All plans saved to files, PROGRESS.md synced |

---

**Last Updated:** 2026-03-11 | **Next Check-In:** Mar 13 (Phase 1 progress)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


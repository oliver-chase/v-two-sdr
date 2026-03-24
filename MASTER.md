# SDR Project — Master Brief (EXPANDED)

**Company:** V.Two | **Status:** Phase 2 Complete ✅ | **Owner:** Kiana + OpenClaw + Claude Code
**Build:** Oliver Chase AI SDR persona (persistent, event-driven, OpenClaw runtime)
**Build Date:** 2026-03-11 | **Phase 2 Completed:** 2026-03-16 | **Phase 3 Completion Target:** 2026-03-31

---

## What is Oliver Chase?

Oliver Chase is a fully autonomous AI Sales Development Representative persona that runs 24/7 in OpenClaw. He:
- Researches prospects using web_search + enrichment
- Validates emails with deliverability checks
- Drafts personalized emails using verified data + knowledge base
- Manages an approval workflow with Kiana (no autonomous sends)
- Monitors inbox, classifies replies, suggests follow-ups
- Tracks metrics, reports weekly
- Runs a daily automation pipeline (13 steps)

**Difference from "SDR persona":** SDR persona is execution-focused with human approval gates. Oliver Chase is a full system living in OpenClaw with infrastructure, enrichment, intelligence, and analytics.

---

## Session Protocol

**Before running any SDR work:**
1. Load `skills/project-protocol/SKILL.md`
2. Load `team/members/sdr/persona_soul.md` (execution coordinator)
3. Load this file + ARCHITECTURE.md + PROGRESS.md
4. Update PROGRESS.md before stopping
5. Report: model used, tokens consumed, actions completed

---

## Team Roles & Responsibilities

| Role | Agent | Primary Tasks | Responsibilities |
|------|-------|---------------|------------------|
| **Infrastructure Lead** | Dev (Claude Code) | Foundation systems (Sheets, Enrichment, State Machine) | Scripts, validation, core logic, testing |
| **Execution Coordinator** | SDR Persona | Approval workflow, sequencing, execution | Approval gates, template iteration, Kiana coordination |
| **Research & Enrichment** | OpenClaw | Web search, email validation, company context | Prospect research, web_fetch, compliance checks |
| **Dashboard & Analytics** | FE Designer | Metrics dashboard, visualizations | UI/UX, React components, design system |
| **Orchestrator** | Claude Code (you) | Planning, dispatch, progress tracking, documentation | Plan coordination, task management, file integrity |

---

## Three-Phase Execution

### Phase 1: Foundation + Cleanup ✅ COMPLETE (Mar 11-17)
**Goal:** Build infrastructure, clean files, establish baseline

**Chunks:** 1, 2, 3, 4
- ✅ Chunk 1: Cleanup & file reorganization
- ✅ Chunk 2: Google Sheets bidirectional integration
- ✅ Chunk 3: Enrichment engine (email validation, web search)
- ✅ Chunk 4: Lead state machine (lifecycle enforcement)

---

### Phase 2: Execution + Intelligence ✅ COMPLETE (Mar 16)
**Goal:** Build email drafting and reply monitoring

**Chunks:** 5, 6, 7
- ✅ Chunk 5: Email drafting + approval workflow
- ✅ Chunk 6: Inbox monitoring + reply classification
- ✅ Chunk 7: CLI commands + daily flow + orchestration

**Completed:** 375/375 tests passing, all systems production-ready

---

### Phase 3: Analytics (Week 3, Mar 25-31)
**Goal:** Build daily automation metrics and dashboard

**Chunks:** 8
- 📋 Chunk 8: Event logging + metrics aggregation + dashboard UI

**Target:** 2026-03-31

---

## Architecture Decisions

### Agent Division (Corrected)
- **Claude Code** = Infrastructure & validation (stateless, ephemeral)
- **OpenClaw** = Research & execution (stateful, continuous, intelligent)
- **SDR Persona** = Approval coordinator (gating approval, signature)

### Data Source of Truth
- **prospects.json** (TOON format) = Canonical lead database
- **Google Sheet** = Live copy, synced bidirectionally
- **sends.json, opt-outs.json, weekly-reports.json** = Event logs (TOON format)

### Token Optimization
- Enrichment, routing, state transitions = deterministic (no LLM)
- Email drafting, reply classification, NL parsing = LLM-only
- Caching per run, process only new/updated leads

---

## Positioning Tracks (Lead Segmentation)

**Track 1: AI Enablement** — Enterprise CTOs/CDOs scaling AI
Hook: "We build what's missing for AI to work at scale"
Message: Infrastructure, governance, ROI, cost control

**Track 2: Product Maker** — Founders/product CTOs
Hook: "We own the product build so you don't have to split attention"
Message: End-to-end ownership, shipping, velocity

**Track 3: Pace Car** — Engineering leads needing senior capacity
Hook: "Senior engineers who slot in and accelerate what you're already building"
Message: Augmentation, no commitment, AI co-pilot

---

## Daily Workflow (13-Step Pipeline)

1. Validate connector health (Sheets, Outlook, Telegram, web_search)
2. Sync Google Sheet → load all leads
3. Enrich missing data (web_search, web_fetch, email validation)
4. Load knowledge base documents
5. Generate email drafts for eligible leads
6. Queue drafts for approval
7. Scan inbox, classify replies
8. Update lead states on replies
9. Append events to event log
10. Write back to Google Sheet
11. Recompute metrics aggregates
12. Output status (Terminal + Telegram)
13. Prompt for pending approvals/classifications

---

## Success Metrics (Phase Targets)

| Metric | Week 1 | Week 2 | Week 3 | Final |
|--------|--------|--------|--------|-------|
| Prospect research | 300+ | 500+ | 500+ | 500+ |
| Qualified prospects | In progress | 200+ | 200+ | 200+ |
| Weekly sends | 0 | 10-15 | 25+ | 25+ |
| Reply rate | N/A | N/A | 5-10% | 5-10% |
| Opt-out rate | N/A | N/A | <2% | <2% |

---

## Key Files (Updated Locations)

**Documentation:**
- `workspaces/work/projects/SDR/MASTER.md` (this file, 300 lines)
- `workspaces/work/projects/SDR/ARCHITECTURE.md` (400 lines)
- `workspaces/work/projects/SDR/ROADMAP.md` (new, 150 lines)
- `workspaces/work/projects/SDR/PROGRESS.md` (rewritten, new structure)
- `team/members/sdr/persona_soul.md` (SDR execution persona)
- `system/souls/oliver-chase.md` (Oliver Chase full persona)

**Implementation Plans:**
- `docs/superpowers/plans/2026-03-11-oliver-sdr-implementation-INDEX.md`
- `docs/superpowers/plans/chunk-1-*.md` through `chunk-8-*.md`

**Code (Scaffold Only):**
- `workspaces/work/projects/SDR/prospects.json` (TOON format, canonical)
- `workspaces/work/projects/SDR/outreach/` (sends, opt-outs, reports)
- `workspaces/work/projects/SDR/scripts/` (validation, connectors)

---

## Token Budget (Weekly)

- OpenClaw research: 3-5k tokens
- Dev infrastructure: 2-3k tokens
- SDR coordination: 1k tokens
- Dashboard/analytics: 1-2k tokens
- **Total:** 7-11k tokens/week

---

**Last Updated:** 2026-03-11 | **Next Review:** Phase 1 Checkpoint (Mar 17)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


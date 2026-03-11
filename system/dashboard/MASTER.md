# Oliver Dashboard — Master Brief

**Owner:** Claude Code (dev) + Kiana (product) | **Status:** Phase 2 ✅ Complete | **Next:** Phase 3

---

## Session Protocol

Load and follow `skills/project-protocol/SKILL.md`. Then:
- Start from the current phase and task in PROGRESS.md — skip everything before it
- For any UI work: read `skills/frontend-design/SKILL.md` before writing any component, self-review against it before committing
- Update PROGRESS.md before stopping
- Report: model used, tokens consumed, test suite count, test pass/fail count

---

## Problem & Solution

**Problem:** Kiana needs visibility into multi-agent Oliver system:
- No token usage trends or cost visibility
- Manual team/agent structure lookups
- Documentation scattered across repository
- No instrumentation gap tracking
- Invisible system learning (memory files)
- Errors/warnings buried in projects

**Solution:** Web-based command center (React + Vite + Express) that surfaces complete system state.

---

## Architecture & Design

**Tech Stack:**
- Frontend: React 18, Vite, CSS variables (design-system.css)
- Backend: Express.js, Node.js
- Database: SQLite (events, dismissed recommendations)
- Testing: Jest + React Testing Library (80%+ coverage target)
- API Format: TOON (token-optimized, 60-70% reduction)

**Design:** Light theme only (pink palette, no dark mode, no icons/emoji). Reference `skills/frontend-design/SKILL.md` and `system/dashboard/docs/DESIGN_STANDARDS.md`.

**Data Sources:** workspaces/, team/members/, system/souls/, system/memory/, skills/, agents/shared-instructions.md

See detailed specs: `system/dashboard/docs/ARCHITECTURE.md`, `system/dashboard/docs/API_REFERENCE.md`

---

## Phase 1: Core Scaffold ✅ COMPLETE

**Status:** Live on localhost:5173 | **Tests:** 59/59 passing

**Deliverables:**
- RefreshBar (timestamp + manual refresh)
- OrgChart (expandable: Kiana → agents → personas)
- SkillsPanel (21 skills, searchable)
- DocsBrowser (recursive MD tree + file viewer)
- AliasPanel (slash command reference)
- UsageTips (Claude vs OpenClaw guide)

**API Endpoints:** /health, /team, /skills, /aliases, /docs, /file, /memory, /agents, /souls (7→9 endpoints)

---

## Phase 2: Infrastructure & ControlPanel ✅ COMPLETE

**Status:** Complete | **Tests:** 124/124 passing (16 suites)

**Deliverables (8 independent components):**
1. ControlPanel — 3-tab container (Configuration, Plugins, Audit Trail) + localStorage state + URL params
2. ConfigEditor — Dynamic fields, diff preview, audit logging, required field validation
3. PluginsManager — Optimistic toggle, rollback, bulk enable/disable, filtering
4. AuditTrail — 30-day config history, timezone, date/type filters, CSV export, pagination
5. TokenChart — 30-day bar chart (real token data + model context)
6. ModelUsage — Model breakdown with plain-language descriptions
7. CostCalculator — Per-project, per-agent costs (Haiku $0.80/1M, Sonnet $3/1M, Opus $15/1M)
8. TrendAnalysis — 7/30-day moving averages + projection

**Critical Fixes Applied:**
- ✅ Removed emoji (text/spacing only)
- ✅ Exposed agent instructions (/api/agents, /api/agent/:name)
- ✅ Exposed soul files (/api/souls, /api/soul/:name)
- ✅ Token parsing enabled (real data, not hardcoded 0)
- ✅ SQLite schema defined (instrumentation, recommendations)

---

## Phase 3: Intelligence & Advanced Views 📋

**Project Views:**
- Development: progress, roadmap, blockers, files, token usage, activity
- Execution: metrics, time filtering (today/range/full)
- State transition retains all instrumentation

**Agent & Persona Explorer:**
- Full multi-layer navigation (orchestrator → souls → personas → skills → team → relationships)
- Startup protocol and handoff structure visible
- Each entity links to documentation

**Intelligence Layer:**
- Continuously analyzes instrumentation, error patterns, metrics
- Detects gaps: no events, no metrics, abnormal tokens, high errors, stale projects, missing docs
- Produces structured recommendations (severity, target, category, action)
- Dismissed recommendations stored (don't reappear unless newly detected)

**Memory View:**
- Recent entries (system/memory/YYYY-MM-DD.md)
- Lessons log (system/memory/lessons.md)
- Agent attribution

**Global Analytics:**
- Token usage time-series
- Model distribution (context per model)
- Tool invocation frequency

---

## Phase 4: Error Surface, Handoff & Operator Intelligence 📋

**Projects & Explorers:**
- Projects List: all projects from workspaces/, lifecycle state, last activity, errors/warnings
- Project Detail: lifecycle-aware views (Development vs Execution), state transition retains all data
- Agent & Persona Explorer: multi-layer repo structure, master/detail layout, documentation links visible

**Intelligence Layer:**
- Continuous analysis of instrumentation, errors, patterns
- Proactive evaluation of new projects/agents
- Structured recommendations (severity, target, category, action)
- Dismissed recs stored (don't reappear unless newly detected)

**Documentation System:**
- Inline editing and appending (no external links)
- Flag for agent review (written back to file)
- Lives inside dashboard

**Error & Handoff Surfaces:**
- System-wide errors/warnings (project-agnostic, sortable)
- Active/recent handoffs logged (timestamp, agents, state, success/failure)
- Failed handoffs surface in error view

**Alias Registry:**
- Searchable by keyword and intent
- Conversational descriptions (not technical)

**Memory View:**
- Recent entries with agent attribution
- Lessons log (persistent learning record)
- Read-only with clear labeling

**Persistent UI:**
- Last refresh time, timezone, manual refresh trigger always visible
- Auto-refresh on page load

---

## Phase 5: Operator Experience Layer 📋

**Navigation Architecture:**
- Structured sidebar: Command Center, Projects, Agents, Intelligence, Analytics, Memory, Documentation, Aliases, Settings
- Inline expansion for Projects/Agents (no drawer/modal)
- Active state: --accent-100 background + 3px --accent-600 left border
- Breadcrumbs on deep views
- Operator always knows path back to system context

**Command Center Home:**
- First view on load — answers without clicking: running?, needs attention?, what changed?
- Four zones: system health (stat blocks), active alerts, recent activity (20 events), current session
- First-run shows plain explanation (not technical checklist)

**Global Search:**
- Always accessible in top bar
- Searches: projects, documents, memory, aliases, errors, agents, personas, skills
- Works on partial keywords and descriptions
- Results grouped by type, labeled in plain language
- Cmd+K focuses input (Mac)

**Activity Feed:**
- Full chronological view, newest first
- Filterable by: agent, project, event type, date range
- Shows: timestamp (local TZ), agent, project, event type, summary
- Pagination: 100/page, client-side CSV export

**Operator Actions Pattern:**
- Available: pause/resume project, force handoff, dismiss recommendation, flag docs, save edits, append docs
- Destructive actions require ConfirmDialog (show what happens)
- All actions logged (timestamp, actor, action, target)
- Visible success and failure states with plain-language explanations

---

**Detailed specs:** See `docs/ROADMAP.md` and `docs/PRD.md` for Phase 4-5 complete specifications and empty state copy.

---

## Success Criteria

| Phase | Criteria | Status |
|-------|----------|--------|
| 1 | 5 panels, 7→9 endpoints, real data | ✅ Complete |
| 2 | 80%+ coverage, ControlPanel functional, TOON optimization | ✅ 124/124 tests |
| 3 | Intelligence layer, all views accessible, continuity visible | 📋 Ready |
| 4 | Errors surfaced, handoffs visible, complete system state | 📋 Ready |

---

**Last Updated:** 2026-03-11

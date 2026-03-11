# Oliver Dashboard — PRD

**Status:** Phase 1 ✅ | Phase 2 🔨 | Phase 3-4 📋 | **Owner:** Kiana | **Last Updated:** 2026-03-10

---

## Problem

Kiana needs visibility into the multi-agent Oliver system. Currently:
- No token usage trends or cost visibility
- Manual team/agent structure lookups
- Documentation scattered across repository
- No way to track instrumentation gaps
- Impossible to see what system has learned across sessions
- Errors/warnings buried in individual projects

---

## Solution: Oliver Dashboard

Web-based command center (React + Vite + Node API) that surfaces complete system state.

---

## Phase 1: Core Scaffold ✅

**Status:** Complete and live on localhost:5173

**Features:**
- RefreshBar (last-updated timestamp, manual refresh)
- OrgChart (expandable: Kiana → agents → personas)
- SkillsPanel (all 21 skills, searchable)
- DocsBrowser (recursive MD tree + file viewer)
- AliasPanel (slash command reference)
- UsageTips (Claude vs OpenClaw guide)

**API Endpoints:** /health, /team, /skills, /aliases, /docs, /file, /memory

---

## Phase 2: Infrastructure & Refactoring 🔨 READY

**Chunk 8 (8 independent tasks):**

1. **ControlPanel Container** — 3 tabs with local storage state + URL params for direct linking
2. **ConfigEditor** — Dynamic field rendering, diff preview, audit logging
3. **PluginsManager** — Optimistic toggle, rollback on failure, bulk actions, filtering
4. **AuditTrail** — 30 days history, local timezone, date/type filters, CSV export, pagination (50/page)
5. **TokenChart** — 30-day bar chart with real token data and model context
6. **ModelUsage** — Breakdown with plain-language descriptions (when/why each model is used)
7. **CostCalculator** — Per-project, per-agent costs with trend indicator
8. **TrendAnalysis** — 7/30-day moving averages + projection (clearly labeled estimate, graceful degradation)

**Critical Fixes Applied:**
- ✅ Emoji removed (text/spacing only)
- ✅ Agent instructions exposed (/api/agents, /api/agent/:name, /api/shared-instructions)
- ✅ Soul files exposed (/api/souls, /api/soul/:name)
- ✅ Token parsing enabled (real data, not zeros)
- ✅ SQLite schema for events/recommendations

---

## Phase 3: Intelligence & Advanced Views 📋

**Project Views**
- **Development state:** progress, roadmap, blockers, files, token usage, tool usage, start time, activity
- **Execution state:** operational analytics, custom metrics, time filtering (today/range/full history)
- Transition retains all instrumentation history and documentation

**Agent & Persona Explorer**
- Full multi-layer: orchestrator → souls → personas → skills → team → relationships
- Navigable without losing context
- Startup protocol and handoff structure visible
- Each entity links to documentation

**Intelligence Layer**
- Continuously analyzes instrumentation, manifests, error patterns
- Detects gaps: no/minimal events, no custom metrics, abnormal token usage, high error rates, stale projects, missing docs
- Produces structured recommendations: severity, target, category, plain-language description, suggested action
- Dismissed recommendations stored (don't reappear unless newly detected)

**Documentation System**
- Inline editing, append, flag for agent review
- Flagged docs recognized by agents in future sessions
- Lives inside dashboard (not external)

**Memory View**
- Recent memory entries from system/memory/YYYY-MM-DD.md
- Lessons log (system/memory/lessons.md)
- Which agent wrote what

**Global Analytics**
- Token usage time-series visualization
- Model distribution with plain-language context per model
- Tool invocation frequency across system

---

## Phase 4: Error Surface, Handoff & Operator Intelligence 📋

Builds on Phase 3 foundation. Sequence by dependency: Projects → Explorers → Intelligence → Error/Handoff surface → Memory.

**Projects List & Detail Views**
- Discover all projects from workspaces/ directory
- Development view: progress, roadmap, blockers, token/tool usage, activity
- Execution view: operational metrics, time filtering, state transition retains all instrumentation
- Lifecycle-aware rendering (no generic project page)

**Agent & Persona Explorer**
- Full multi-layer: orchestrator → souls → personas → skills → team → relationships
- Master/detail layout
- Entity documentation links inside dashboard
- Startup protocol and handoff structure visible

**Intelligence Layer**
- Continuous analysis of instrumentation, errors, patterns
- Proactive evaluation of new projects/agents
- Structured recommendations (severity, target, category, action)
- Dismissed recommendations stored in SQLite

**Documentation System**
- Inline editing and appending
- Flag for agent review (written to file)
- Integrated into dashboard

**System-Wide Error & Warning Surface**
- All errors/warnings in one place (project-agnostic)
- Sortable by severity, type, timestamp, project
- Empty state: "No active errors or warnings."

**Handoff Visibility**
- Active/recent handoffs logged
- Shows: timestamp, from/to agent, state, success/failure
- Failed handoffs also surface in error view

**Alias Registry**
- Searchable by keyword and intent
- Conversational descriptions ("way a person explains to colleague")
- Discoverable for unknown commands

**Memory View**
- Recent entries with agent attribution
- Lessons log (persistent learning record)
- Read-only

**Persistent UI**
- Last refresh time and timezone always visible
- Manual refresh on every view
- Auto-refresh on page load

---

## Phase 5: Operator Experience Layer 📋

Builds on Phase 4 completeness. Sequence: Navigation → Command Center → Search → Feed → Actions.

**Navigation Architecture**
- Structured sidebar: Command Center, Projects, Agents, Intelligence, Analytics, Memory, Documentation, Aliases, Settings
- Projects/Agents expand inline when active
- Active state: --accent-100 background + --accent-600 left border
- Breadcrumbs on deep views
- Operator always knows path back to system context

**Command Center Home**
- First view on load
- Four zones: system health (stat blocks), active alerts, recent activity (20 events), current session
- Answers three questions without clicking: running?, needs attention?, what changed?
- First-run shows plain explanation, not technical checklist

**Global Search**
- Always in top bar
- Searches projects, documents, memory, aliases, errors, agents, personas, skills
- Results grouped by type
- Works on partial keywords and descriptions
- Cmd+K focuses input (Mac)

**Activity Feed**
- Full chronological view, newest first
- Filterable by agent, project, event type, date range
- Shows: timestamp (local TZ), agent, project, event, summary
- Pagination 100/page, CSV export
- Empty: "No activity recorded yet. This feed will populate once an agent begins working on a project."

**Operator Actions**
- Pause/resume project, force handoff, dismiss recommendation, flag docs, save edits, append docs
- Destructive actions require ConfirmDialog
- All actions logged (timestamp, actor, action, target)
- Visible success and failure states

---

## Design & Tech

**Design:**
- Light theme only (pink palette, no dark mode)
- Clean, precise, readable
- Typography and spacing carry visual hierarchy
- No decorative elements, no emoji, no icons

**Tech Stack:**
- Frontend: React 18, Vite, CSS variables
- Backend: Express.js, Node.js
- Database: SQLite (instrumentation, dismissed recommendations)
- Testing: Jest + React Testing Library (80%+ coverage)
- API Format: TOON (token-optimized, 60-70% reduction)

**Data Sources:**
- workspaces/ (projects)
- team/members/ (personas)
- system/souls/ (identity, constraints)
- system/memory/ (continuity)
- agents/shared-instructions.md (handoff protocol)
- Skills/ directory (21 capabilities)

---

## Success Criteria

**Phase 1:** ✅ Complete (5 panels, 7 endpoints, real data)
**Phase 2:** 80%+ test coverage, ControlPanel functional, 60-70% token reduction
**Phase 3:** Intelligence layer detects observability gaps, all views accessible, system continuity visible
**Phase 4:** All errors surfaced globally, handoffs visible, user sees complete system state

---

**Owner:** Claude Code (dev) + Kiana (product)

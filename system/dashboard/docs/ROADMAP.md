# Oliver Dashboard — Roadmap

**Last Updated:** 2026-03-10 | **Model Default:** Haiku | **Status:** Phase 1 ✅ | Phase 2 🔨 Ready | Phase 3-4 📋

---

## Phase 1: Core Scaffold ✅ SHIPPED

**Status:** Complete, live on localhost:5173

**Features:** RefreshBar, OrgChart, SkillsPanel, DocsBrowser, AliasPanel, UsageTips
**Endpoints:** 7 (health, team, skills, aliases, docs, file, memory)
**Tests:** 59/59 passing
**Design:** Pink palette, light theme, WCAG AA

---

## Phase 2: Infrastructure & ControlPanel 🔨 READY

**8 Independent Tasks (execute with Chunk-driven development):**

1. **ControlPanel** — 3 tabs (Configuration, Plugins, Audit Trail) + local storage state + URL params
2. **ConfigEditor** — Dynamic fields, diff preview, audit logging
3. **PluginsManager** — Optimistic toggle, bulk enable/disable, filtering
4. **AuditTrail** — 30 days, local timezone, filters, CSV export, pagination
5. **TokenChart** — 30-day bar chart (real data, model context)
6. **ModelUsage** — Model breakdown (plain-language descriptions)
7. **CostCalculator** — Per-project, per-agent costs (Haiku $0.80/1M, Sonnet $3/1M, Opus $15/1M)
8. **TrendAnalysis** — 7/30-day MA + projection (graceful degradation)

**Critical Fixes Pre-Chunk 8:** ✅ Emoji removed, endpoints added, parsing enabled

**Test Coverage:** 80%+ threshold
**API Optimization:** TOON format (60-70% reduction)

---

## Phase 3: Intelligence & Advanced Views 📋

**Project Views**
- Development: progress, roadmap, blockers, files, token usage, activity
- Execution: metrics, time filtering (today/range/full)
- Transition retains all instrumentation history

**Agent & Persona Explorer**
- Full multi-layer (souls, personas, skills, relationships)
- Startup protocol & handoff structure visible
- Navigable without losing context

**Intelligence Layer**
- Continuous analysis (instrumentation, manifests, errors)
- Detects gaps: no events, no metrics, abnormal tokens, high errors, stale projects, missing docs
- Recommendations: severity, target, category, description, action
- Dismissed recs stored (don't reappear unless newly detected)

**Memory View**
- Recent entries (system/memory/YYYY-MM-DD.md)
- Lessons log (system/memory/lessons.md)
- Agent attribution

**Global Analytics**
- Token time-series
- Model distribution (plain-language context per model)
- Tool invocation frequency

---

## Phase 4: Error Surface, Handoff & Operator Intelligence 📋

**Build order:** Projects List → Project Detail Views → Agent Explorer → Intelligence Layer → Documentation → Alias Registry → Errors/Handoffs → Memory

**Projects List View**
- All projects from workspaces/ directory
- For each: name, lifecycle state, last activity, active errors/warnings
- Click to open lifecycle-appropriate detail view
- Empty state: "No projects found in the workspaces directory. Create a project folder there and Oliver will pick it up automatically."

**Project Detail Views**
- Read lifecycle state from project manifest, render correct view
- Development: progress, roadmap, blockers, issues, files, token/tool usage, start time, activity patterns, paused state
- Execution: operational analytics, project-specific metrics (generic by type/unit), time filtering (today/range/full history)
- Transition retains all instrumentation, documentation, analytics — nothing resets

**Agent & Persona Explorer**
- Multi-layer repo structure: orchestrator → souls → personas → skills → team → relationships
- Master/detail layout — full list visible while viewing entity
- Each entity links to documentation inside dashboard
- Startup protocol & handoff structure visible

**Intelligence Layer**
- Analyzes instrumentation, manifests, error patterns continuously
- Evaluates projects/agents proactively (not just reactive)
- Dedicated System Intelligence view with structured recommendations
- Triggers: no/minimal events, no custom metrics, abnormal tokens, error rate threshold, stale development, missing docs
- Recommendation format: severity, target, category, plain-language description, suggested action
- Dismissed recommendations in SQLite — don't reappear unless newly detected

**Documentation System**
- Inline editing (no separate edit mode)
- Append to documents without replacing
- Flag for agent review (written back to file)
- Lives inside dashboard, not externally linked

**Alias Registry**
- Searchable by keyword, intent, description
- Conversational entries — way a person explains to colleague, not technical definitions
- Discoverable for unknown commands

**System-Wide Error & Warning Surface**
- All errors/warnings regardless of lifecycle state
- Sorted by recency, filterable by project/severity
- Empty state: "No active errors or warnings."

**Handoff Visibility**
- Active/recent handoffs logged
- Each shows: timestamp, from agent, to agent, state passed, success/failure
- Failed handoffs also surface in error view

**Memory View**
- Recent entries with date, content, agent attribution
- Lessons log (persistent learning record)
- Read-only with clear label: "Memory is written by agents during active sessions. This view is read-only."
- Empty state: "Nothing here yet. Memory entries are written by agents at the end of active sessions."

**Persistent UI Elements**
- Top bar: last refresh time, timezone, manual refresh trigger
- Auto-refresh on page load

---

## Phase 5: Operator Experience Layer 📋

**Build order:** Navigation → Command Center → Global Search → Activity Feed → Actions → Empty States

**Navigation Architecture**
- Structured sidebar: Command Center, Projects, Agents, Intelligence, Analytics, Memory, Documentation, Aliases, Settings
- Projects/Agents expand inline when active — no drawer/modal
- Active item: --accent-100 background + 3px --accent-600 left border
- Breadcrumbs in top bar (≥2 levels deep): Section / Subsection
- Operator always knows how to get back to system context

**Command Center — Home View**
- First view on load — answers without clicking: running?, needs attention?, what changed?
- Four zones:
  * System health: stat blocks for active agents, dev projects, execution projects, open warnings
  * Active alerts: errors/warnings by severity, each links to source. Empty: "No active alerts. System is running normally."
  * Recent activity: last 20 system events, newest first (what, which agent, which project, local timestamp)
  * Current session: active agent, work item, duration, model in use. Empty: "No active session."
- First-run: centered card with plain explanation, not technical checklist

**Global Search**
- Always in top bar — always accessible
- Searches: projects, documents, memory, aliases, errors, agents, personas, skills
- Results grouped by type, labeled in plain language
- Works on partial keywords and descriptions
- Cmd+K focuses input (Mac) — documented in alias registry
- Empty: "No results for [query]. Try a different keyword or check the alias registry."

**Activity Feed**
- Full chronological view, newest first
- Filterable by: agent, project, event type, date range
- Shows: timestamp (local TZ), agent, project, event type, plain-language summary
- Pagination: 100/page, client-side CSV export
- Empty: "No activity recorded yet. This feed will populate once an agent begins working on a project."

**Operator Actions Pattern**
- Available: pause/resume project, force handoff, dismiss recommendation, mark actioned, flag doc, save inline edit, append doc
- Destructive actions require ConfirmDialog (show what happens in plain language)
- Every action logged: timestamp, actor (operator), action, target
- Every action shows: visible success state + visible failure state (plain-language explanation)

**Empty States (Final Shipped Copy)**
- Use exact language provided in phase specs — tone is final
- Write for operator understanding, not technical completeness

---

## Technical Foundation

**Database (SQLite):**
- `events` — Config changes, plugin toggles, handoffs, errors
- `dismissed_recommendations` — Intelligence layer dismissed alerts

**New Endpoints (Phase 2):**
- `/api/agents` — Agent list with roles
- `/api/agent/:name/instructions` — Agent INSTRUCTIONS.md
- `/api/shared-instructions` — Shared rules
- `/api/souls` — Soul files list
- `/api/soul/:name` — Specific soul file

**Data Sources:**
- workspaces/ (projects)
- team/members/ (personas)
- system/souls/ (identity)
- system/memory/ (continuity)
- skills/ (21 capabilities)

---

## Token Budget by Phase

| Phase | Model | Budget | Notes |
|-------|-------|--------|-------|
| 1 | Haiku | ✅ 4.2k | Complete |
| 2 | Haiku | 15k | Chunk 8 |
| 3 | Haiku | 20k | Intelligence + views |
| 4 | Haiku | 10k | Error/handoff surface |

**Total:** ~50k tokens (Haiku only, never Opus)

---

**Owner:** Claude Code (dev) + Kiana (product)

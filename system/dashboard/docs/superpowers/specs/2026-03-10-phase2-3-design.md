# Oliver Dashboard — Phase 2-3 Complete Design Spec

**Version:** 1.0 (Final)
**Date:** 2026-03-10
**Owner:** Claude Code (Orchestrator)
**Status:** APPROVED FOR IMPLEMENTATION

---

## Executive Summary

Phase 2-3 transforms the dashboard from a read-only monitor into a **control center** for the Oliver agent system. Users (Kiana) can:
- View real-time token usage and costs
- Manage Claude Code configuration (model defaults, skills, budgets)
- Install/enable/disable plugins safely
- Audit all system changes
- Search globally across documentation
- Export reports for compliance/analysis

**Phase 2 Focus:** Code quality + core features + control panel
**Phase 3 Focus:** Token analytics + power-user features

---

## Phase 2: Code Quality + Core Features + Control Panel

### 2A: Code Refactoring (Required Foundation)

**Extract Custom Hooks:**
- `useFetchData(endpoint)` — Consolidate 4 duplicate fetch patterns (SkillsPanel, AliasPanel, DocsBrowser, OrgChart)
  - Returns: `{ data, loading, error, refetch }`
  - Includes TOON → full format conversion
- `useExpandedNodes(initialIds)` — Consolidate 2 tree expansion patterns (OrgChart, DocsBrowser)
  - Returns: `{ expandedNodes, toggleNode, expandAll, collapseAll }`
- `useLocalStorage(key, defaultValue)` — Persist user settings (favorites, collapsed panels)
  - Returns: `[value, setValue]` (React hooks pattern)

**Extract Reusable Components:**
- `SearchInput` — Search input with debouncing, clear button, loading state
- `ErrorBanner` — Error display with icon, message, retry action
- `LoadingState` — Spinner with message, respects prefers-reduced-motion
- `ConfirmDialog` — Confirmation modal (for edits, deletions, plugin toggles)
- `Modal` — Base modal component (for org chart details, skill details, control panel sections)

**Extract Utilities:**
- `constants.js` — Team IDs, persona IDs, initial expanded nodes, hardcoded skill mappings (consolidate from server)
- `filterHelpers.js` — Search/filter logic (debounce, fuzzy search, category filter)
- `responseNormalizer.js` — Convert TOON format responses to full object format
- `tokenCalculator.js` — NEW: Calculate token costs, trends, projections

**Add Test Infrastructure:**
- `jest.config.js` — Jest configuration with 80%+ coverage threshold
- `__tests__/setup.js` — Global test setup (mocks, fixtures)
- `__tests__/server.test.js` — All 14 endpoints tested (including new ones)
- `__tests__/security.test.js` — Path traversal, injection, auth tests
- `__tests__/components/*.test.jsx` — Component tests (OrgChart, SkillsPanel, DocsBrowser, ControlPanel)

**Fix React Issues:**
- Replace array indices with stable IDs in OrgChart, AliasPanel, DocsBrowser
- Use `key={item.id}` instead of `key={idx}`
- Extract IDs to constants.js (prevent magic strings)

---

### 2B: Server Optimization (TOON Format)

**Implement TOON Abbreviated Keys:**

| Full | TOON | Example |
|------|------|---------|
| name | nm | `{nm: "git"}` |
| description | ds | `{ds: "Version control"}` |
| content | c | `{c: "file content..."}` |
| path | p | `{p: "skills/git/SKILL.md"}` |
| type | t | `{t: "agent"}` |
| emoji | e | `{e: "💻"}` |
| isDir | d | `{d: true}` |
| children | ch | `{ch: [...]}` |
| enabled | en | `{en: true}` |
| version | v | `{v: "5.0.0"}` |

**Update All Endpoints to TOON:**
- GET /api/team → TOON format (60% reduction)
- GET /api/skills → TOON format (60% reduction)
- GET /api/aliases → TOON format (60% reduction)
- GET /api/docs → TOON format with flattened structure (80% reduction)
- GET /api/memory → Metadata-only (parse token count from file content)

**Add Response Normalizer in Frontend:**
- `useFetchData` hook converts TOON → full format automatically
- Components receive normal objects, unaware of TOON encoding

**Parse Token Counts:**
- Read system/memory/YYYY-MM-DD.md files
- Extract token count from markdown (parse format: "**Tokens:** 42000")
- Cache results for performance
- Endpoint: GET /api/memory returns `[{date, tokens, cost}]`

**Add Pagination:**
- GET /api/file?path=...&maxLines=100 → Return only first 100 lines
- GET /api/file?path=...&maxLines=100&startLine=50 → Return lines 50-150
- Reduces memory usage for large files

---

### 2C: New Core Features

**Global Documentation Search:**
- New endpoint: GET /api/search?q=term&type=docs
- Searches: agents/, system/docs/, team/ recursively
- Returns: `[{path, title, snippet, relevance}]`
- Frontend component: SearchGlobal (collapsible search bar)

**Org Chart Modal:**
- Click team member → Modal shows:
  - Full name, role, type (human/agent/persona)
  - Brief description from persona_soul.md
  - Link to view/edit persona file
  - Skills assigned (if applicable)
  - Fallback info (who they fall back to)

**Skills Detail Panel:**
- Click skill in SkillsPanel → Modal shows:
  - Full SKILL.md content
  - Trigger phrases
  - Related skills (linked)
  - When to use (description)
  - Examples/pattern code

---

### 2D: New API Endpoints (14 total, up from 7)

**Configuration Management:**

```
GET /api/claude-config
Purpose: Read Claude Code configuration
Returns: {
  instructions: "...",        // Full agent INSTRUCTIONS.md
  memory: "...",              // User memory from .claude/memory/
  model: "claude-haiku-4-5",  // Default model
  tokenBudget: "Haiku default",
  skills: ["git", "debugging", ...],
  aliases: ["/commit", "/debug", ...]
}
Status: NEW, Phase 2
```

```
GET /api/plugins
Purpose: List installed plugins
Returns: [{
  name: "superpowers",
  version: "5.0.0",
  enabled: true,
  path: "~/.claude/plugins/superpowers/",
  description: "...",
  lastModified: "2026-03-10T10:00:00Z"
}]
Status: NEW, Phase 2
```

```
POST /api/plugins/:name
Purpose: Enable/disable plugin or install new one
Body: {
  action: "enable" | "disable" | "install",
  source: "system/skills/git/" | "https://github.com/..." (if installing)
}
Response: { success: true, message: "...", change: {from, to} }
Logs: To system/memory/audit-YYYY-MM-DD.json
Status: NEW, Phase 2
```

```
POST /api/config
Purpose: Save Claude Code configuration changes
Body: {
  section: "model" | "tokenBudget" | "skills" | ...,
  changes: {...}
}
Response: { success: true, message: "Saved" }
Logs: To audit trail
Status: NEW, Phase 2
```

```
GET /api/audit-log
Purpose: Read recent configuration changes
Query: ?limit=50&days=30
Returns: [{
  timestamp: "2026-03-10T10:15:00Z",
  agent: "claude-code",
  action: "config-change" | "plugin-toggle" | "plugin-install",
  details: {...},
  success: true
}]
Status: NEW, Phase 2
```

**Enhanced Existing:**
- GET /api/file: Add pagination (`?maxLines=100`)
- GET /api/memory: Add token parsing (return token counts)
- GET /api/search: NEW endpoint for global docs search

---

### 2E: Claude Code Control Panel

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ ⚙️  Claude Code Control Panel                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📋 Configuration                                │
│ ├─ Default Model: [Haiku ▼]                    │
│ ├─ Token Budget: [Haiku default ▼]             │
│ ├─ Skills Enabled: [Git, Debugging, ...]       │
│ │   [+ Add Skill]                              │
│ ├─ Fallback Agent: [OpenClaw →]                │
│ └─ [Edit Full INSTRUCTIONS.md] [Save]          │
│                                                 │
│ 🔌 Plugins                                      │
│ ├─ superpowers (v5.0.0) [Enabled ☑]            │
│ ├─ testing (custom) [Enabled ☑]                │
│ ├─ dashboard-refactoring [Enabled ☑]           │
│ ├─ frontend-design [Disabled ☐]                │
│ └─ [+ Install New Plugin]                      │
│                                                 │
│ 📊 Audit Trail                                  │
│ ├─ 2026-03-10 10:15 — Model changed to Haiku  │
│ ├─ 2026-03-10 09:45 — Disabled frontend-design │
│ └─ [Load More...]                              │
│                                                 │
│ ⚡ Quick Actions                                │
│ ├─ [Reset to Defaults]                         │
│ ├─ [Export Configs as JSON]                    │
│ └─ [System Health Check]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**ConfigEditor Component:**
- Read-only display of current CLAUDE.md + INSTRUCTIONS.md
- Editable fields for: default model, token budget, skills list, fallback agent
- Edit mode: Click field → text input/dropdown
- Preview change: Show what will be sent to server
- Confirmation: "Save these changes?" dialog
- Feedback: Success/error toast with timestamp
- Validation: Check model name, validate skill exists, etc.

**PluginsManager Component:**
- List all plugins from ~/.claude/plugins/
- For each: name, version, enabled toggle, [View] button
- Toggle plugin: Confirmation dialog → POST /api/plugins/:name
- [+ Install New]: Modal with:
  - Search system/skills/ directory
  - Or paste GitHub URL
  - Validate before install
  - Show what will be added
- Display last modified time + who toggled it

**AuditTrail Component:**
- Read-only list of changes (last 30 days)
- Show: timestamp, agent, action, status
- Hover/click: Show full change diff
- Filterable by: agent, action type, date range
- Export: Download as JSON/CSV

**QuickActions Component:**
- [Reset to Defaults] → Confirmation → Restore to Phase 1 baseline → Log change
- [Export Configs] → Download JSON of current INSTRUCTIONS.md + audit trail
- [System Health Check] → Ping /api/health, show status of servers

---

## Phase 3: Token Analytics + Power-User Features

### 3A: Token Analytics Dashboard

**TokenChart Component:**
- X-axis: Last 30 days (dates)
- Y-axis: Tokens per day
- Bar chart showing daily usage
- Hover: Show exact token count, cost, agent

**ModelUsage Component:**
- Pie chart: Haiku % | Sonnet % | Opus %
- Target: 85% Haiku
- If Sonnet >15%: Red alert "Switch to Haiku"
- Display on every dashboard load

**CostCalculator Component:**
- Total tokens last 30 days
- Costs per model (Haiku $0.80/1M, Sonnet $3/1M, Opus $15/1M)
- Estimated monthly/quarterly spend
- Trend: Up/down vs previous month
- Top 10 most expensive sessions

**Alerts Component:**
- "Switch to Haiku" if Sonnet >15%
- "High usage alert" if tokens exceed threshold
- "Spike detected" if daily usage +50% vs average
- Dismissible, but reappear on next load if condition persists

**TrendAnalysis Component:**
- 7-day moving average (chart)
- 30-day moving average (chart)
- Slope indicator: ↑ (increasing), → (stable), ↓ (decreasing)
- Projection: If trend continues, estimated end-of-month cost

**TopSessions Component:**
- Last 10 sessions ranked by token cost
- Show: agent, tokens used, cost, date
- Click → See what was done in that session (if notes available)

---

### 3B: Power-User Features (Phase 3)

**Favorites/Shortcuts:**
- Star icon on docs, skills, team members to favorite them
- Favorites sidebar (collapsible)
- Keyboard shortcut: Ctrl+L to jump to favorites

**Batch Search/Filter:**
- Global search bar: Searches docs + skills + team + aliases simultaneously
- Filter results by: type (doc/skill/team), date, cost, agent
- Keyboard: "/" to focus search, arrow keys to navigate results, Enter to open

**Keyboard Navigation:**
- Arrow keys: Navigate panels, expand/collapse trees
- Enter: Open selected item
- Escape: Close modals, clear search
- "/" : Focus search
- Ctrl+K: Open command palette (jump to any item)
- Ctrl+E: Export current view
- Ctrl+R: Refresh all data

**Export Functionality:**
- Export token data as CSV/JSON
- Export configs as JSON
- Export audit trail as JSON
- Export team structure as CSV
- All exports include: data + timestamp + schema version

**Dark Mode:** ❌ NOT INCLUDED (pink palette only, always)

---

## Data Flow & Dependencies

```
Dashboard Load (localhost:5173)
    ↓
App.jsx calls:
├─ /api/health (verify servers running)
├─ /api/team (org chart)
├─ /api/skills (skills panel)
├─ /api/memory (token data)
└─ /api/audit-log (audit trail)
    ↓
Components render with useFetchData hook
├─ Hook converts TOON → full format
├─ Hook enables refetch on demand
└─ Hook caches results in localStorage
    ↓
User interactions:
├─ Click skill → GET /api/file?path=skills/X/SKILL.md
├─ Search docs → GET /api/search?q=term
├─ Edit config → POST /api/config + log to /api/audit-log
├─ Toggle plugin → POST /api/plugins/:name + log to /api/audit-log
└─ Refresh → Call all endpoints again
```

---

## Team & Responsibility

| Role | Owns | Phase 2 Tasks | Phase 3 Tasks |
|------|------|---------------|---------------|
| **Claude Code (Dev)** | server.js, utils/, hooks/, __tests__/ | Refactoring, TOON optimization, new endpoints, audit logging | Token parsing, cost calculations, trend analysis |
| **FE Designer** | styles/, components appearance | ControlPanel.css, modal styling, animations | Dark mode research (defer), export UI, keyboard nav shortcuts |
| **Test Engineer** | __tests__/, coverage | Phase 2 tests (80%+ coverage), security tests for configs | Phase 3 tests, token accuracy verification |

---

## Success Metrics

**Phase 2:**
- ✅ All tests pass (80%+ coverage)
- ✅ API responses 60-70% smaller (TOON optimization measured)
- ✅ Zero React key warnings
- ✅ Control Panel fully functional (view, edit, toggle, install)
- ✅ Global docs search works across 50+ files
- ✅ Audit trail captures all changes (no data loss)
- ✅ Zero hardcoded values

**Phase 3:**
- ✅ Token counts accurate (match system/memory/ data within 0.1%)
- ✅ Cost calculations correct (verified against model rates)
- ✅ Trends calculate correctly (7-day MA, 30-day MA)
- ✅ Dashboard loads <2s, search <500ms
- ✅ Keyboard shortcuts all work
- ✅ Export creates valid JSON/CSV

---

## Technical Decisions

1. **TOON First** — Token waste is expensive. 60-70% savings enables more features within budget.
2. **Editable Configs** — Kiana needs flexibility without code changes (model defaults, skills, budgets).
3. **Read-Only Plugins** — Plugin code immutable; only activation state changes. Prevents corruption.
4. **Audit Trail** — System transparency critical. Kiana must know when/why configs changed.
5. **Favorites in Phase 3** — Phase 2 focuses on core features. Power-user shortcuts come later.
6. **Reset-Only Rollback** — Safer than reverting to arbitrary old states. Simpler to implement.
7. **Install from System/GitHub** — Support both local skills (system/skills/) and remote repos.
8. **Haiku Default Always** — Align with AGENT_OPERATING_SYSTEM rules.

---

## Acceptance Criteria

**Phase 2 Definition of Done:**
- [ ] All refactoring complete (hooks, components, constants)
- [ ] TOON format implemented on all endpoints
- [ ] 14 endpoints total (7 + 7 new)
- [ ] ControlPanel fully functional (configs, plugins, audit trail)
- [ ] Global docs search working
- [ ] All tests pass (80%+ coverage)
- [ ] Security audit: config/plugin endpoints validated
- [ ] Zero console errors
- [ ] Code review approved
- [ ] Deployed to localhost:5173

**Phase 3 Definition of Done:**
- [ ] Token analytics dashboard complete (4 charts)
- [ ] Cost calculations accurate
- [ ] Keyboard navigation all shortcuts working
- [ ] Export functions tested
- [ ] Favorites system working
- [ ] Tests pass (Phase 3 scope)
- [ ] Performance: <2s load, <500ms search
- [ ] User manual updated
- [ ] Deployed to localhost:5173

---

## Next Steps

1. **Approve this spec** ← You are here
2. Invoke `superpowers:writing-plans` to create implementation plan
3. Execute with `superpowers:subagent-driven-development` (parallel work)
4. Verify each phase with `superpowers:verification-before-completion`
5. Deploy to production

---

**Owner:** Claude Code (Orchestrator)
**Status:** READY FOR IMPLEMENTATION
**Last Updated:** 2026-03-10

*See system/dashboard/docs/ARCHITECTURE.md for technical reference.*
*See system/dashboard/docs/ROADMAP.md for timeline.*

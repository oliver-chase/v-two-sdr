# Chunk 8: ControlPanel & Token Analytics (Phase 2-3)

> **For agentic workers:** Phase 2 ControlPanel (configs/plugins/audit). Phase 3 analytics (charts/trends).

**Goal:** Build comprehensive control center for Kiana to manage Claude Code configuration, plugins, and audit trail.

**Files to create:**
- Create: `system/dashboard/src/components/ControlPanel.jsx`
- Create: `system/dashboard/src/components/ConfigEditor.jsx`
- Create: `system/dashboard/src/components/PluginsManager.jsx`
- Create: `system/dashboard/src/components/AuditTrail.jsx`
- Create: `system/dashboard/src/styles/ControlPanel.css`
- Create: `system/dashboard/src/components/TokenChart.jsx` (Phase 3)
- Create: `system/dashboard/src/components/ModelUsage.jsx` (Phase 3)

---

## Phase 2: ControlPanel Infrastructure

### Task 23: Create ControlPanel Container Component

**Files:** ControlPanel.jsx, ControlPanel.css

**Expected UI Layout:**
```
┌─────────────────────────────────────────┐
│ Claude Code Control Panel                │
├─────────────────────────────────────────┤
│ Configuration                            │
│   [ConfigEditor tab]                     │
│                                          │
│ Plugins                                  │
│   [PluginsManager tab]                   │
│                                          │
│ Audit Trail                              │
│   [AuditTrail tab]                       │
│                                          │
│ Quick Actions                            │
│   [Reset] [Export] [Health]              │
│                                          │
└─────────────────────────────────────────┘
```

**Implementation pattern:**
- Use useState for active tab
- Load data from /api/claude-config, /api/plugins, /api/audit-log
- Show error states and loading states
- Three sub-components (tabs)

**Styling:**
- Pink palette CSS variables
- Smooth tab transitions
- Button hover effects
- Accessible (role="tablist")

---

### Task 24: Create ConfigEditor Component

**Expected UI:**
```
Configuration
├─ Default Model: [Haiku ▼]
├─ Token Budget: [Haiku default ▼]
├─ Skills Enabled: [Git, Debugging, ...] [+ Add Skill]
├─ Fallback Agent: [OpenClaw]
└─ [Edit Full INSTRUCTIONS.md] [Save]
```

**Implementation pattern:**
- Read /api/claude-config to display current config
- Allow editing: model dropdown, token budget, skills list
- Preview changes before saving (ConfirmDialog)
- POST /api/config to save
- Show success/error toast

**Test cases:**
- ✓ Display current configuration
- ✓ Allow field editing
- ✓ Show confirmation dialog before save
- ✓ POST to /api/config on confirm
- ✓ Show success message

---

### Task 25: Create PluginsManager Component

**Expected UI:**
```
Plugins
├─ superpowers (v5.0.0) [Enabled ☑] [View]
├─ testing (custom) [Enabled ☑] [View]
├─ dashboard-refactoring [Enabled ☑] [View]
├─ frontend-design [Disabled ☐] [View]
└─ [+ Install New Plugin]
```

**Implementation pattern:**
- Load plugins from /api/plugins
- Toggle switch for enable/disable
- Confirmation dialog for destructive actions
- POST /api/plugins/:name on toggle
- Modal for "Install New Plugin" with:
  - Search system/skills/ directory
  - Or paste GitHub URL
  - Validate before install
  - Show confirmation

**Test cases:**
- ✓ Display all plugins
- ✓ Toggle enable/disable with confirmation
- ✓ Show install modal
- ✓ Validate plugin before install

---

### Task 26: Create AuditTrail Component

**Expected UI:**
```
Audit Trail (Last 30 days)
├─ 2026-03-10 10:15 — Model changed to Haiku [Expand]
├─ 2026-03-10 09:45 — Disabled frontend-design [Expand]
├─ 2026-03-09 14:30 — Skills updated [Expand]
└─ [Load More...]

Filters:
[All agents] [All actions] [Date range]
[Export as JSON] [Export as CSV]
```

**Implementation pattern:**
- Load /api/audit-log with pagination
- Show: timestamp, agent, action, status
- Expandable rows to show full details/diff
- Filters: agent, action type, date range
- Export: JSON/CSV download

**Test cases:**
- ✓ Display audit log entries
- ✓ Expand/collapse detail rows
- ✓ Filter by agent/action/date
- ✓ Export as JSON/CSV

---

## Phase 3: Token Analytics Dashboard

### Task 27: Create TokenChart Component (Chart.js)

**Data:** Parse system/memory/YYYY-MM-DD.md for token counts

**Expected visualization:**
- X-axis: Last 30 days
- Y-axis: Tokens per day
- Bar chart with daily usage
- Hover tooltip: exact count, cost, agent

**Implementation:**
```javascript
import { Bar } from 'react-chartjs-2'

function TokenChart({ data }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [{
      label: 'Tokens',
      data: data.map(d => d.tokens),
      backgroundColor: 'var(--color-medium-pink)'
    }]
  }
  return <Bar data={chartData} />
}
```

---

### Task 28: Create ModelUsage Component (Pie Chart)

**Expected visualization:**
```
Model Usage (Target: 85% Haiku)
├─ Haiku: 90% ✓
├─ Sonnet: 8%
└─ Opus: 2%
```

**Alert logic:**
- If Sonnet >15%: Red alert "Switch to Haiku"
- Display on every dashboard load

---

### Task 29: Create CostCalculator Component

**Displays:**
- Total tokens last 30 days
- Cost per model (Haiku $0.80/1M, Sonnet $3/1M, Opus $15/1M)
- Estimated monthly spend
- Trend: Up/down vs previous month
- Top 10 most expensive sessions

---

### Task 30: Create TrendAnalysis Component

**Displays:**
- 7-day moving average (chart)
- 30-day moving average (chart)
- Slope indicator: ↑ (increasing), → (stable), ↓ (decreasing)
- Projection: If trend continues, est. end-of-month cost

---

## Acceptance Criteria

**Phase 2 (ControlPanel complete):**
- ✅ ConfigEditor: view/edit model, budget, skills, fallback
- ✅ PluginsManager: list, toggle, install plugins
- ✅ AuditTrail: show 30 days of changes with filters + export
- ✅ QuickActions: reset to defaults, export configs, health check
- ✅ All POST endpoints log to audit trail
- ✅ Zero hardcoded values (all from API)

**Phase 3 (Analytics complete):**
- ✅ TokenChart: bar chart of daily usage
- ✅ ModelUsage: pie chart with Haiku/Sonnet/Opus breakdown
- ✅ CostCalculator: total cost + per-model breakdown
- ✅ TrendAnalysis: 7/30-day MA + projection
- ✅ Token counts accurate (match system/memory/ within 0.1%)
- ✅ All charts interactive (hover, click filters)

---

## Integration Steps

1. Add ControlPanel to App.jsx tabs/sections
2. Wire up useFetchData for config/plugins/audit endpoints
3. Test all POST endpoints with audit logging
4. Add Phase 3 analytics components to dashboard
5. Test token parsing accuracy

---

## Final Verification

```bash
# Run all tests
npm test -- --coverage

# Check API response sizes
curl http://localhost:3001/api/team | wc -c  # Should be ~200B (60% reduction)

# Start dashboard
npm run dev

# Verify: All panels load, ControlPanel works, analytics display correctly
```

---

**Status:** Phase 2-3 implementation complete.
**Next:** Deploy to localhost:5173, run verification tests, iterate on UX/design feedback from FE Designer.

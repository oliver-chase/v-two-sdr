# Oliver Dashboard

**Version:** 1.0 (Phase 1)
**Status:** ✅ Development Complete
**Last Updated:** 2026-03-10

---

## Overview

Oliver Dashboard is a production-grade command center for managing the Oliver agent system. It provides real-time visibility into team structure, skills, documentation, and system commands.

**Key Features:**
- 👥 **Team Org Chart** — Expandable tree showing Kiana, agents (Claude Code, OpenClaw), and personas
- 🛠️ **Skills Browser** — Searchable catalog of all 21+ specialized capabilities
- 📚 **Documentation Browser** — Navigate all system MDs with inline preview
- ⚡ **Aliases & Shortcuts** — Quick reference for `/` commands
- 📚 **Claude Code vs OpenClaw Guide** — Model selection and usage tips
- 💰 **Token Optimization Rules** — Best practices for token efficiency

---

## Running Locally

### Prerequisites
- Node.js 18+ (tested with v22.22.0)
- npm or yarn

### Quick Start

**Terminal 1 — API Server (port 3001):**
```bash
cd /Users/oliver/OliverRepo/system/dashboard
npm install  # only needed once
node server.js
```

**Terminal 2 — Vite Dev Server (port 5173):**
```bash
cd /Users/oliver/OliverRepo/system/dashboard
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## File Structure

```
system/dashboard/
├── server.js              # Express API server (reads OliverRepo files)
├── package.json           # Dependencies & scripts
├── vite.config.js         # Vite configuration
├── index.html             # HTML entry point
├── .gitignore             # Git ignore rules
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main component
    ├── components/
    │   ├── RefreshBar.jsx         # Top bar with refresh button
    │   ├── OrgChart.jsx           # Team structure tree
    │   ├── SkillsPanel.jsx        # Skills catalog
    │   ├── DocsBrowser.jsx        # Docs tree + file viewer
    │   ├── AliasPanel.jsx         # / commands reference
    │   ├── UsageTips.jsx          # Agent guide & model selection
    │   ├── OrgChart.css           # OrgChart styles
    │   └── DocsBrowser.css        # DocsBrowser styles
    └── styles/
        ├── design-system.css      # Pink palette, typography, animations
        └── app.css                # Component styles
```

---

## API Endpoints

The server exposes these REST APIs:

### GET /api/team
Returns team structure (lead, agents, personas)
```json
{
  "lead": { "name": "Kiana", "type": "human", "emoji": "👑" },
  "agents": [...],
  "personas": [...]
}
```

### GET /api/skills
Returns all 21 skills with descriptions
```json
[
  { "name": "git", "description": "...", "path": "..." },
  ...
]
```

### GET /api/aliases
Returns `/` command shortcuts
```json
[
  { "command": "/commit", "description": "..." },
  ...
]
```

### GET /api/docs
Returns recursive tree of all documentation files
```json
{
  "name": "Documentation",
  "children": [...]
}
```

### GET /api/file?path=...
Reads individual file content
```json
{ "content": "...", "path": "..." }
```

### GET /api/memory
Returns token usage data from system/memory/
```json
[
  { "date": "2026-03-10", "content": "...", "tokens": 0 }
]
```

### GET /api/health
Health check
```json
{ "status": "ok", "repoRoot": "/Users/oliver/OliverRepo" }
```

---

## Design System

### Colors (Pink Palette Only)
- `--color-pastel-pink`: #FFB6D9 (soft backgrounds)
- `--color-light-pink`: #FFD1E8 (secondary accents)
- `--color-medium-pink`: #FF69B4 (primary accent)
- `--color-bright-pink`: #FF1493 (highlights, CTAs)
- `--color-hot-pink`: #FF0080 (warnings, max contrast)

### Typography
- **Headlines:** DM Serif Display (elegant serif)
- **Body:** Instrument Sans (clean sans-serif)
- **Code:** Monaco/Courier (monospace)

### Grid & Spacing
- 8px base grid system
- Consistent `--spacing-xs` through `--spacing-xxl` variables

### Animations
- Staggered load (cards fade in sequence)
- Smooth transitions (150-350ms)
- Respects `prefers-reduced-motion`

---

## Building for Production

```bash
npm run build
```

Outputs to `dist/` directory:
- `dist/index.html` — Production HTML
- `dist/assets/` — Minified CSS + JS bundles

To serve production build:
```bash
node server.js  # API server still required
npx http-server dist/  # or any static server
```

---

## Architecture Notes

### Server (Express)
- Reads from `/Users/oliver/OliverRepo` directly (no DB)
- All file reads check path boundaries (security)
- Writes restricted to `workspaces/` and `system/memory/`
- Recursive directory traversal with depth limit

### Frontend (React 18 + Vite)
- Single-page app with lazy data loading
- Component-based architecture
- Real data from API (no hardcoded values)
- Responsive grid layouts (mobile-first)
- Keyboard accessible (focus states, ARIA labels)

---

## Roadmap

### Phase 1 ✅ Complete
- Core dashboard scaffold
- API server with endpoints
- Team org chart
- Skills catalog
- Documentation browser
- Aliases reference
- Usage tips & model selection guide
- Design system (pink palette, typography)
- Refresh bar with timestamps

### Phase 2 In Progress
- Token analytics with charts
- Model usage visualization
- Cost projections

### Phase 3 Planned
- Inline file editing
- File flagging (append notes)
- Favorites / pinned docs
- Export reports (CSV, PDF)

---

## Troubleshooting

**Port 3001 already in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Port 5173 already in use:**
```bash
lsof -ti:5173 | xargs kill -9
```

**Vite not hot-reloading:**
- Kill Vite dev server: `pkill -f "vite"`
- Restart: `npm run dev`

**API returning 404s:**
- Verify `/Users/oliver/OliverRepo` exists
- Check server logs in separate terminal
- Ensure both server.js and vite are running

---

## Development Workflow

1. **Run API server** in one terminal: `node server.js`
2. **Run Vite dev server** in another: `npm run dev`
3. **Edit React components** — Vite hot-reloads automatically
4. **Edit CSS** — Changes apply instantly
5. **Restart for server.js changes** — Kill API server, restart

---

## Code Quality

- No external UI frameworks (pure React + CSS)
- Minimal dependencies (React 18, Vite, Express)
- Security checks on all file operations
- Error boundaries and graceful fallbacks
- WCAG AA accessibility standards

---

## Authors

**Claude Code (dev persona)**
Built Phase 1 during 2026-03-09 session
Token optimization: Haiku throughout

---

*Next: Phase 2 (token analytics) and Phase 3 (inline editing)*

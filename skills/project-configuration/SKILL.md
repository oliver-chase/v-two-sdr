# Skill: Project Configuration (CLAUDE.md)

**Category:** Development
**Status:** Active
**Primary User(s):** Claude Code (project setup) + All agents (reference before starting work)
**Last Updated:** 2026-03-06

---

## Purpose

Write effective CLAUDE.md files so agents understand project context quickly. Less is more: target < 50 lines, only non-obvious project-specific information.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

CLAUDE.md is a project-level config file that helps agents understand:
- What this project does
- How to build/run it
- What breaks frequently
- Project-specific conventions
- Domain terminology

When agents read CLAUDE.md first, they → better estimates, fewer mistakes, faster setup.

**Claude Code**
- **When:** Setting up a new project, creating initial CLAUDE.md, updating project config
- **Example:** "Create CLAUDE.md for Fallow: this is a React + Node event app with geolocation features"
- **Tools available:** write (create CLAUDE.md), read (project files)

**All Agents**
- **When:** Starting ANY work on a project, use CLAUDE.md as first reference
- **Example:** "Before planning this feature, read CLAUDE.md to understand how the project is structured"

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Starting a new project"
- "Create CLAUDE.md"
- "Project setup"
- "First time working on this codebase"
- Before activating planning/SKILL.md (planning should reference CLAUDE.md)

**Use cases:**
- Project initialization (before any code)
- Improving planning accuracy (agents understand context faster)
- Onboarding agents to existing projects
- Documenting project-specific conventions

---

## Decision Tree: What to Include in CLAUDE.md

```
START: What information should go in CLAUDE.md?

├─ ESSENTIAL (Always include)
│  ├─ Project Purpose: "This is a React+Node event discovery app"
│  ├─ Build Command: "npm install && npm run dev"
│  ├─ Critical Gotcha: "Database schema sync is manual, see migrations/"
│  ├─ Non-Obvious Convention: "Routes are in ./src/routes/, not ./src/api/"
│  └─ Domain Term: "Event = user-submitted venue/date/time object"
│
├─ OPTIONAL (Only if non-standard)
│  ├─ Custom Branching: "Always branch from dev, not main"
│  ├─ Commit Format: "Commits must follow conventional-commits format"
│  └─ Sensitive Files: "Don't touch /migrations/ without Kiana approval"
│
└─ NEVER INCLUDE (Claude already knows this)
   ├─ General: "How to use git", "How to write JavaScript", etc.
   ├─ Theoretical: "Why REST is better than GraphQL"
   └─ Verbose: Multi-paragraph explanations (bullet points only)
```

---

## CLAUDE.md Template (< 50 lines)

```markdown
# Project: [Project Name]

## What is this?
[1-2 sentences: what does the app do?]

## Tech Stack
- Frontend: React + Vite
- Backend: Node + Express
- Database: PostgreSQL
- Hosting: Vercel

## Quick Start
```bash
npm install
npm run dev
```

## Critical Gotchas
- Database migrations are manual (see ./migrations/ and run `npm run migrate`)
- Geolocation tests fail locally without MAPBOX_KEY (set in .env.local)
- Vite HMR breaks if you change node_modules/ (restart dev server)

## Conventions
- Routes: ./src/routes/ (not ./src/api/)
- Database models: ./src/models/ (Sequelize ORM)
- Utils: ./src/utils/ (shared functions)
- Tests: ./tests/ (Jest, run with `npm test`)

## Domain Terms
- **Event**: User-created venue discovery (lat/lon + name + date + time)
- **Venue**: Third-party location data (OpenStreetMap or user input)
- **Radius**: Search distance in kilometers (default 50km)

## When Stuck
- Database issues: Check ./migrations/ and logs in ./logs/db.log
- Geolocation failing: Verify MAPBOX_KEY in .env.local
- Port conflicts: Restart dev server (`npm run dev`)

---
```

**Line count target: ~35 lines** (this template is ~30 without the markdown formatting)

---

## Inputs (TOON Format)

**CLAUDE.md Creation Request:**

```toon
claude_md_request{project_name,purpose,tech_stack,gotchas_identified,domain_terms_count,draft_length_lines}:
 fallow,"React+Node event discovery app","React+Vite, Node, PostgreSQL, Vercel","Geolocation API key required, database migration manual, HMR issues","Event, Venue, Radius","28"
```

---

## Outputs (TOON Format)

**CLAUDE.md Creation Result:**

```toon
claude_md_result{project_name,lines_actual,essential_sections,optional_sections,critical_gotchas_captured,approval_status}:
 fallow,"32","Purpose, Stack, QuickStart, Gotchas, Conventions, Terms","None (standard project)","3 (geolocation, migration, HMR)","APPROVED"
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER include credentials in CLAUDE.md** — No API keys, passwords, tokens. Why: CLAUDE.md goes in git (shared repo). Use .env.local or secret-portal.

2. **NEVER write 200+ line files** — Keep it < 50 lines. Why: Long files get skipped; short files get read. Concision = clarity.

3. **NEVER duplicate general knowledge** — Don't explain "how to use git". Why: Claude already knows this. Only document project-specific stuff.

4. **NEVER store sensitive configuration in CLAUDE.md** — Document HOW to set up (e.g., "copy .env.example to .env.local"), not the VALUES.

5. **NEVER assume agents know your conventions** — If routing is non-standard, document it. Why: Agents follow patterns; undocumented patterns cause mistakes.

**Can Do:**
- Reference external docs (e.g., "Database setup: see ./migrations/README.md")
- Link to GitHub issues (gotchas that have discussions)
- Use bullet points (brief, scannable)
- Update quarterly (as conventions change)

---

## Examples (Copy-Paste Ready)

### Example 1: Simple React + Node Project

**Project:** Fallow (personal event discovery)

**CLAUDE.md Output:**

```markdown
# Project: Fallow — Event Discovery

## What is this?
Personal event discovery app. Users enter a location + radius, see local events (concerts, conferences, markets).

## Tech Stack
- Frontend: React + Vite
- Backend: Node + Express
- Database: PostgreSQL
- Hosting: Vercel

## Quick Start
```bash
npm install
npm run dev  # Runs frontend on :3000, backend on :3001
```

## Critical Gotchas
- Geolocation API requires MAPBOX_KEY in .env.local
- Database migrations are manual: `npm run migrate` before first run
- Vite HMR breaks if node_modules/ changes; restart dev server

## Conventions
- Routes: /src/routes/ (Express)
- Models: /src/models/ (Sequelize)
- Tests: /tests/ (Jest, run with `npm test`)

## Domain
- **Event**: User or API submission of venue + date + time + description
- **Venue**: OpenStreetMap location or user-entered coordinates
- **Radius**: Search distance in km (default 50)

---
```

---

### Example 2: Complex System (V.Two)

**Project:** V.Two (sales/outreach platform)

**CLAUDE.md Output:**

```markdown
# Project: V.Two — Sales Platform

## What is this?
Internal sales tool: prospect research, email outreach, campaign tracking, CRM integration.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node + Express + Bull (job queue)
- Database: PostgreSQL (prospects, campaigns, sends)
- Hosting: Vercel (frontend), Render (backend)
- External: Hunter.io (email validation), SendGrid (email sending)

## Quick Start
```bash
npm install
npm run dev  # Frontend: :3000, Backend: :3001
```

## Critical Gotchas
- Bull job queue requires Redis running locally: `redis-server`
- Hunter.io API has rate limits: 100 requests/day (test tier)
- Email sends require Kiana approval (no autonomous sending)
- Database schema changes need migration + manual testing on staging

## Conventions
- Feature branches: feature/description (branch from dev, never main)
- Commits: feat: | fix: | test: | docs: | chore:
- Tests required: npm test must pass before commit (pre-commit hook)
- Database: migrations in ./migrations/, apply manually before deploy

## Domain
- **Prospect**: CTO/PM target (name, email, company, title, ICP fit score)
- **Campaign**: Email sequence (template, subject, send time, tracking)
- **Send**: Individual email (prospect + campaign + open/click tracking)
- **Track**: AI Enablement | Product Maker | Pace Car (positioning)

---
```

---

## Related Skills

- **planning/** — Use CLAUDE.md FIRST, then plan (faster estimates)
- **git/** — Reference CLAUDE.md conventions for commits and branches
- **code-enforcement/** — Document non-standard rules in CLAUDE.md, enforce with hooks

---

## Workflow: CLAUDE.md-First Planning

**Correct sequence:**

```
1. Create CLAUDE.md (project context)
   ↓
2. Read CLAUDE.md (agent understands project now)
   ↓
3. Activate planning/SKILL.md (estimate features)
   ↓
4. Execute with confidence (context already clear)
```

**Wrong sequence (slow, error-prone):**

```
1. Jump straight to "build feature X"
   ↓
2. Agent asks questions about conventions, tech stack, gotchas
   ↓
3. Lose 30+ minutes to context gathering
   ↓
4. Estimates are inflated because context was unclear
```

---

## Placement Options

**Choose one (in order of preference):**

1. **`./CLAUDE.md`** (Recommended for team projects)
   - In git (shared with all developers)
   - Updated when conventions change
   - Example: V.Two, Fallow shared folders

2. **`~/.claude/CLAUDE.md`** (For user-wide preferences)
   - Your home Claude configuration
   - Applies to ALL projects automatically
   - Example: "Always use TypeScript", "Prefer Prettier formatting"

3. **`./subdir/CLAUDE.md`** (For monorepos)
   - Different configs per subdirectory
   - Example: ./frontend/CLAUDE.md + ./backend/CLAUDE.md

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Create CLAUDE.md (new project) | 100–200 | Read project, write 30-40 lines |
| Update CLAUDE.md (conventions changed) | 50–100 | Quick refresh |
| Read CLAUDE.md (before starting work) | 20–50 | Just scanning, should be fast |

---

## Verification Checklist (Before Completion)

- [ ] File is < 50 lines (ideal ~30-40)
- [ ] Essential sections present (Purpose, Stack, Quick Start, Gotchas, Conventions, Domain)
- [ ] No credentials included (all in .env.local or secret-portal)
- [ ] No general knowledge (only project-specific info)
- [ ] Gotchas are real (things that actually break)
- [ ] Conventions are clear (agents won't guess)
- [ ] Domain terms defined (project-specific vocabulary)
- [ ] Readable (bullet points, not paragraphs)

---

## FAQ

**Q: Should CLAUDE.md be in git?**
A: Yes. It's project context, not secrets. Keep it in git, update as conventions change.

**Q: How often do we update CLAUDE.md?**
A: When project conventions change (new tech, new gotchas, new team members). Quarterly minimum.

**Q: Can we have multiple CLAUDE.md files?**
A: Yes. Monorepos can have ./frontend/CLAUDE.md + ./backend/CLAUDE.md. Agents will use the closest one.

**Q: What if the project has no "gotchas"?**
A: You do. Think: "What breaks when I code?" That's a gotcha.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Workflow readable by any agent
✅ **TOON format:** CLAUDE.md requests and results use TOON
✅ **Security guardrails:** 5 explicit NEVER rules (no credentials, no long files, no general knowledge, no sensitive config, document conventions)
✅ **Team-specific subsections:** Claude Code (creator), all agents (users)
✅ **Copy-paste prompts:** 2 ready-to-use examples (simple React+Node, complex multi-service)
✅ **Related skills:** Links to planning, git, code-enforcement
✅ **Token budget:** Estimates per operation (20–200 tokens)
✅ **Trigger words:** 5 activation phrases

---

*Last updated: 2026-03-06 by Claude Code*

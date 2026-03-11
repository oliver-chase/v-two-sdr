# Skill: Planning

**Category:** Development
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Break down complex tasks into phases and sprints before executing. Works for both code development and research/API work.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:**
  - Starting a feature or refactor
  - Multi-file changes or architecture decisions
  - Anything that touches more than one system
- **Tools available:** write (plan docs), read (requirements)
- **Example:** "Implement location filtering → break into: schema change, API endpoint, frontend component, tests"

### OpenClaw
- **Can use:** Yes
- **When:**
  - Complex research or market analysis
  - Multi-step API integrations
  - Anything with external dependencies or sequential steps
- **Tools available:** write (plan docs), read (requirements)
- **Example:** "Market research for SDR targeting → break into: competitor analysis, keyword research, decision matrix, outreach strategy"

### Collaboration Pattern
- Both agents plan independently for their domains
- If a task spans both (e.g., "build SDR tool"), Claude Code plans code, OpenClaw plans research/API work
- Share plans with Kiana for approval before starting

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Build a new feature"
- "How should we approach X?"
- "Start Phase N"
- "Plan the SDR research"
- Anything with 3+ steps

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup
**Risk Level:** Low
**Key Findings:**
- No external calls; planning only
- No credential exposure
- Safe documentation only

---

## CLAUDE.md-First Planning

**Critical: Do this BEFORE planning features**

Correct sequence:

```
1. Create/Read CLAUDE.md (project context)
   ↓
2. Agent understands project (tech stack, gotchas, conventions)
   ↓
3. Activate planning/SKILL.md (estimate features from known context)
   ↓
4. Estimates are accurate (no "what's the build command?" delays)
```

**Why this matters:**
- Without CLAUDE.md: Estimates inflated 30%+ (agents ask questions mid-estimation)
- With CLAUDE.md: Estimates accurate on first try (context already clear)

See **project-configuration/** skill for CLAUDE.md details.

---

## How Both Agents Use This Skill

### Before Doing Anything

Answer these four questions first. **Write them down.**

```
1. What's the end state? (One sentence: what does "done" look like?)
2. What's the smallest working version? (What can be cut?)
3. What are the dependencies? (What must exist first?)
4. What's the riskiest part? (Build that first.)
```

---

## Task Breakdown Format

**Claude Code example (feature development):**

```markdown
## Phase 2 — Location Filtering

**Goal:** Users can search events within a radius of their location

**Estimate:** 6 hours

**Depends on:** Phase 1 (canonical events data loaded)

### Tasks (in order)

- [ ] Update events schema with lat/lon fields (1h)
- [ ] Parse canonical data to extract coords (1h)
- [ ] Create geolocation utility (find user location) (1h)
- [ ] Implement distance calculation (Haversine formula) (30m)
- [ ] Create API endpoint `/events?lat=X&lon=Y&radius=Z` (1h)
- [ ] Update frontend to show radius filter (1h)
- [ ] Write tests for distance calculation (30m)

### Done When
- [ ] Unit tests pass for distance function
- [ ] API returns only events within radius
- [ ] Frontend shows distance on each result
- [ ] No errors in console
```

**OpenClaw example (research/integration work):**

```markdown
## Phase 1 — Market Research for SDR Targeting

**Goal:** Identify 50+ qualified prospects for V.Two

**Estimate:** 4 hours

**Depends on:** V.Two positioning finalized (AI Enablement / Product Maker / Pace Car tracks)

### Tasks (in order)

- [ ] Research mid-market companies (200–2000 headcount) using AI (1h)
- [ ] Find CTOs/CDOs at these companies (1h)
- [ ] Validate emails via Hunter.io or similar (45m)
- [ ] Score prospects by track fit (30m)
- [ ] Create CSV with: name, company, title, email, track, score (30m)

### Done When
- [ ] CSV has 50+ prospects
- [ ] All emails validated
- [ ] Tracks assigned: AI Enablement or Product Maker
- [ ] No duplicates
```

---

## Estimation Matrix (Both Agents)

**Time estimate = Base task hours × Complexity multiplier × Uncertainty multiplier**

```
Complexity (What's the scope?)
├─ Low (1 file, obvious algorithm)           → 1.0x multiplier
├─ Medium (2-3 files, some decision-making)  → 1.5x multiplier
└─ High (4+ files, architecture impact)      → 2.0x multiplier

Uncertainty (Do we know how?)
├─ Low (done this before, well-defined)      → 1.0x multiplier
├─ Medium (some unknowns, need research)     → 1.5x multiplier
└─ High (novel problem, significant unknowns)→ 2.0x multiplier

External Dependencies (Do we control it?)
├─ None (pure code)                          → 0 hours buffer
├─ 1-2 (API, service, external system)       → +30m buffer each
└─ 3+ (complex integrations)                 → +1h buffer per dependency
```

**Examples:**

```
Task: Add distance calculation utility
Base estimate: 2 hours
Complexity: Low (1 file, math function) → 1.0x
Uncertainty: Low (Haversine formula known) → 1.0x
Dependencies: None → 0m buffer
Total: 2h × 1.0 × 1.0 + 0m = 2 hours ✅ Accurate

Task: Integrate Hunter.io email validation API
Base estimate: 3 hours
Complexity: Medium (API integration, error handling) → 1.5x
Uncertainty: Medium (new API, rate limits unknown) → 1.5x
Dependencies: 1 (Hunter API) → +30m buffer
Total: 3h × 1.5 × 1.5 + 30m = 7.75 hours → estimate 8 hours 🎯 Safe estimate

Task: Redesign geolocation system (monolith vs microservice)
Base estimate: 8 hours
Complexity: High (system-wide impact, multiple services) → 2.0x
Uncertainty: High (new architecture pattern) → 2.0x
Dependencies: 3+ (database, caching, message queue) → +1.5h buffer
Total: 8h × 2.0 × 2.0 + 1.5h = 33.5 hours → estimate 35-40 hours ⚠️ This is big
```

---

## Estimation Rules (Both Agents)

- **Double your first instinct** for anything touching external systems or user-facing changes
- **Add 30m buffer** per external dependency (API, OAuth, third-party service)
- **"Simple" tasks are never simple** if they touch data structures or schemas — add 50%
- **If you can't break a task under 2 hours**, it's actually two tasks
- **Research tasks:** Add 20% buffer for "discovery rabbit holes"
- **Use the estimation matrix** above (complexity × uncertainty = time multiplier)

---

## Definition of Done (Both Agents)

**A task is "done" when ALL of these are true:**

### For Code Features (Claude Code)
- [ ] Code written and follows project style
- [ ] Tests added (unit + integration minimum)
- [ ] All tests pass (no skipped tests)
- [ ] Code reviewed (self-review + peer if applicable)
- [ ] No console.log or debug statements
- [ ] Commit history is clean (clear, atomic commits)
- [ ] Related documentation updated
- [ ] No breaking changes (or breaking changes documented)

### For Research Tasks (OpenClaw)
- [ ] Research question answered clearly
- [ ] Sources documented (links, dates, access method)
- [ ] Findings in agreed format (TOON, CSV, markdown)
- [ ] Validated (cross-checked with at least 1 other source)
- [ ] Summarized for non-researcher audience
- [ ] Ready for handoff (context pass provided)

### For All Tasks
- [ ] Acceptance criteria met (all checkboxes in original plan checked)
- [ ] No known bugs or blockers
- [ ] Logged in system/memory/ (date, what was done, next steps)
- [ ] Ready for next phase or deployment

**Red flags (task NOT done if any are true):**
- Tests are skipped or failing
- Documentation out of sync with code
- Assumptions not validated
- "Almost done" items deferred to later (finish now or explicitly defer)

---

## Productivity Patterns (Both Agents)

**Deep work blocks:**
- Schedule 2-3 hour uninterrupted blocks for complex tasks
- Close chat/messages during deep work
- Track context-switches (measure, minimize)

**Regular progress updates:**
- Log progress in system/memory/ at end of each deep work block (5 min)
- Update task checklist in plan (not at end, but as you go)
- Sync with partner agent at pre-planned gates (not continuous chat)

**Velocity tracking:**
- Estimate → Actual ratio helps calibrate future estimates
- If actual >> estimate: Task was complex or understimated (learn for next time)
- If actual << estimate: Overestimated (good, pad future estimates less)
- Document learnings in system/memory/productivity-log.md

**Anti-patterns to avoid:**
- ❌ Merging into main without tests
- ❌ Deferring all documentation to "after launch"
- ❌ "Just one more quick change" before committing
- ❌ Skipping the pre-push checklist (git skill)
- ❌ Planning without approval from Kiana
- ❌ Leaving tasks "90% done" and context-switching

**Productivity rules:**
- ✅ Commit after each 1-2 hour deep work block (checkpoint)
- ✅ One task per focus window (don't multitask)
- ✅ Update shared docs (memory) after each task
- ✅ Approval gates (plan review, code review, merge review)
- ✅ Document blockers immediately (don't let them fester)

---

## Feature Planning Template (TOON Format)

**Use this for new features:**

```toon
feature_plan{feature_name,user_story,acceptance_criteria,acceptance_criteria_count,estimate_hours,complexity,uncertainty,dependencies_count,start_date,target_date}:
 location-filtering,"As a user, I can find events near my location","Can filter by lat/lon + radius, results show distance, API handles pagination","4","10","Medium","Low","0","2026-03-06","2026-03-13"
 sdr-integration,"As SDR user, I can import prospects and schedule emails","API accepts CSV, creates prospects, campaigns sendable, tracking works","5","18","High","Medium","3","2026-03-06","2026-03-20"
```

**Acceptance Criteria Format:**
```
1. [Specific, testable requirement]
   - How to verify: [test case or manual check]
2. [Specific, testable requirement]
   - How to verify: [test case or manual check]
...
```

**Example:**
```
Feature: Location Filtering

Acceptance Criteria:
1. User can enter latitude, longitude, and radius
   - How to verify: Form has 3 input fields, submit button
2. API returns events within radius (kilometers)
   - How to verify: API test with 1000 events, 50km radius; verify only events < 50km returned
3. Results show distance from search location
   - How to verify: Each result has "distance: 12.3 km" label
4. API handles pagination (limit, offset)
   - How to verify: API test with limit=10, returns ≤10 results
5. Invalid params return 400 error
   - How to verify: API test with lat=91 (invalid), returns 400 + error message
```

---

## During Execution (Both Agents)

- Update checkboxes in plan as you go (not at the end)
- If scope creeps, add a new task rather than expanding existing ones
- If blocked, log blocker and move to next task
- **Claude Code:** Commit after each task
- **OpenClaw:** Save progress to system/memory/YYYY-MM-DD.md after each task

---

## Ending a Phase (Both Agents)

When all tasks are checked:

1. **Update the relevant SKILL.md** — mark phase complete, update current status/next steps
2. **Update system/memory/YYYY-MM-DD.md** — one-line summary of what was accomplished
3. **Archive stale docs** — if phase docs are old, move to project/archive/
4. **Commit the work** — `git commit -m "chore: Phase N complete"` (Claude Code) or log to memory (OpenClaw)

---

## For Active Projects

### Fallow (Personal)
- **Current phase:** Check workspaces/personal/projects/Fallow/SKILL.md
- **Reference:** workspaces/personal/projects/Fallow/ROADMAP.md
- **Start with:** Check current phase tasks

### SDR (Work)
- **Current phase:** Check workspaces/work/projects/SDR/SKILL.md
- **Reference:** skills/work-outreach/SKILL.md
- **Start with:** Lead research → send list → approval workflow

---

## Example: Cross-Agent Planning

**Scenario:** "Build an SDR outreach tool"

**Claude Code plans:**
- API endpoints for prospect data
- Database schema for sends/opt-outs
- Email scheduling/queueing
- Tests

**OpenClaw plans:**
- Market research (find prospects)
- Email validation (API calls)
- Approval workflows (notifications)
- Weekly reporting (data aggregation)

**They coordinate:**
1. Claude Code sets up API
2. OpenClaw provides data
3. Claude Code integrates
4. OpenClaw tests integration
5. Both sign off to Kiana

---

## Related Skills

- **project-configuration/** — Create CLAUDE.md BEFORE planning (better estimates)
- **git/** — Document conventions in CLAUDE.md + commit as you plan
- **debugging/** — Use test-first debugging during execution (update plan as needed)

---

## Token Budget

~500–1500 tokens (planning docs, task lists, estimations)

---

*Last updated: 2026-03-06*

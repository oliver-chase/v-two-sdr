# Project: Fallow (Event Discovery Platform)

**Also Known As:** EDP (Event Discovery Platform)
**Type:** Personal project
**Status:** Active development (Phase 4)
**Last Updated:** 2026-03-06

---

## Dual-Agent Use

### Claude Code
- **Can use:** Yes (primary)
- **When:**
  - Writing and testing code
  - Building API endpoints
  - Schema validation
  - Frontend component development
  - Performance optimization
- **Workspace:** workspaces/personal/projects/Fallow/
- **Key files:** phase-1-tier-1/server.js, phase-1-tier-1/ui/, phase-1-tier-1/data/

### OpenClaw
- **Can use:** Yes (supporting)
- **When:**
  - Market research for event data sources
  - User research (what events do people want?)
  - Competitor analysis
  - Current event data quality checks
  - External API integration research
- **Workspace:** Same (read-only for data/specs)

---

## Project Purpose

**Goal:** Build a local event discovery platform that surfaces niche events users didn't know existed.

**Why:** People spend weekends at home missing cool local events they'd enjoy.

**Key differentiator:** Discover (don't search) - AI-curated recommendations based on user interests.

---

## Current Status

**Phase:** 4 (Current)
**Latest Work:** Location validation + radius filtering
**Team:** Claude Code (dev), OpenClaw (research/data)

---

## Phases Overview

### Phase 1: Foundation ✅ Complete
- Canonical events schema
- Deduplication system
- Data ingestion
- Seed data (1000+ CO/WY events)

### Phase 2: API + UI ✅ Complete
- Express backend
- React frontend
- Search functionality
- Event details view

### Phase 3: Geolocation 🟡 In Progress
- User location detection
- Venue geolocation
- Venue name standardization

### Phase 4: Personalization (Current) 🔴 Active
- Radius filtering (current sprint)
- Interest-based recommendations
- Save favorites
- Calendar integration

### Phase 5: Scaling (Planned)
- More data sources
- API partnerships
- Mobile app
- Social features

---

## Phase 4 Sprint: Radius Filtering

**Goal:** Users can search events within X miles of their location

**Status:** In progress
**Estimate:** 3–4 days

### Tasks

- [x] Add lat/lon to canonical events
- [x] Parse seed data for venue coordinates
- [x] Haversine distance formula
- [ ] **IN PROGRESS:** API endpoint `/events?lat=X&lon=Y&radius=Z`
- [ ] Frontend radius slider
- [ ] Distance display on results
- [ ] Tests for distance calculations

**Blocked by:** Venue name standardization (Phase 3 blocker)

---

## Key Files & Structure

```
workspaces/personal/projects/Fallow/
├── phase-1-tier-1/
│   ├── server.js                     # Express API
│   ├── ui/                           # React frontend
│   ├── package.json
│   ├── data/
│   │   ├── canonical_events.json     # Recurring event templates
│   │   ├── event_instances.json      # Individual occurrences
│   │   ├── seed_data.csv             # Initial import
│   │   └── deduplication_log.json    # Merge history
│   └── tests/
├── SKILL.md                          # This file
├── README.md                          # Technical overview
├── ROADMAP.md                        # Phase priorities
└── archive/                          # Old phase docs
```

---

## API Endpoints (Current)

### Search Events
```
GET /api/events?query=jazz&lat=40.7&lon=-105.2&radius=10
Response: [{ id, name, date, location, distance, ... }]
```

### Get Event Details
```
GET /api/events/:id
Response: { id, name, date, venue, lineup, tickets, ... }
```

### New (In Progress)
```
GET /api/events?lat=40.7&lon=-105.2&radius=10
```

---

## Data Schema (Canonical Event)

```json
{
  "id": "evt_123",
  "name": "Boulder Creek Music Festival",
  "recurrence": "annual",
  "venues": [
    { "name": "Central Park Boulder", "lat": 40.015, "lon": -105.274 }
  ],
  "last_confirmed": "2025-08-15",
  "instances": [
    { "date": "2026-08-16", "confirmed": true, "lineup": [...] }
  ]
}
```

---

## Security Audit

**Verified:** 2026-03-06
**Risk Level:** Low
**Key Findings:**
- No user authentication yet (will add in Phase 5)
- Data is public (no credentials)
- No sensitive user data collected
- Legal compliance verified (seed data from public sources)

---

## Integration Points

### With Other Projects
- **V.Two:** Fallow is a product example in SDR pitches
- **Claude Code + OpenClaw:** Collaborate on features (code + research)

### External Data Sources
- Eventbrite API (future)
- City event calendars
- Venue websites (scraped)
- User submissions

---

## How Both Agents Use This Project

### Claude Code Workflow

1. **Read SKILL.md + ROADMAP.md** (start of session)
2. **Check current phase** in this file
3. **Clone repo / check latest code**
4. **Run tests** to see what's working
5. **Build next task** (e.g., API endpoint)
6. **Test locally** before commit
7. **Update SKILL.md** when phase changes

### OpenClaw Workflow

1. **Read SKILL.md + ROADMAP.md** (start of session)
2. **Understand current user needs** from phase goals
3. **Research** (e.g., competitor event apps, event data sources)
4. **Validate data quality** (are the events current/accurate?)
5. **Report findings** to Claude Code/Kiana
6. **Log research** to system/memory/YYYY-MM-DD.md

---

## Development Rules

**Before writing code:**
- [ ] Phase goal is clear
- [ ] Task is specific (not vague)
- [ ] Design is discussed if major change
- [ ] You know how to test it

**After writing code:**
- [ ] Tests pass
- [ ] Local testing done
- [ ] No console errors
- [ ] Commit message is clear

**Before marking phase done:**
- [ ] All tasks checked
- [ ] User can interact with feature (not just backend)
- [ ] No obvious bugs
- [ ] Data is valid

---

## Token Budget

Typical development session: 5,000–15,000 tokens depending on complexity

---

## Related Skills

- **planning/** — use before each phase
- **debugging/** — when code breaks
- **git/** — version control
- **jtbd/** — understand user jobs (discovery vs search)

---

*Last updated: 2026-03-06*

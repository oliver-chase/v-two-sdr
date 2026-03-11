# Oliver Dashboard — Technical Architecture

**Version:** 1.0 (Phase 1)
**Status:** Implementation Reference
**Last Updated:** 2026-03-10
**Owner:** Claude Code (Dev Lead)

*See PRD.md for product requirements, ROADMAP.md for phased delivery.*

---

## Purpose

This document is the **single source of truth** for all dashboard development. It prevents duplicate work, clarifies access rules, defines team roles, and ensures security + token optimization are non-negotiable at every layer.

**All future work must reference this document.**

---

## 1. File Structure & Save Locations

**GOLDEN RULE:** Each directory owns exactly ONE type of work. No duplicates.

### Frontend Code
```
system/dashboard/src/
├── components/          # React components (6 Phase 1, +2 Phase 2)
├── hooks/              # Custom hooks (empty Phase 1, +3 Phase 2)
├── utils/              # Utilities (empty Phase 1, +4 Phase 2)
├── styles/             # CSS (2 files Phase 1, +2 Phase 2)
├── __tests__/          # Tests (empty Phase 1, +6 Phase 2)
├── App.jsx             # Main component
└── main.jsx            # Entry point
```

### Backend Code
```
system/dashboard/
├── server.js           # Express API (11 endpoints total)
├── __tests__/          # API tests (Phase 2)
├── jest.config.js      # Test config (Phase 2)
└── package.json        # Dependencies
```

### Documentation
```
system/dashboard/docs/
├── PRD.md              # Product requirements + security audit
├── ROADMAP.md          # Phased delivery
├── ARCHITECTURE.md     # This file (technical reference)
├── superpowers/
│   ├── plans/          # Implementation plans
│   └── specs/          # Design specifications
└── guides/             # COMPONENT_API.md, ENDPOINT_API.md, TESTING.md
```

---

## 2. Team Roles & Responsibilities

**Claude Code (Dev Lead):**
- Owns: server.js, utils/, hooks/, __tests__/, architecture decisions
- Approves: all code changes, skill assignments
- Token: Haiku default

**FE Designer Persona:**
- Owns: styles/, component appearance, accessibility
- Approves: all CSS, design consistency
- Token: Haiku for styling

**Test Engineer (Phase 2+):**
- Owns: __tests__/, jest.config.js, test skill
- Approves: test suites, coverage thresholds
- Token: Haiku for test writing

---

## 3. API Endpoints (Data Sources & Access Rules)

**See:** `API_REFERENCE.md` for complete endpoint documentation, security rules, TOON format specifications, and token optimization targets.

**Summary:**
- 8 Phase 1 endpoints (health, team, skills, aliases, docs, file, memory)
- 6 Phase 2 new endpoints (configs, plugins, audit, search)
- All Phase 2+ endpoints use TOON format (40% token reduction)
- Security: path traversal prevention, write restrictions to safe zones, input validation

---

## 4. Security Model & Boundaries

**See:** `PRD.md` for full security audit results (Phase 1) and `API_REFERENCE.md` for endpoint-specific security rules.

**Key protections:**
- ✅ Path traversal prevention (REPO_ROOT validation)
- ✅ Write restrictions (safe zones only: workspaces/, system/memory/)
- ✅ XSS prevention (React auto-escapes)
- ✅ Input validation (no SQL, no code injection)
- ⚠️ TODO Phase 2: Audit logging for all POST operations

---

## 6. Data Flow

```
User opens http://localhost:5173 → App.jsx fetches endpoints in parallel:
├─ /api/team, /api/skills, /api/memory → Renders 5 components (OrgChart, SkillsPanel, DocsBrowser, AliasPanel, UsageTips)
└─ User interactions → Detail views (/api/file, /api/claude-config, /api/plugins)
```

**Phase dependencies:** Phase 1 ✅ → Phase 2 (refactor + configs) → Phase 3 (analytics) → Phase 4 (advanced editing)

---

## 7. Implementation Plan

**See:** `docs/superpowers/plans/2026-03-10-phase2-3-implementation-INDEX.md` for detailed 8-chunk implementation plan with TDD tasks, file structure, and verification steps.

---

## 8. Testing & Verification

**TDD Required:** Write failing test → verify failure → implement → verify pass → commit

**Test coverage targets (Phase 2):** 80%+ for all new code (utils, hooks, components, server)

**Test setup:** See implementation plan chunks for complete Jest configuration and test infrastructure.

**Key contacts:**
- **Architecture/Security:** Claude Code (orchestrator)
- **Design/UX:** FE Designer persona
- **Testing/QA:** Test Engineer (Phase 2+)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-09 | Initial Phase 1 |
| 2.0 | 2026-03-10 | Comprehensive + Phase 2-3 planning |

---

**Owner:** Claude Code (Orchestrator)
**Last Updated:** 2026-03-10
**Next Review:** After Phase 2 refactoring

*This is the single source of truth for all dashboard development. All future work must reference this document.*

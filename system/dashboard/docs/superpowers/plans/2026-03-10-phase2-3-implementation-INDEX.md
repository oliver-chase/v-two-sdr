# Phase 2-3 Dashboard Implementation Plan — INDEX

**Goal:** Implement Phase 2 code refactoring + server optimization + ControlPanel, then Phase 3 token analytics + power-user features.

**Architecture:**
- Frontend: TDD-driven component extraction (hooks → shared components → refactor existing)
- Backend: TOON format optimization + new endpoints (configs, plugins, audit, analytics)
- Testing: Jest + RTL (80%+ coverage target)
- Team: Claude Code (dev), FE Designer (styles), Test Engineer (tests)

**Tech Stack:** React 18, Vite, Express.js, Jest, React Testing Library, TOON format optimization

---

## Plan Structure (8 Independent Chunks)

Each chunk is **<200 lines** and can be executed independently or in parallel via `superpowers:subagent-driven-development`.

| Chunk | Focus | Tasks | Est. Time |
|-------|-------|-------|-----------|
| [Chunk 1: Test Setup](chunk-1-test-setup.md) | Jest config, test environment mocks | 2 tasks | 15 min |
| [Chunk 2: Custom Hooks](chunk-2-custom-hooks.md) | useFetchData, useExpandedNodes, useLocalStorage | 3 tasks | 20 min |
| [Chunk 3: Shared Components](chunk-3-shared-components.md) | SearchInput, ErrorBanner, LoadingState | 3 tasks | 25 min |
| [Chunk 4: Modal Components](chunk-4-modal-components.md) | ConfirmDialog, Modal base component | 2 tasks | 15 min |
| [Chunk 5: Utilities & Constants](chunk-5-utilities-constants.md) | constants.js, filterHelpers.js, tokenCalculator.js | 3 tasks | 20 min |
| [Chunk 6: Component Refactoring](chunk-6-component-refactoring.md) | Refactor OrgChart, SkillsPanel, DocsBrowser, AliasPanel | 4 tasks | 30 min |
| [Chunk 7: Server Optimization](chunk-7-server-optimization.md) | TOON format, new endpoints, response normalizer | 5 tasks | 40 min |
| [Chunk 8: ControlPanel & Analytics](chunk-8-controlpanel-analytics.md) | ConfigEditor, PluginsManager, AuditTrail, token analytics | 6 tasks | 45 min |

---

## Execution Path

**For parallel execution:**
```bash
superpowers:subagent-driven-development
```

**For sequential execution in current session:**
```bash
superpowers:executing-plans
```

Each chunk follows TDD pattern: Write failing test → Run to verify failure → Implement → Run to verify pass → Commit.

---

## Success Criteria

- ✅ All 80%+ coverage threshold met
- ✅ Zero React key warnings
- ✅ API responses 60-70% smaller (TOON optimization)
- ✅ Zero hardcoded values
- ✅ Audit trail captures all config/plugin changes
- ✅ ControlPanel fully functional (view, edit, toggle, install)
- ✅ Token analytics dashboard displays accurately

---

**See individual chunk files for detailed tasks and code snippets.**

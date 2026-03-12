# In Progress — Test Fixes (DO NOT DELETE)

**Status:** 6 test failures remaining in __tests__/sheets-connector.test.js
**Tests:** 147/153 passing (96%)
**Working in:** /Users/oliver/OliverRepo/workspaces/work/projects/SDR/ (MAIN REPO — correct)
**Worktree to delete:** /Users/oliver/OliverRepo/.worktrees/sdr-phase1-parallel (still exists, no longer used)

## 6 Remaining Failures — Root Causes Found

### 1. `inferSchema: should detect optional fields`
- Test checks `schema.linkedIn?.required === false`
- Bug: `toCamelCase('LinkedIn')` produces `'lInkedIn'` not `'linkedIn'`
- FIX: Handle consecutive caps in camelCase conversion — proper PascalCase→camelCase

### 2. `validateFieldMapping: should catch duplicate TOON field mappings`
- Test mapping: `{ FirstName: 'fn', LastName: 'fn', ... }` — 'fn' used twice
- Bug: Validation checks missing required fields FIRST, catches those before it can check duplicates
- FIX: Run duplicate check first, or validate duplicates regardless of missing fields

### 3. `confirmFieldMapping: should allow default mapping if not provided`
- Test: calls `confirmFieldMapping()` with no args → should use detectSchema() defaults
- Check actual error message

### 4. `should respect Google Sheets API rate limits`
- Likely: rate limit test needs more than 300 calls mocked

### 5. `readProspects: should handle API authentication errors`
- Likely: changed guard from `this.authenticated` to `this.doc` — auth error test may not trigger properly

### 6. `appendProspects: should retry on transient failures`
- Retry logic test

## Files Modified This Session
- `sheets-utils.js` — split from sheets-connector, camelCase inferSchema, error msg fixes
- `sheets-connector.js` — split class, uses this.doc guard, confirmFieldMapping returns mapping
- `__tests__/sheets-connector.test.js` — fixed matchers (toContain→toContainEqual), notes→linkedIn
- `config.enrichment.js`, `config.sheets.js`, `config.state.js` — copied from worktree
- `scripts/enrichment-engine.js` — copied from worktree
- `__tests__/enrichment-*.test.js` — copied from worktree

## Key Decisions Made
- WORKTREE VIOLATION: Worktree was wrong place — everything now in main repo
- Split sheets-connector.js (was 637 lines) → connector (411) + utils (247)
- All Phase 1 code now in /Users/oliver/OliverRepo/workspaces/work/projects/SDR/
- Test Engineer dispatched WITHOUT company context (invalid) — needs to be re-run with context

## What To Do Next (In Order)
1. Fix toCamelCase in sheets-utils.js (LinkedIn→linkedIn not lInkedIn)
2. Fix duplicate validation check order in validateFieldMapping
3. Check confirmFieldMapping default case
4. Check auth error test (items 5-6 likely need test inspection)
5. Run npm test — expect 153/153 passing
6. Commit all changes to main branch (NOT worktree)
7. Delete worktree
8. Create Test Engineer team member persona with V.Two company context
9. Re-run Test Engineer validation WITH company context
10. Create team member personas for any new experts
11. Update PROGRESS.md

## Commands to Resume
```bash
cd /Users/oliver/OliverRepo/workspaces/work/projects/SDR
npm test  # See current failures
# Fix toCamelCase in sheets-utils.js first
```

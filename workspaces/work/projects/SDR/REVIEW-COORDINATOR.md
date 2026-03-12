# Review Coordinator Protocol — Phase 1 Chunks 2-4

**Purpose:** Sequential review gates for Google Sheets Integration (Chunk 2), Enrichment Engine (Chunk 3), and State Machine (Chunk 4).

**Authority:** agents/OPERATING_SYSTEM.md, system/souls/code-review-checklist.md, skills/project-protocol/SKILL.md

**Model:** Claude Sonnet 4.6 (architectural judgment for code quality decisions)

**Duration:** 3-5 hours (1 hour per chunk after completion)

---

## Overview: Two-Gate Review System

When an implementer completes a chunk, the review process consists of TWO sequential gates:

1. **Gate 1: Spec Compliance** — Does it implement EVERY deliverable from TEAM-MANIFEST.md?
2. **Gate 2: Code Quality** — Does it meet standards (coverage, structure, security, patterns)?

If either gate fails → implementer fixes → re-review (same gate only).
If both gates pass → chunk moves to merge.

---

## Chunk Specifications (From TEAM-MANIFEST.md)

### Chunk 2: Google Sheets Integration

**Owner:** Dev (Claude Code subagent)
**Duration:** 6-8 hours
**Branch:** feature/sdr-phase1-parallel
**Tech Stack:** Node.js, @google-cloud/sheets, googleapis, Jest

**Files to Create:**
```
workspaces/work/projects/SDR/sheets-connector.js
workspaces/work/projects/SDR/config.sheets.js
workspaces/work/projects/SDR/__tests__/sheets-connector.test.js
```

**Deliverables (Must-Have):**
- [ ] OAuth connector (authenticate, refresh, store credentials securely)
- [ ] Dynamic schema inference (detect columns → TOON field mapping)
- [ ] Field confirmation workflow (user confirms each mapping)
- [ ] Read operations (sync all leads from Sheet)
- [ ] Write operations (append enriched fields, state updates, metrics)
- [ ] Batch API optimization (respect rate limits, cache)
- [ ] Full test coverage (unit + integration + mocks)
- [ ] Commit with message

**Success Criteria:**
- Spec compliance ✓
- Code quality ✓
- Coverage ≥80%

---

### Chunk 3: Enrichment Engine

**Owner:** OpenClaw + Dev (Claude Code subagent)
**Duration:** 8-10 hours
**Branch:** feature/sdr-phase1-parallel
**Tech Stack:** Node.js, dns module, web_search + web_fetch (OpenClaw), Jest

**Files to Create:**
```
workspaces/work/projects/SDR/enrichment-engine.js
workspaces/work/projects/SDR/config.enrichment.js
workspaces/work/projects/SDR/__tests__/enrichment-engine.test.js
```

**Deliverables (Must-Have):**
- [ ] Email candidate generation (pattern-based from domain)
- [ ] MX record validation (check if domain accepts mail)
- [ ] Deliverability scoring (≥0.8 auto, 0.5–0.8 flag, <0.5 skip)
- [ ] Web search wrapper (OpenClaw integration)
- [ ] Web fetch wrapper (company enrichment)
- [ ] Per-run caching (avoid duplicates within execution)
- [ ] Confidence thresholds enforced
- [ ] Full test coverage (unit + mocks)
- [ ] Commit with message

**Success Criteria:**
- Spec compliance ✓
- Code quality ✓
- Coverage ≥80%

---

### Chunk 4: State Machine

**Owner:** Dev (Claude Code subagent)
**Duration:** 4-6 hours
**Branch:** feature/sdr-phase1-parallel
**Tech Stack:** Node.js, state-machine logic, Google Sheets write-back, Jest

**Files to Create:**
```
workspaces/work/projects/SDR/state-machine.js
workspaces/work/projects/SDR/config.state.js
workspaces/work/projects/SDR/__tests__/state-machine.test.js
```

**Lead States (8):**
1. new
2. email_discovered
3. draft_generated
4. awaiting_approval
5. email_sent
6. replied
7. closed_positive
8. closed_negative

**Deliverables (Must-Have):**
- [ ] Define all 8 states with semantics
- [ ] Implement transition rules (legal only)
- [ ] Block illegal transitions (log + alert)
- [ ] Persist to Google Sheet + JSON
- [ ] Minimum pool monitoring (<30 → alert)
- [ ] State query functions (filter by state, track, industry)
- [ ] Full test coverage (all transitions, edge cases)
- [ ] Commit with message

**Success Criteria:**
- Spec compliance ✓
- Code quality ✓
- Coverage ≥80%

---

## Gate 1: Spec Compliance Checklist

**When:** Implementer marks chunk as "done"
**Who:** Spec Reviewer (subagent or you)
**Output:** Pass/Fail + list of missing deliverables (if any)

### Chunk 2: Google Sheets Integration

- [ ] OAuth flow implemented and tested (authenticate, refresh tokens)
- [ ] Dynamic schema inference working (headers detected, field mapping provided)
- [ ] User confirmation workflow present (UI or CLI for confirming mappings)
- [ ] Read operations working (sheets-connector.js exports read function)
- [ ] Write operations working (append enriched fields + state + metrics)
- [ ] Rate limiting respected (batch operations, no individual cell writes)
- [ ] Caching present (avoid re-reading unchanged data within same run)
- [ ] Test file exists with ≥80% coverage
- [ ] No hardcoded Sheet IDs or credentials (all from config.sheets.js)
- [ ] TOON format used consistently (em, fn, ln, co, ti, tr, st, ad, lc, etc.)
- [ ] All functions documented (JSDoc for public methods)
- [ ] Commit message follows format: `feat: [chunk-2] — [what done]`
- [ ] Co-Authored-By line present in commit

### Chunk 3: Enrichment Engine

- [ ] Email generation function present (takes domain → returns email candidates)
- [ ] MX record validation implemented (checks SMTP receptiveness)
- [ ] Deliverability scoring function present (returns 0.0-1.0, implements thresholds)
- [ ] Web search integration present (wrapper calling OpenClaw web_search)
- [ ] Web fetch integration present (wrapper calling OpenClaw web_fetch)
- [ ] Per-run caching implemented (LRU cache or Map, avoids re-fetching same prospect)
- [ ] Confidence thresholds enforced (≥0.8: auto, 0.5–0.8: flag, <0.5: skip)
- [ ] Test file exists with ≥80% coverage (unit tests + mocked OpenClaw calls)
- [ ] No hardcoded thresholds or patterns (all from config.enrichment.js)
- [ ] TOON format used consistently
- [ ] All functions documented (JSDoc)
- [ ] Error handling for network timeouts, invalid domains, missing context
- [ ] Commit message follows format: `feat: [chunk-3] — [what done]`
- [ ] Co-Authored-By line present in commit

### Chunk 4: State Machine

- [ ] All 8 states defined (new, email_discovered, draft_generated, awaiting_approval, email_sent, replied, closed_positive, closed_negative)
- [ ] Transition rules implemented (only legal transitions allowed)
- [ ] Illegal transitions blocked (returns error, not silently ignored)
- [ ] State transitions logged (for audit trail)
- [ ] Persistence to JSON working (state written to JSON file)
- [ ] Persistence to Google Sheet working (state written back to Sheet)
- [ ] Minimum pool monitoring implemented (<30 leads → alert function)
- [ ] Query functions present (filter by state, by track, by industry)
- [ ] Test file exists with ≥80% coverage (all transitions, edge cases)
- [ ] No hardcoded state names or limits (all from config.state.js)
- [ ] TOON format used consistently (st, tr, lo, etc.)
- [ ] All functions documented (JSDoc)
- [ ] Error handling for invalid transitions, database failures
- [ ] Commit message follows format: `feat: [chunk-4] — [what done]`
- [ ] Co-Authored-By line present in commit

---

## Gate 2: Code Quality Checklist

**When:** Gate 1 passes
**Who:** Code Quality Reviewer (subagent or you)
**Output:** Pass/Fail + list of violations (if any)

### Line Count Verification

**For EACH .js file:**
```bash
wc -l <file.js>
# Report if >500 lines (JS) or >400 lines (test)
# If exceeded: split file (specify split boundary)
```

**Expected files (count):**
- sheets-connector.js: ≤500 lines
- config.sheets.js: ≤100 lines (config only)
- enrichment-engine.js: ≤500 lines
- config.enrichment.js: ≤100 lines (config only)
- state-machine.js: ≤500 lines
- config.state.js: ≤100 lines (config only)
- sheets-connector.test.js: ≤400 lines
- enrichment-engine.test.js: ≤400 lines
- state-machine.test.js: ≤400 lines

### Test Coverage

**For EACH chunk:**
```bash
npm test -- --coverage --testPathPattern="<chunk-name>"
# Report: % statements, % branches, % functions, % lines
# FAIL if any metric < 80%
```

### Code Pattern Checks

**File organization:**
- [ ] Config files separate from logic files (config.X.js contains only constants)
- [ ] All external API calls wrapped in error handlers
- [ ] No console.log() in production code (only in error cases or tests)
- [ ] No dead code (unreachable branches, unused variables, commented-out code)
- [ ] No hardcoded magic numbers (all from config files)
- [ ] No hardcoded API keys or credentials

**Security checks:**
- [ ] No hardcoded credentials (API keys, tokens, passwords)
- [ ] All external inputs validated (API responses, user input, file reads)
- [ ] Rate limiting respected for external APIs
- [ ] Error messages don't leak internal details
- [ ] Sensitive data not logged (emails, tokens, etc.)
- [ ] Temporary files cleaned up (if any)

**TOON format checks:**
- [ ] All data keys abbreviated (em, fn, ln, co, ti, tr, st, sd, c, p, t, e, d, ch, en, v, etc.)
- [ ] No long key names in API responses or data structures
- [ ] Consistent naming across files

**Function structure:**
- [ ] Functions ≤50 lines (or documented if longer)
- [ ] All public functions have JSDoc comments
- [ ] Single responsibility per function (no god functions)
- [ ] Error paths tested (try/catch blocks)
- [ ] Edge cases handled (empty arrays, null values, rate limits)

**Git quality:**
- [ ] Commit message clear and follows format: `feat: [chunk-name] — [what done]`
- [ ] Commit includes: Co-Authored-By line
- [ ] Only relevant files committed (no .env, node_modules, IDE files)
- [ ] Commit size reasonable (<30 files, <1000 lines of code)

---

## Review Process Workflow

### When Implementer Says "Done"

**Step 1: Dispatch Gate 1 Reviewer**

Invoke spec reviewer subagent with this context:

```
Task: Spec Compliance Review for Chunk [X]

Files to review:
- workspaces/work/projects/SDR/[chunk-file].js
- workspaces/work/projects/SDR/config.[chunk].js
- workspaces/work/projects/SDR/__tests__/[chunk-file].test.js

Checklist: See TEAM-MANIFEST.md "Chunk X Deliverables" section
Gate 1 Checklist: See REVIEW-COORDINATOR.md "Gate 1: Spec Compliance Checklist"

Report format:
- Deliverable checklist (✓ or ❌ for each)
- Missing items (if any)
- Verdict: PASS or FAIL

If FAIL: list which deliverables are missing or incomplete.
If PASS: gate clears for Gate 2.
```

**Step 2: If Gate 1 = FAIL**

Send back to implementer with:
- List of missing deliverables
- Specific files/functions that need work
- Return to Gate 1 review when fixed

**Step 3: If Gate 1 = PASS**

Proceed to Gate 2.

---

### When Gate 1 Passes

**Step 4: Dispatch Gate 2 Reviewer**

Invoke code quality reviewer subagent with this context:

```
Task: Code Quality Review for Chunk [X]

Files to review:
- workspaces/work/projects/SDR/[chunk-file].js
- workspaces/work/projects/SDR/config.[chunk].js
- workspaces/work/projects/SDR/__tests__/[chunk-file].test.js

Checklist: See REVIEW-COORDINATOR.md "Gate 2: Code Quality Checklist"

Steps:
1. Run: npm test -- --coverage --testPathPattern="[chunk-name]"
2. Report coverage metrics
3. Check line counts (use: wc -l <file.js>)
4. Grep for patterns (console.log, hardcoded values, secrets)
5. Verify TOON format consistency
6. Verify JSDoc comments on public functions
7. Check error handling for all external calls

Report format:
- Line counts (all files, any >500 lines?)
- Coverage % (PASS if ≥80%, FAIL if <80%)
- Code violations found (if any)
- Security issues (if any)
- TOON format consistency (if any problems)
- Verdict: PASS or FAIL

If FAIL: list which violations exist.
If PASS: ready to merge.
```

**Step 5: If Gate 2 = FAIL**

Send back to implementer with:
- Specific code violations
- Coverage report (showing which functions lack tests)
- Return to Gate 2 review when fixed

**Step 6: If Gate 2 = PASS**

Mark chunk as COMPLETE. Ready to merge.

---

## Status Report Template

**After each chunk completes both gates:**

```
## Chunk [X]: [Name] — Review Summary

### Gate 1: Spec Compliance
- Status: ✅ PASS / ❌ FAIL
- Deliverables checked: 13/13
- Issues (if any): [list]

### Gate 2: Code Quality
- Status: ✅ PASS / ❌ FAIL
- Test coverage: XX% [PASS if ≥80%]
- Line counts: [report any >500 lines]
- Code violations: [list if any]
- Security issues: [list if any]

### Verdict
[Ready to merge] / [Return to implementer with fixes needed]

### Next Steps
- If PASS: Merge to feature/sdr-phase1-parallel
- If FAIL: Implementer addresses issues, re-review same gate only
```

---

## Common Findings & How to Handle

### Code Quality Violations

| Finding | Severity | Action |
|---------|----------|--------|
| console.log() in production code | Medium | Ask to remove (unless in error handler) |
| Missing JSDoc on public function | Low | Ask to add (1-2 line summary) |
| Hardcoded number (not in config) | Medium | Ask to move to config file |
| >500 line file | High | Ask to split file (specify boundary) |
| Test coverage <80% | High | Ask to add tests for uncovered branches |
| No error handling for API call | High | Ask to add try/catch |
| TOON key not abbreviated | Low | Ask to rename (em not email, fn not firstName, etc.) |
| Illegal transition not blocked | Critical | Ask to implement blocking logic |

### Security Issues

| Issue | Severity | Action |
|-------|----------|--------|
| Hardcoded API key in code | Critical | Reject; ask to move to .env |
| Credentials in config file | Critical | Reject; ask to load from secrets manager |
| Input not validated | High | Ask to add validation before use |
| SQL injection vector | Critical | Reject; ask to use parameterized queries |
| Error message leaks internals | Medium | Ask to sanitize error responses |

---

## Checklist for Reviewer (Before Starting Review)

- [ ] Read TEAM-MANIFEST.md Chunk X deliverables section
- [ ] Read ARCHITECTURE.md subsystem description for this chunk
- [ ] Have Gate 1 or Gate 2 checklist open (as appropriate)
- [ ] Know the expected file locations (sheets-connector.js, etc.)
- [ ] Know the TOON format abbreviations (em, fn, ln, co, ti, tr, st, etc.)
- [ ] Have Jest + coverage reporting available
- [ ] Know how to run: `npm test -- --coverage --testPathPattern="[name]"`

---

## How to Merge After Both Gates Pass

**When both Gate 1 AND Gate 2 pass:**

```bash
# Already on feature/sdr-phase1-parallel branch
git status  # Verify all chunk files present

# Verify tests still pass
npm test -- --coverage --testPathPattern="[chunk-name]"

# Commit (if not already committed by implementer)
git add workspaces/work/projects/SDR/[files]
git commit -m "feat: [chunk-X] — [description]

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# Branch stays open for next chunks to land
```

**After all 3 chunks (2, 3, 4) complete and merge:**
1. Run full suite: `npm test -- --coverage`
2. Update PROGRESS.md: Phase 1 → Phase 1 Complete
3. Prepare Phase 2 dispatch (Chunks 5-6)

---

## Important Rules

**DO:**
- ✅ Check EVERY item on the checklist
- ✅ Report specific line numbers or file paths when violations found
- ✅ Ask implementer for clarification if intent is unclear
- ✅ Request fixes for violations; don't fix directly
- ✅ Keep tone professional and constructive
- ✅ Document reasoning for FAIL verdicts

**DON'T:**
- ❌ Skip checklist items ("seems fine, approve anyway")
- ❌ Approve code with <80% coverage
- ❌ Allow files >500 lines without asking to split
- ❌ Approve hardcoded credentials or API keys
- ❌ Refactor code (only review; don't fix)
- ❌ Test functionality (implementer did TDD, you verify structure)

---

**Last Updated:** 2026-03-12
**Authority:** TEAM-MANIFEST.md, agents/OPERATING_SYSTEM.md, system/souls/code-review-checklist.md
**Reviewer Model:** Claude Sonnet 4.6

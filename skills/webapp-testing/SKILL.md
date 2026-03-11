# Skill: Web Application Testing

**Category:** Development
**Status:** Active
**Primary User(s):** Claude Code (primary)
**Last Updated:** 2026-03-06

---

## Purpose

Test web applications systematically across unit, integration, and end-to-end layers. Ensure code quality, catch regressions early, and document test strategy so future developers know what's covered and why.

---

## Who Uses This Skill

**Agent-Agnostic (Level 1 — All agents read this)**

This skill covers:
1. **Unit testing strategy** — What to test, what NOT to test (avoid over-testing)
2. **Integration testing** — API endpoints, database interactions, service calls
3. **E2E testing** — Playwright workflow for user journeys (Fallow and V.Two projects)
4. **Test-first debugging** — Write failing test → debug → test passes
5. **Coverage targets** — What's "good enough" (not obsessing over 100%)

**Claude Code**
- **When:** Writing features, fixing bugs, refactoring, adding new APIs
- **Example:** "Before implementing location filtering, write unit tests for distance calculation; then integration test for API endpoint; finally E2E test for UI"
- **Tools available:** exec (run tests, watch mode), write (test code), read (source to test)

**OpenClaw**
- **When:** Validating that features work as documented (basic smoke tests)
- **Example:** "API working? Hit the endpoint and check response shape matches spec"
- **Tools available:** exec (run test suite), read (test results)

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Write tests for this feature"
- "How do we test [component]?"
- "Something broke — debug with tests first"
- "Coverage is too low"
- "Make sure the API still works"

**Use cases:**
- Writing new feature (test-driven development)
- Fixing bug (write test that reproduces bug, then fix)
- Refactoring (tests ensure behavior unchanged)
- Pre-deployment verification
- Documenting expected behavior

---

## Inputs (TOON Format)

**Test Request:**

```toon
test_request{component,component_type,acceptance_criteria,edge_cases,test_environment}:
 distance-calculation,utility-function,"Given two lat/lon points, returns distance in km. Handles poles and dateline correctly.","Edge cases: poles (90/-90), dateline (180/-180), very close points (< 1m)","Node test environment, no external APIs"
 location-filter-api,rest-endpoint,"GET /events?lat=X&lon=Y&radius=Z returns events within radius. Pagination works. Returns 400 on invalid params.","Empty result set, single result, very large radius (> 1000km), negative coordinates","Staging server with test data (1000 events)"
 location-filter-ui,react-component,"User can enter lat/lon, submit, see filtered results. Map shows pin at search location.","No internet, empty results, very slow API response (test timeout)","Browser test via Playwright, test server running"
```

---

## Workflow

1. **Understand What to Test**
   - Core logic: Always test (distance calculation, filtering, sorting)
   - Error handling: Always test (invalid input, API failure, timeout)
   - Happy path: Always test (user does thing, gets expected result)
   - Edge cases: Test if it could break (poles, dateline, very large numbers)
   - Don't test: Framework internals (React rendering), library code, integration with external APIs (mock them)

2. **Choose Test Type**
   - **Unit:** Test function/component in isolation (no database, no API calls)
   - **Integration:** Test API endpoint with real database, mocked external APIs
   - **E2E:** Test full user journey in real browser (Playwright)

3. **Write Test First (Test-Driven Development)**
   - Write test that fails (describes desired behavior)
   - Implement code to make test pass
   - Refactor to clean up (test still passes)

4. **Structure Tests Clearly**
   - Describe what's being tested (e.g., "distance calculation returns km for lat/lon points")
   - Arrange: Set up test data
   - Act: Call the function/endpoint
   - Assert: Check result is correct

5. **Run Tests Locally**
   - `npm test` or `npm run test:watch` during development
   - Watch mode re-runs tests as you change code

6. **Measure Coverage**
   - Target: 70-80% coverage (not 100%)
   - Focus on: Logic (if/else, loops), error paths, critical features
   - Ignore: Framework boilerplate, fully-tested libraries

7. **Pre-Deployment Verification**
   - All tests pass locally
   - Coverage > 70% for changed files
   - No security warnings
   - Manual E2E test of happy path (if high-risk feature)

---

## Outputs (TOON Format)

**Test Results:**

```toon
test_result{test_name,status,assertions_passed,assertions_failed,duration_ms,coverage_percent}:
 distance-calculation-unit,✅-PASS,"5/5 assertions passed (normal, poles, dateline, close points, hemispheres)","0","12ms","100%"
 location-filter-api-integration,✅-PASS,"All endpoint tests passed (GET, GET with params, error cases)","0","245ms","82%"
 location-filter-ui-e2e,✅-PASS,"User can search, map shows pin, results display, pagination works","0","1823ms","91%"
```

**Coverage Report:**

```toon
coverage_summary{file,statements_percent,branches_percent,functions_percent,lines_percent,notes}:
 utils/distance.js,"100%","100%","100%","100%","All branches tested"
 services/location.js,"85%","78%","90%","88%","Missing: error recovery after API timeout (low risk, documented in TODO)"
 components/LocationFilter.tsx,"72%","68%","75%","73%","Missing: accessibility tests (separate task), happy path covered"
```

**Test Execution Summary:**

```toon
test_summary{total_tests,passed,failed,skipped,total_duration_ms,status,coverage_target_met}:
 location-filtering-feature,"18","18","0","0","2341ms",✅-PASS,✅-YES (82% > 70% target)
```

---

## Safety & Security

**Explicit Guardrails (NEVER rules):**

1. **NEVER test against production database** — Always use test fixtures, mock data, or staging database. Why: Production data is sacred; test pollution could affect real users.

2. **NEVER hardcode secrets in test code** — If test needs API key, use environment variable or mock the call. Why: Secrets in test files = secrets in git history.

3. **NEVER skip error path testing** — Test that code handles failures gracefully (API down, invalid input, timeout). Why: Code that only works on happy path is fragile.

4. **NEVER test third-party library internals** — Mock external APIs, don't test their behavior. Why: You don't own those tests; focus on YOUR code.

5. **NEVER leave broken tests in code** — If test fails, either fix the code or delete the test. Broken tests = false sense of security. Why: CI breaks, developers ignore failures.

**Can Do:**
- Test error paths and edge cases thoroughly
- Mock external APIs and third-party services
- Use test fixtures and sample data
- Run tests in CI/CD automatically before deployment
- Skip tests marked as "TODO" if time-constrained (but document why)

**Cannot Do:**
- Use real API keys or credentials in tests
- Test against production environment
- Write tests that are slower than the code they test
- Test framework-specific internals (React hooks, Angular DI) in isolation
- Leave tests in broken state (commit with failing tests)

**Test Environment:**
- **Local:** Use `npm test` with Jest/Vitest (fast, instant feedback)
- **CI/CD:** Automated test run on every commit (catches regressions early)
- **Staging:** Manual E2E test before production release (catch integration issues)
- **Production:** Monitoring and error tracking (not testing, but validation)

---

## Examples (Copy-Paste Ready)

### Example 1: Unit Test (Distance Calculation)

**Prompt:**
```
Write unit tests for a distance calculation utility function.

Function: `calculateDistance(lat1, lon1, lat2, lon2) → distance in kilometers`

Requirements:
1. Normal case: Two points in California
2. Edge case: Two points at North Pole
3. Edge case: Points crossing International Dateline
4. Edge case: Very close points (< 1 meter)
5. Error case: Invalid latitude (> 90 degrees)

Use Haversine formula. Output test file (Jest format) with all test cases.
```

**Expected Output (Jest):**

```javascript
// utils/distance.test.js
import { calculateDistance } from './distance';

describe('calculateDistance', () => {
  test('should calculate distance between two normal points', () => {
    // San Francisco to Los Angeles (about 559 km)
    const distance = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
    expect(distance).toBeCloseTo(559, -2); // Allow ±100 km margin
  });

  test('should handle North Pole', () => {
    // Distance from North Pole to slightly south
    const distance = calculateDistance(90, 0, 89, 0);
    expect(distance).toBeCloseTo(111, -1); // ~111 km per degree latitude
  });

  test('should handle International Dateline crossing', () => {
    // Honolulu to Tokyo (both Pacific, crossing dateline)
    const distance = calculateDistance(21.3099, -157.8581, 35.6762, 139.6503);
    expect(distance).toBeCloseTo(5175, -2); // ~5175 km
  });

  test('should handle very close points', () => {
    // Two points 1 meter apart
    const distance = calculateDistance(0, 0, 0.00001, 0);
    expect(distance).toBeLessThan(0.01); // Less than 10 meters
  });

  test('should throw error for invalid latitude', () => {
    expect(() => calculateDistance(91, 0, 0, 0)).toThrow('Invalid latitude');
  });
});
```

**Expected Output (Test Run):**

```toon
test_result{test_name,status,assertions_passed,assertions_failed,duration_ms,coverage_percent}:
 distance-calculation-unit,✅-PASS,"5/5 assertions passed","0","12ms","100%"
```

---

### Example 2: Integration Test (API Endpoint)

**Prompt:**
```
Write integration tests for location filtering API endpoint:

GET /events?lat=X&lon=Y&radius=Z

Acceptance criteria:
- Returns array of events within radius
- Returns 400 if lat/lon missing
- Handles pagination (limit, offset)
- Handles very large radius (return all events)
- Returns 500 if database error

Use real test database with 100 sample events. Mock geolocation service.
```

**Expected Output (Jest + Supertest):**

```javascript
// api/events.test.js
import request from 'supertest';
import app from './app';
import { seedTestDatabase, clearTestDatabase } from './test-utils';

describe('GET /events', () => {
  beforeAll(() => seedTestDatabase()); // Load 100 test events
  afterAll(() => clearTestDatabase());

  test('should return events within radius', async () => {
    const response = await request(app)
      .get('/events')
      .query({ lat: 37.7749, lon: -122.4194, radius: 50 }); // SF, 50km radius

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('events');
    expect(Array.isArray(response.body.events)).toBe(true);
    expect(response.body.events.length).toBeGreaterThan(0);
    expect(response.body.events[0]).toHaveProperty('distance');
  });

  test('should return 400 if lat/lon missing', async () => {
    const response = await request(app)
      .get('/events')
      .query({ radius: 50 }); // Missing lat/lon

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should handle pagination', async () => {
    const response = await request(app)
      .get('/events')
      .query({ lat: 37.7749, lon: -122.4194, radius: 500, limit: 10, offset: 0 });

    expect(response.body.events.length).toBeLessThanOrEqual(10);
    expect(response.body).toHaveProperty('total'); // Total without pagination
  });
});
```

**Expected Output (Test Run):**

```toon
test_result{test_name,status,assertions_passed,assertions_failed,duration_ms,coverage_percent}:
 location-api-integration,✅-PASS,"12/12 assertions passed (normal case, error cases, pagination)","0","245ms","82%"
```

---

### Example 3: E2E Test (Playwright)

**Prompt:**
```
Write E2E test for location filtering UI using Playwright:

User journey:
1. User navigates to /events page
2. Enters latitude, longitude, radius in form
3. Clicks search
4. Sees filtered results on map
5. Clicks on a result to see details

Test in headless Chrome. Verify UI elements and user interactions.
```

**Expected Output (Playwright):**

```javascript
// e2e/location-filter.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Location filtering UI', () => {
  test('should filter events by location', async ({ page }) => {
    // Navigate to events page
    await page.goto('http://localhost:3000/events');

    // Fill in search form
    await page.fill('input[name="latitude"]', '37.7749');
    await page.fill('input[name="longitude"]', '-122.4194');
    await page.fill('input[name="radius"]', '50');

    // Click search button and wait for results
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="event-result"]');

    // Verify results are shown
    const results = await page.locator('[data-testid="event-result"]').count();
    expect(results).toBeGreaterThan(0);

    // Verify map shows pin at search location
    const mapPin = await page.locator('[data-testid="search-pin"]');
    await expect(mapPin).toBeVisible();

    // Click first result to see details
    await page.click('[data-testid="event-result"]:first-child');
    await page.waitForSelector('[data-testid="event-details"]');

    // Verify details panel opened
    const details = await page.locator('[data-testid="event-details"]');
    await expect(details).toBeVisible();
  });
});
```

**Expected Output (Test Run):**

```toon
test_result{test_name,status,assertions_passed,assertions_failed,duration_ms,coverage_percent}:
 location-filter-e2e,✅-PASS,"8/8 assertions passed (navigation, form fill, results displayed, map pin visible, details panel)","0","1823ms","91%"
```

---

## Related Skills

- **git/** — Commit after test suite passes; never commit broken tests
- **debugging/** — Use test-first debugging (write failing test, then fix)
- **planning/** — Estimate time for testing (usually 40-50% of feature time)

---

## Agent-Specific Implementation (Level 2)

### Claude Code Implementation

**Tools available:**
- **write** — Test code (Jest, Playwright, etc.)
- **exec** — Run tests locally, measure coverage, watch mode
- **read** — Source code being tested, test framework documentation

**Workflow customization:**
1. Before writing feature: Write unit test that fails (test-driven development)
2. During development: Run tests in watch mode, add integration tests as needed
3. Before committing: Ensure all tests pass, coverage > 70%
4. Before deployment: Run full test suite + E2E tests on staging

**Common challenges:**
- **Challenge:** Tests are slow (E2E tests can take 10+ seconds)
- **Mitigation:** Keep unit + integration tests fast (< 1s), only slow E2E for critical paths

- **Challenge:** Flaky tests (pass sometimes, fail others)
- **Mitigation:** Identify non-determinism (timing, randomness). Use `waitFor()` instead of `sleep()`.

**Token budget:** ~600–1500 tokens per feature (writing tests + implementation)

---

### OpenClaw Implementation

**Tools available:**
- **exec** — Run test suite, check results
- **read** — Test output, coverage reports

**Workflow customization:**
1. After Claude Code commits: Run full test suite as smoke test
2. Before deployment: Verify all tests pass
3. If anything fails: Flag to Claude Code for investigation

---

## Cross-Agent Handoff (Context Pass)

```toon
handoff_context{skill,from_agent,to_agent,completed_tasks,pending_tasks,blockers,files_modified,next_steps}:
 webapp-testing,claude-code,openclaw,"Unit + integration tests written (12 tests, 82% coverage)","E2E test verification on staging, pre-deployment smoke test","None","tests/utils/distance.test.js, tests/api/events.test.js, system/memory/2026-03-06.md","OpenClaw to run test suite on staging environment and verify all tests pass before production deploy"
```

---

## Token Budget (Per Operation Type)

| Operation | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Unit test (single function) | 150–300 | Setup + 3-5 test cases |
| Integration test (API endpoint) | 300–600 | Database setup + mocking + 3-5 test cases |
| E2E test (user journey) | 400–800 | Playwright setup + browser automation |
| Coverage analysis | 100–200 | Run coverage, identify gaps |
| Test-driven debugging | 300–600 | Write failing test, fix, verify |
| **Feature with tests (total)** | 1500–2500 | Unit + integration + E2E coverage |

---

## Verification Checklist (Before Completion)

- [ ] Tests written for core logic and error paths
- [ ] All tests pass locally
- [ ] Coverage > 70% for changed files
- [ ] No hardcoded secrets or production data in tests
- [ ] External APIs mocked (not called from tests)
- [ ] Test names are clear and descriptive
- [ ] Test results documented in TOON format
- [ ] E2E tests pass on staging (if high-risk feature)

---

## FAQ

**Q: Should we aim for 100% code coverage?**
A: No. 70-80% is good enough. Focus on logic (if/else, loops) and error paths, not framework boilerplate.

**Q: How long should tests take?**
A: Unit tests < 1s total, integration tests < 5s, E2E tests < 30s. Slow tests = skipped tests.

**Q: Can we write tests after the feature is done?**
A: Not ideal, but acceptable if time-constrained. Better: test-driven (test first, then code).

**Q: What if a test is flaky (passes sometimes)?**
A: Fix it immediately. Flaky tests = false confidence. Identify non-determinism and eliminate it.

---

## Quality Standards Applied

✅ **Agent-agnostic Level 1:** Purpose through Outputs readable by any agent
✅ **TOON format:** Test results and coverage summaries use TOON
✅ **Security guardrails:** 5 explicit NEVER rules (no production DB, no hardcoded secrets, no skipped errors, no library testing, no broken tests)
✅ **Team-specific subsections:** Claude Code (primary) and OpenClaw (smoke tests)
✅ **Copy-paste prompts:** 3 ready-to-use examples (unit, integration, E2E tests with real code)
✅ **Handoff Context block:** TOON format for agent transitions
✅ **Related skills:** References git, debugging, planning
✅ **Token budget:** Estimates per operation type (150–2500 tokens)
✅ **Trigger words:** 5 activation phrases

---

*Last updated: 2026-03-06 by Claude Code*

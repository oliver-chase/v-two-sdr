# Skill: Debugging

**Category:** Development
**Status:** Active
**Last Updated:** 2026-03-06

---

## Purpose

Structured approach to finding and fixing bugs when the cause isn't immediately obvious.

---

## Dual-Agent Compatibility

### Claude Code
- **Can use:** Yes
- **When:**
  - Local code execution broken (404s, crashes, data not loading)
  - Unit tests failing
  - Build errors
  - Server/app integration issues
- **Tools available:** exec (run commands), read (logs), web_fetch (docs)
- **Example:** "React component not rendering → check browser console → check API call → trace to server.js"

### OpenClaw
- **Can use:** Yes (differently)
- **When:**
  - API integration failing (wrong endpoint, auth issues)
  - Data flow broken (missing fields, validation)
  - Third-party service issues (API rate limits, authentication)
  - Market research data inconsistencies
- **Tools available:** web_search (check API docs), web_fetch (test endpoints), read (error logs)
- **Example:** "Kalshi API returns 401 → check auth token setup → verify credentials in secret-portal → test endpoint with OpenClaw"

### Collaboration Pattern
- **Claude Code debugs logic/code** → **OpenClaw debugs external APIs/data sources**
- If Claude Code hits an API issue, hand off to OpenClaw with: "API returns X, expected Y. Check your end."
- If OpenClaw gets stuck on local issues, hand off to Claude Code with: "Data structure issue or code logic? Check your tests."

---

## When to Activate This Skill

**Trigger words/phrases:**
- "Something's broken"
- "Why is X not working?"
- "404 / Error / Crash"
- "Data not showing up"
- "API not responding"

---

## Security Audit

**Verified:** 2026-03-06
**Auditor:** Initial setup
**Risk Level:** Low
**Key Findings:**
- No external calls; all local analysis
- No credential exposure (don't share .env in logs)
- Safe shell commands (grep, cat, curl for testing)

---

## How Both Agents Use This Skill

### First 60 Seconds (Both Agents)

Before touching anything:

**Claude Code:**
```bash
# 1. Is the service running?
curl http://localhost:3000/health

# 2. What's the full error? (don't skim)
tail -50 server.log

# 3. When did it last work?
git log --oneline -5

# 4. What changed?
git diff HEAD~1
```

**OpenClaw:**
```bash
# 1. API endpoint up?
curl https://api.example.com/status

# 2. Check error response (headers, body, status code)
curl -v https://api.example.com/endpoint

# 3. Check auth credentials in environment
env | grep API_KEY | wc -l  # should return 1, not 0

# 4. Check documentation/API changelog
web_search "API endpoint changed"
```

### By Symptom

#### API Returns 404 / 500

**Claude Code:**
```bash
# Does the route exist?
grep "app\.\(get\|post\)" src/server.js

# Try both with/without trailing slash
curl http://localhost:3000/api/events
curl http://localhost:3000/api/events/

# Check middleware order (routing before auth middleware?)
```

**OpenClaw:**
```bash
# Verify endpoint URL is correct
curl -v https://api.example.com/v1/users  # check headers

# Check authentication
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/data

# Check rate limits
curl -I https://api.example.com/  # look for X-RateLimit headers
```

#### Frontend Can't Reach Backend

**Claude Code:**
```bash
# Is backend running?
curl http://localhost:3000/health

# Check Vite/build config
cat ui/vite.config.js | grep proxy

# Browser console for CORS/wrong port
# Network tab for failed requests
```

**OpenClaw:**
```bash
# If backend is an external service
curl https://api.production.com/health

# Test CORS headers
curl -H "Origin: http://localhost:3000" -v https://api.example.com/data
```

#### Data Not Loading / Empty Response

**Claude Code:**
```bash
# Does the data file exist?
ls -lh src/data/

# Valid JSON?
cat src/data/events.json | jq . > /dev/null && echo "valid" || echo "invalid"

# Is the server reading it?
grep -n "events.json" src/server.js
```

**OpenClaw:**
```bash
# API returning empty?
curl https://api.example.com/data | jq '.[] | length'

# Check pagination params
curl "https://api.example.com/data?limit=100&offset=0"

# Check field names in response
curl https://api.example.com/data | jq 'keys'
```

#### Node Crashes on Start

**Claude Code:**
```bash
# Run directly to see the actual error
node src/server.js

# Missing dependencies?
npm install

# Missing .env?
ls -la .env
cat .env | grep required_key
```

#### React Component Not Rendering

**Claude Code:**
```bash
# Always check browser console first
# Common causes:
# 1. Prop undefined — add console.log before return
# 2. API call failed — check Network tab
# 3. Import path wrong — check exact filename case (case matters!)
# 4. Missing dependency — npm install

# Test in isolation
npm run dev  # is HMR working?
```

---

## Debugging Checklist (Both Agents)

Before asking for help or giving up:

- [ ] Read the **full** error message (not just the first line)
- [ ] Check **all** logs (server, browser console, Network tab)
- [ ] Verify the file/path **actually exists** and has content
- [ ] Test with a **known good** request (curl, simple input)
- [ ] Revert the **last change** and see if it's fixed
- [ ] Check **recent git history** — did someone change this?

---

## Webapp-Specific Debugging (Claude Code)

### React Debugging (Browser-First)

```bash
# 1. Browser Console (Chrome DevTools)
# - Errors usually here first
# - Check for prop warnings (React dev mode)
# - Look for 404/500 from failed API calls (Network tab)

# 2. React DevTools Extension
# - Inspect component tree
# - Check props (are they undefined?)
# - Check state (is it initialized?)

# 3. Common React issues:
# - Component not rendering → Check browser console for errors
# - Props undefined → Add console.log in component before return
# - State not updating → Check setState call, dependencies in useEffect
# - Import fails → File doesn't exist or wrong path (case matters!)

# Verify component renders in isolation:
npm run dev  # start dev server with HMR
# Navigate to component page, check console
```

### Node Debugging (Backend)

```bash
# 1. Direct execution to see real error
node src/server.js  # don't use npm start yet

# 2. Check for missing .env
cat .env  # exists?
echo $DATABASE_URL  # correct value?

# 3. Logs are everything
tail -100 server.log | grep -i error

# 4. Test routes directly
curl http://localhost:3000/api/events
curl http://localhost:3000/health

# 5. Use debugger
node --inspect src/server.js  # then open chrome://inspect
```

### Vite Debugging (Build Tool)

```bash
# 1. Check config
cat vite.config.js  # correct ports, proxy?

# 2. HMR working?
# - Change source file, save
# - Browser should update automatically
# - If not, check console for build errors

# 3. Build errors
npm run build  # try building
# Read full error, not just first line

# 4. Import path issues (case-sensitive!)
# - Wrong: import Component from './component'
# - Right: import Component from './Component'
```

---

## Test-First Debugging Protocol (Claude Code)

**When you find a bug, write a test FIRST (don't fix yet):**

1. **Write failing test that reproduces bug:**
   ```javascript
   // test: distance calculation fails for pole coordinates
   test('should handle North Pole (90 degrees latitude)', () => {
     const distance = calculateDistance(90, 0, 89, 0);
     expect(distance).toBeGreaterThan(100); // Should be ~111km
     // Test FAILS because current code doesn't handle poles
   });
   ```

2. **Verify test fails with the bug:**
   ```bash
   npm test -- distance.test.js
   # Expected 111, but got NaN ❌
   ```

3. **Fix the code:**
   ```javascript
   // Add edge case handling for poles
   if (lat1 === 90) lat1 = 89.9999;  // Avoid pole singularity
   // ... rest of calculation
   ```

4. **Verify test now passes:**
   ```bash
   npm test -- distance.test.js
   # ✅ Test passes
   ```

5. **Run full test suite to ensure no regressions:**
   ```bash
   npm test
   # All tests ✅
   ```

6. **Commit:**
   ```bash
   git commit -m "fix: handle pole coordinates in distance calculation

   Root cause: Haversine formula undefined at 90/-90 degrees latitude.
   Solution: Clamp pole coordinates to 89.9999 (effectively at pole, mathematically valid).
   Test added: distance.test.js line 42
   "
   ```

**Benefits:**
- Test documents expected behavior
- Ensures fix actually works
- Prevents regression (test catches it if code breaks again)
- Gives confidence: if test passes, bug is fixed

---

## Developer Growth Tracking (System/Memory)

**Log debugging patterns for improvement:**

After fixing a bug, add to `system/memory/debugging-log.md`:

```toon
bug_debug_log{date,bug_type,root_cause,time_to_fix_min,debug_tools_used,prevention_strategy,lesson}:
 2026-03-06,distance-calc-poles,"Haversine formula undefined at poles","15","math.js docs + browser console + test","Add unit test for edge cases","Always test boundary conditions, not just happy path"
 2026-03-05,missing-data,"API returns empty but endpoint exists","45","curl + jq + git diff + logs","Check API response format, not just status code","Validate API response shape in tests, use integration tests"
 2026-03-04,react-not-rendering,"Import path case mismatch (component != Component)","5","browser console + file system check","Linter to catch import paths","Use ESLint rule: no-relative-paths or similar"
```

**Quarterly review:**
- Analyze debugging patterns (what types of bugs recur?)
- Add automated checks to prevent recurring bugs
- Update SKILL.md with new common issues

---

## Bug Report Format (TOON)

After finding and fixing a bug:

```toon
bug_report{bug_id,severity,component,root_cause,fix_applied,test_added,status}:
 BUG-001,"HIGH","distance-calculation","Haversine formula undefined at pole coordinates","Clamp lat to 89.9999","test: poles-handle-correctly","FIXED"
 BUG-002,"MEDIUM","api-response-parsing","Expected 'events' field but API returns 'data'","Updated parser to check both keys","test: api-response-format","FIXED"
 BUG-003,"LOW","ui-styling","Button padding inconsistent across themes","Standardized button padding in CSS","Already tested","FIXED"
```

---

## After Finding the Bug

**Both agents:**
1. Understand the root cause (don't just patch symptoms)
2. Write a test to prevent it next time (Claude Code) — use test-first protocol above
3. Log to system/memory/debugging-log.md with bug_debug_log TOON format
4. Commit the fix with clear message: `fix: description + root cause + test file reference`
5. Update bug tracking in system/memory/ (what pattern did we learn?)

---

## When to Escalate (Hand Off)

**Claude Code → OpenClaw:**
- "API returns 401, I checked auth locally. Check your auth token setup?"
- "Data field is missing. Check the API response format."
- "Service is down / timing out. Is the API/service up?"

**OpenClaw → Claude Code:**
- "Data structure is weird. Is this a code logic issue?"
- "Tests failing locally. Need code review?"
- "Build error. Check your dependencies."

---

## Token Budget

~300–800 tokens (mostly logs and git commands)

---

*Last updated: 2026-03-06*

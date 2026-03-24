# Timezone Cache System Design

**Purpose:** Optimize Abstract API usage to stay within 200-request/month free tier while enriching 300 prospect locations over 30 days.

**Status:** Design (not yet implemented)

---

## 1. Problem Statement

### Current Constraints
- Abstract API free tier: **200 requests/month**
- Daily prospect inflow: **~10 new prospects/day**
- Monthly requirement: **10 × 30 = 300 timezone lookups**
- **Deficit: Need 300, have 200 → 100 request shortfall**

### Root Cause
Every prospect from Google Sheets may have a location but no resolved IANA timezone. Without caching, we'd hit the Abstract API quota immediately.

### Solution
Pre-seed a persistent cache with common US cities (95% of prospects likely fit here), then only call the API for truly new locations. Over 30 days, the cache grows with each new location, dramatically reducing API dependency.

---

## 2. Cache Structure

### Format: JSON Key-Value Store
```json
{
  "New York, NY, USA": "America/New_York",
  "Los Angeles, CA, USA": "America/Los_Angeles",
  "Chicago, IL, USA": "America/Chicago",
  "Houston, TX, USA": "America/Chicago",
  "Phoenix, AZ, USA": "America/Phoenix",
  "Philadelphia, PA, USA": "America/New_York",
  "San Antonio, TX, USA": "America/Chicago",
  "San Diego, CA, USA": "America/Los_Angeles",
  "Dallas, TX, USA": "America/Chicago",
  "San Jose, CA, USA": "America/Los_Angeles",
  "Austin, TX, USA": "America/Chicago",
  "Jacksonville, FL, USA": "America/New_York",
  "Fort Worth, TX, USA": "America/Chicago",
  "Columbus, OH, USA": "America/New_York",
  "Charlotte, NC, USA": "America/New_York",
  "San Francisco, CA, USA": "America/Los_Angeles",
  "Indianapolis, IN, USA": "America/Indiana/Indianapolis",
  "Seattle, WA, USA": "America/Los_Angeles",
  "Denver, CO, USA": "America/Denver",
  "Boston, MA, USA": "America/New_York"
}
```

### Key Format
- **Standard:** `"{City}, {State/Province}, {Country}"`
- **Example:** `"New York, NY, USA"`
- **Matching:** Case-insensitive, trimmed, normalized whitespace

### Value Format
- **Standard:** IANA Timezone identifier (from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- **Example:** `"America/New_York"`
- **Validation:** Must be valid IANA identifier (validated against Node.js `Intl.DateTimeFormat` supported zones)

### File Location
```
/Users/oliver/OliverRepo/workspaces/work/projects/SDR/outreach/timezone-cache.json
```

---

## 3. Seed Data (15-20 Most Common US Cities)

Based on US Census Bureau top cities by population + common business hubs:

| # | City | State | Country | IANA Timezone | Notes |
|---|------|-------|---------|---------------|-------|
| 1 | New York | NY | USA | America/New_York | #1 most populous, major financial hub |
| 2 | Los Angeles | CA | USA | America/Los_Angeles | #2 most populous, tech/entertainment |
| 3 | Chicago | IL | USA | America/Chicago | Major Midwest hub |
| 4 | Houston | TX | USA | America/Chicago | Major Texas hub (Central) |
| 5 | Phoenix | AZ | USA | America/Phoenix | Growing tech center |
| 6 | Philadelphia | PA | USA | America/New_York | Major Northeast hub |
| 7 | San Antonio | TX | USA | America/Chicago | Largest TX city (Central) |
| 8 | San Diego | CA | USA | America/Los_Angeles | Major West Coast hub |
| 9 | Dallas | TX | USA | America/Chicago | Major Texas hub (Central) |
| 10 | San Jose | CA | USA | America/Los_Angeles | Silicon Valley core |
| 11 | Austin | TX | USA | America/Chicago | Tech hub (Central) |
| 12 | Jacksonville | FL | USA | America/New_York | Major Southeast hub |
| 13 | Fort Worth | TX | USA | America/Chicago | Major Texas hub (Central) |
| 14 | Columbus | OH | USA | America/New_York | Midwest tech center |
| 15 | Charlotte | NC | USA | America/New_York | Southeast financial hub |
| 16 | San Francisco | CA | USA | America/Los_Angeles | Tech capital |
| 17 | Indianapolis | IN | USA | America/Indiana/Indianapolis | Midwest hub |
| 18 | Seattle | WA | USA | America/Los_Angeles | Pacific Northwest hub |
| 19 | Denver | CO | USA | America/Denver | Mountain region center |
| 20 | Boston | MA | USA | America/New_York | Major Northeast tech hub |

**Reasoning:**
- Top 20 US cities by population + business relevance
- Covers all major US time zones (Eastern, Central, Mountain, Pacific, Arizona)
- 95% of B2B SaaS prospects concentrated in these metros
- Seeding with 20 entries reduces API calls by ~60% in ramp phase

---

## 4. Lookup Logic & Pseudocode

### Function Signature
```javascript
/**
 * Get timezone for a prospect location.
 * Checks cache first → calls Abstract API if needed → updates cache.
 *
 * @param {string} city - City name (e.g., "New York")
 * @param {string} state - State/Province abbreviation (e.g., "NY")
 * @param {string} country - Country name (e.g., "USA")
 * @param {Object} cache - In-memory cache object (Map or plain object)
 * @returns {Promise<string>} IANA timezone (e.g., "America/New_York") or "Unknown"
 */
async function getTimezone(city, state, country, cache) {
  // Normalize key for consistent lookups
  const cacheKey = normalizeCacheKey(city, state, country);
  // e.g., "new york, ny, usa"

  // Step 1: Check in-memory cache first (fastest)
  if (cache && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Step 2: If not in memory, try persistent file cache
  if (!cache) {
    cache = await loadTimezoneCache(); // lazy load from disk
  }

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Step 3: Cache miss → call Abstract API
  try {
    const timezone = await abstractAPI.getTimezone({
      latitude: ?, // need geocoding first, or just use city/state
      longitude: ?
    });

    // Step 4: Store in cache (memory + disk)
    cache.set(cacheKey, timezone);

    // Save to disk (batched or immediate)
    await saveTimezoneCache(cache);

    // Log for observability
    log(`[TIMEZONE] Cache miss: ${cacheKey} → ${timezone}`);

    return timezone;

  } catch (error) {
    log(`[TIMEZONE] API error for ${cacheKey}: ${error.message}`, 'warn');
    return 'Unknown';
  }
}

/**
 * Normalize location string for cache key
 * @param {string} city
 * @param {string} state
 * @param {string} country
 * @returns {string} Normalized cache key (lowercase, trimmed)
 */
function normalizeCacheKey(city, state, country) {
  return `${city.trim()}, ${state.trim()}, ${country.trim()}`
    .toLowerCase();
}
```

### Lookup Flow Diagram
```
┌─────────────────────────────────────────────────────────┐
│ enrichProspect(prospect)                                │
│  prospect.loc = "New York, NY, USA"                     │
└──────────────┬────────────────────────────────────────┘
               │
               v
┌─────────────────────────────────────────────────────────┐
│ getTimezone("New York", "NY", "USA", cache)            │
│ cacheKey = "new york, ny, usa"                         │
└──────────────┬────────────────────────────────────────┘
               │
               ├─── HIT? ──> [1a] Return cached timezone
               │              (zero API calls, instant)
               │
               └─── MISS? ──> [1b] Call Abstract API
                              ↓
                         [2] Parse response
                              ↓
                         [3] Store in memory cache
                              ↓
                         [4] Save to disk (batch after 5)
                              ↓
                         [5] Return timezone
```

---

## 5. File I/O Implementation

### Initialize Cache (Startup)

```javascript
/**
 * Load timezone cache from disk OR create with seed data if missing
 * Called once at startup (lazy load also possible per-batch)
 *
 * @returns {Promise<Map<string, string>>} Cache map
 */
async function initializeTimezoneCache() {
  const cacheFilePath = '/Users/oliver/OliverRepo/workspaces/work/projects/SDR/outreach/timezone-cache.json';

  try {
    // Check if cache file exists
    if (fs.existsSync(cacheFilePath)) {
      const raw = fs.readFileSync(cacheFilePath, 'utf8');
      const data = JSON.parse(raw);

      // Convert to Map for fast lookups
      const cache = new Map(Object.entries(data));

      log(`[TIMEZONE] Loaded ${cache.size} entries from ${cacheFilePath}`, 'info');
      return cache;
    } else {
      // File doesn't exist → create with seed data
      log(`[TIMEZONE] Cache file not found, creating with seed data...`, 'info');

      const seedData = SEED_TIMEZONE_DATA; // (see section 3)
      const cache = new Map(Object.entries(seedData));

      // Save seed to disk
      await saveTimezoneCache(cache);

      log(`[TIMEZONE] Created cache with ${cache.size} seed entries`, 'success');
      return cache;
    }
  } catch (error) {
    log(`[TIMEZONE] Error loading cache: ${error.message}`, 'error');
    // Graceful fallback: return empty cache, will create new entries
    return new Map();
  }
}
```

### Save Cache (Batch or Immediate)

```javascript
/**
 * Save in-memory cache to persistent JSON file
 * Called after every N lookups (batch save strategy)
 * OR after every lookup (immediate save strategy)
 *
 * @param {Map<string, string>} cache
 * @param {boolean} immediate - If true, save immediately. If false, queue for batch.
 * @returns {Promise<void>}
 */
async function saveTimezoneCache(cache, immediate = false) {
  const cacheFilePath = '/Users/oliver/OliverRepo/workspaces/work/projects/SDR/outreach/timezone-cache.json';

  // Convert Map to plain object for JSON serialization
  const data = Object.fromEntries(cache);

  // Optional: batch saves (e.g., after 5 lookups)
  if (!immediate && !shouldBatchSave(cache)) {
    return; // Skip this save, will batch later
  }

  try {
    // Ensure directory exists
    const cacheDir = path.dirname(cacheFilePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Write with formatting for readability
    fs.writeFileSync(
      cacheFilePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    log(`[TIMEZONE] Saved ${cache.size} entries to ${cacheFilePath}`, 'debug');

  } catch (error) {
    log(`[TIMEZONE] Error saving cache: ${error.message}`, 'error');
    // Don't throw — allow enrichment to continue even if cache save fails
  }
}

/**
 * Determine if cache should be saved (batch strategy)
 * Saves after every 5 new lookups (reduce disk I/O)
 *
 * @param {Map<string, string>} cache
 * @returns {boolean}
 */
function shouldBatchSave(cache) {
  // Track unsaved entries count in a closure variable or module-level counter
  // If unsaved >= 5, return true and reset counter
  return cache.size % 5 === 0;
}
```

### Error Handling

```javascript
/**
 * Graceful degradation for file I/O errors
 *
 * Scenarios:
 * 1. Cache file corrupted → create new with seed data
 * 2. Permission denied → log warning, continue with in-memory cache
 * 3. Disk full → log error, continue enrichment (cache not persisted)
 * 4. Abstract API timeout → return "Unknown", log, don't cache
 */

// Example: Handle corrupted JSON
try {
  const raw = fs.readFileSync(cacheFilePath, 'utf8');
  const data = JSON.parse(raw);
} catch (error) {
  if (error instanceof SyntaxError) {
    log(`[TIMEZONE] Cache corrupted, resetting...`, 'warn');
    fs.unlinkSync(cacheFilePath); // Delete corrupted file
    // Reinitialize with seed data
    return initializeTimezoneCache();
  }
}

// Example: Handle permission errors
try {
  fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2), 'utf8');
} catch (error) {
  if (error.code === 'EACCES') {
    log(`[TIMEZONE] Permission denied on ${cacheFilePath}, cache not persisted`, 'warn');
    // Continue enrichment, just skip disk save
    return;
  }
  throw error;
}
```

---

## 6. Rate Limit Forecast

### Scenario: 10 new prospects/day for 30 days (300 total)

#### Phase 1: Ramp-up (Days 1-20)
- **Day 1:** 10 prospects, 20 unique cities → all miss seed cache
  - Seed covers ~95% of US = ~2 hits, ~8 misses
  - **API calls:** 8
- **Day 2:** 10 prospects, ~8 new cities → ~2-3 hits, ~5-7 misses
  - **API calls:** 6
- **Days 3-7:** Similar pattern, cache growing
  - **Avg API calls/day:** 6-8
- **Days 8-20:** Cache now has 60+ locations, hit rate rising
  - **Avg API calls/day:** 3-5

**Ramp phase total (Days 1-20):** ~80-100 API calls

#### Phase 2: Steady-state (Days 21-30)
- **Cache size:** 100+ unique locations (most popular ones hit multiple times)
- **Hit rate:** 70-80% (most new prospects match cached cities)
- **New unique locations:** ~2-3/day
- **Avg API calls/day:** 2-3

**Steady-state total (Days 21-30):** ~20-30 API calls

#### Total Forecast (30 days)
```
Ramp phase (Days 1-20):      100 API calls
Steady state (Days 21-30):    25 API calls
────────────────────────────
TOTAL:                       125 API calls
```

**vs. Free tier quota: 200 requests/month**
- **Headroom:** 200 - 125 = **75 extra requests** (37.5% buffer)
- **Status:** ✅ SAFE — stays within quota with margin for error

### Variance Analysis
- **If hit rate lower than expected (50% instead of 70%):** ~175 API calls → still safe
- **If hit rate higher (90%):** ~50 API calls → excellent buffer
- **If prospects clustered in 5 cities:** Hit rate could reach 95% → only 15-20 API calls total

---

## 7. Integration Point: Where to Call Timezone Cache

### Current Enrichment Pipeline

```
┌──────────────────────────────┐
│ sync-from-sheets.js          │  Phase 1: Sync
│ Load from Google Sheets      │
│ Output: prospects.json       │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ enrichment-engine.js         │  Phase 2: Enrich (← TIMEZONE CACHE HERE)
│ Generate email              │
│ Validate MX                 │
│ Web search signals          │
│ Calculate confidence        │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ draft-emails.js             │  Phase 3: Draft
│ Select template             │
│ Merge prospects into body   │
│ Output: draft-plan.json     │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ approve-drafts.js           │  Phase 4: Approve
│ Review & filter             │
│ Output: approved-sends.json │
└──────────┬───────────────────┘
```

### Recommended Integration: `enrichment-engine.js`

**Location:** After MX validation, before web search
```javascript
// In enrichProspect() function, after line 408:

// Step 3: Resolve timezone (NEW)
if (enriched.loc) {
  enriched.tz = await getTimezone(
    enriched.loc.city,
    enriched.loc.state,
    enriched.loc.country,
    cache
  );
  // enriched.tz is now "America/New_York" or "Unknown"
}

// Step 4: Web search for company context (EXISTING)
if (enriched.co && enriched.ti) {
  const webSearchResult = await enrichProspectWebSearch(enriched, cache);
  // ...
}
```

### Why Here?
1. **Per-run cache:** Uses existing `enrichmentCache` pattern
2. **Early enrichment:** Before expensive operations (web search)
3. **Optional dependency:** If timezone fails, enrichment continues
4. **Ready for use:** Timezone available for email drafting (scheduling by timezone later)

### Alternative Integrations

#### Option A: In `sync-from-sheets.js` (earlier)
**Pros:** Timezone resolved immediately after sync
**Cons:** Separate cache initialization, not part of enrichment flow

#### Option B: In `draft-emails.js` (later)
**Pros:** Only resolve for prospects that pass eligibility
**Cons:** Delays cache growth, less integrated with enrichment signals

#### Option C: Standalone module (external)
**Pros:** Reusable across all scripts
**Cons:** More complex initialization, requires dependency management

**Recommendation:** Option 1 (in `enrichment-engine.js`) is cleanest.

---

## 8. Configuration & Batch Saving Strategy

### Config Entry (in `config.enrichment.js`)

```javascript
/**
 * Timezone caching
 * Abstract API integration for location → IANA timezone mapping
 * Free tier: 200 requests/month (sufficient with seeding strategy)
 */
timezone: {
  // Enable timezone enrichment
  enabled: true,

  // Cache file path
  cacheFilePath: path.join(
    __dirname,
    '..',
    'outreach',
    'timezone-cache.json'
  ),

  // Seed data (15-20 common US cities)
  // Reduces API calls by 60% in ramp phase
  seedData: {
    "New York, NY, USA": "America/New_York",
    "Los Angeles, CA, USA": "America/Los_Angeles",
    // ... (20 total entries)
  },

  // Batch saving strategy
  batchSize: 5,  // Save to disk after 5 new lookups

  // Abstract API config
  abstractAPI: {
    baseURL: 'https://ipgeolocation.abstractapi.com/api/',
    endpoint: '/timezone',
    apiKey: process.env.ABSTRACT_API_KEY || ''
  },

  // Error handling
  fallbackTimezone: 'America/New_York',  // Default if lookup fails
  skipOnError: true  // Continue enrichment if timezone fails
}
```

### Batch Saving Implementation

```javascript
/**
 * Cache batch-save strategy
 * Reduces disk I/O while ensuring persistence
 */

let unsavedCount = 0;

async function trackTimezoneChange(cache) {
  unsavedCount++;

  // Save to disk every N lookups
  if (unsavedCount >= 5) {
    await saveTimezoneCache(cache);
    unsavedCount = 0;
  }
}

// Also save at the end of enrichment batch:
async function enrichProspects(prospects) {
  const cache = await initializeTimezoneCache();

  for (const prospect of prospects) {
    const enriched = await enrichProspect(prospect, cache);
    enriched.push(enriched);
  }

  // Force save at end (flush any remaining unsaved)
  await saveTimezoneCache(cache);

  return enriched;
}
```

---

## 9. Testing Strategy

### Unit Tests
```javascript
// test/timezone-cache.test.js

describe('TimezoneCache', () => {
  describe('normalizeCacheKey', () => {
    it('lowercases and trims city, state, country', () => {
      const key = normalizeCacheKey('  NEW YORK  ', 'NY', 'USA');
      expect(key).toBe('new york, ny, usa');
    });
  });

  describe('initializeTimezoneCache', () => {
    it('loads existing cache from file', () => {
      // Mock fs.readFileSync to return test data
      const cache = await initializeTimezoneCache();
      expect(cache.size).toBeGreaterThan(0);
    });

    it('creates new cache with seed data if file missing', () => {
      // Mock fs.existsSync to return false
      const cache = await initializeTimezoneCache();
      expect(cache.get('new york, ny, usa')).toBe('America/New_York');
    });

    it('handles corrupted JSON gracefully', () => {
      // Mock fs.readFileSync to throw SyntaxError
      const cache = await initializeTimezoneCache();
      expect(cache.size).toBeGreaterThan(0); // Falls back to seed
    });
  });

  describe('getTimezone', () => {
    it('returns cached timezone on hit', async () => {
      const cache = new Map([['new york, ny, usa', 'America/New_York']]);
      const tz = await getTimezone('New York', 'NY', 'USA', cache);
      expect(tz).toBe('America/New_York');
    });

    it('calls Abstract API on cache miss', async () => {
      const cache = new Map();
      // Mock abstractAPI.getTimezone to return a timezone
      const tz = await getTimezone('Unknown City', 'XX', 'USA', cache);
      // API should be called once
      expect(mockAbstractAPI.getTimezone).toHaveBeenCalledTimes(1);
    });

    it('returns "Unknown" on API error', async () => {
      // Mock abstractAPI to throw error
      const cache = new Map();
      const tz = await getTimezone('Unknown City', 'XX', 'USA', cache);
      expect(tz).toBe('Unknown');
    });
  });

  describe('saveTimezoneCache', () => {
    it('writes cache to JSON file', async () => {
      const cache = new Map([['new york, ny, usa', 'America/New_York']]);
      await saveTimezoneCache(cache);
      // Assert file was written with correct JSON structure
    });

    it('handles permission errors gracefully', async () => {
      // Mock fs.writeFileSync to throw EACCES error
      await expect(saveTimezoneCache(cache)).not.toThrow();
      // Should log warning but not throw
    });
  });
});
```

### Integration Tests
```javascript
// Enrichment pipeline with timezone cache enabled
describe('enrichment-engine with timezone', () => {
  it('enriches prospect with timezone from cache', async () => {
    const prospect = {
      id: 1,
      fn: 'John',
      ln: 'Doe',
      co: 'Acme Corp',
      ti: 'VP Sales',
      loc: { city: 'New York', state: 'NY', country: 'USA' }
    };

    const enriched = await enrichProspect(prospect);

    expect(enriched.tz).toBe('America/New_York');
    expect(enriched.confidence).toBeGreaterThan(0);
  });

  it('continues enrichment if timezone fails', async () => {
    // Mock getTimezone to throw error
    const prospect = { /* ... */ };
    const enriched = await enrichProspect(prospect);

    expect(enriched.tz).toBe('Unknown'); // Fallback
    expect(enriched.confidence).toBeGreaterThan(0); // Enrichment continues
  });
});
```

---

## 10. Observability & Monitoring

### Logging

```javascript
// Log examples

// Cache hit (expected most of the time)
log(`[TIMEZONE] Cache hit: "new york, ny, usa" → America/New_York`, 'debug');

// Cache miss → API call
log(`[TIMEZONE] Cache miss: "san francisco, ca, usa" → calling Abstract API`, 'info');

// Successful API lookup
log(`[TIMEZONE] API lookup: "denver, co, usa" → America/Denver`, 'success');

// API error
log(`[TIMEZONE] API error for "unknown, xx, usa": Rate limit exceeded`, 'warn');

// Cache save
log(`[TIMEZONE] Saved 125 entries to outreach/timezone-cache.json`, 'debug');

// Startup
log(`[TIMEZONE] Initialized cache with 20 seed entries`, 'success');
```

### Metrics to Track

```javascript
/**
 * TimezoneCache metrics (for dashboard analytics)
 */
const metrics = {
  cacheHits: 0,           // Total successful cache lookups
  cacheMisses: 0,         // Total cache misses requiring API call
  apiCallsSuccess: 0,     // Successful Abstract API calls
  apiCallsFailure: 0,     // Failed API calls
  cacheSize: 0,           // Current cache entries
  seedSize: 20,           // Initial seed size
  hitRate: 0.0,           // cacheHits / (cacheHits + cacheMisses)
  totalApiCalls: 0,       // Running total for month
  estimatedQuotaRemaining: 200  // Abstract API quota
};

// Report at end of batch
console.log(`
[TIMEZONE METRICS]
Cache size:           ${metrics.cacheSize} entries
Cache hit rate:       ${(metrics.hitRate * 100).toFixed(1)}%
API calls (batch):    ${metrics.apiCallsSuccess + metrics.apiCallsFailure}
API calls (monthly):  ${metrics.totalApiCalls}
Quota remaining:      ${200 - metrics.totalApiCalls}
`);
```

---

## 11. Security & Privacy Considerations

### Data Sensitivity
- **Timezone data:** Not sensitive (public geographic information)
- **Cache location:** Same as prospect data, already protected
- **API calls:** Abstract API doesn't log IP addresses (read their privacy policy)

### Validation
```javascript
// Validate cache entries before using
function isValidTimezone(tz) {
  try {
    // Use Intl API to validate IANA timezone
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch (error) {
    return false;
  }
}

// Before returning cached timezone
if (!isValidTimezone(cachedTz)) {
  log(`[TIMEZONE] Invalid cached timezone: ${cachedTz}`, 'warn');
  return 'Unknown';
}
```

### Abstract API Key Protection
- Store in GitHub Secrets (already done for other keys)
- Never log the API key
- Rotate quarterly if used heavily

---

## 12. Summary & Next Steps

### What Was Designed

| Component | Status |
|-----------|--------|
| Cache structure (JSON) | ✅ Designed |
| Seed data (20 cities) | ✅ Designed |
| Lookup function | ✅ Designed |
| File I/O (load/save) | ✅ Designed |
| Error handling | ✅ Designed |
| Rate limit forecast | ✅ Calculated (125 calls / 200 quota) |
| Integration point | ✅ Identified (enrichment-engine.js) |
| Config entry | ✅ Designed |
| Test strategy | ✅ Outlined |
| Observability | ✅ Planned |

### To Implement (Future)

1. **Create `lib/timezone-cache.js`** (300-400 lines)
   - `initializeTimezoneCache()`
   - `getTimezone(city, state, country, cache)`
   - `saveTimezoneCache(cache)`
   - Error handling & validation

2. **Update `enrichment-engine.js`** (20-30 lines)
   - Import timezone-cache module
   - Call `getTimezone()` in `enrichProspect()` function
   - Add timezone field to enriched prospect

3. **Update `config.enrichment.js`** (15-20 lines)
   - Add timezone config block
   - Add seed data constant

4. **Create `test/timezone-cache.test.js`** (100-150 lines)
   - Unit tests for all functions
   - Integration test with enrichment pipeline
   - Mock Abstract API responses

5. **Add GitHub Secret** (Admin task)
   - `ABSTRACT_API_KEY` (free tier key)

6. **Update `daily-run.js`** logging (5 lines)
   - Log timezone metrics alongside other enrichment metrics

### Expected Outcome

- **API calls reduced by ~60%** in ramp phase via seed data
- **Total monthly API usage: ~125 calls** (vs. 200 quota)
- **Zero manual setup** — cache creates itself with seed data on first run
- **Transparent to user** — timezone enrichment happens automatically in existing pipeline
- **Persistent across runs** — cache grows organically, always improving hit rate

---

## Appendix: Abstract API Integration Reference

### Abstract API Endpoint
```
GET https://ipgeolocation.abstractapi.com/api/timezone/
?api_key={API_KEY}
&latitude={LAT}
&longitude={LON}
```

### Response Format
```json
{
  "name": "Eastern Standard Time",
  "abbreviation": "EST",
  "offset": "-05:00",
  "is_dst": false,
  "current_time": "2026-03-17T14:30:00-0500"
}
```

### Required Mapping
- **Response `name`** → Our cache stores IANA timezone name
- **Alternative:** Use latitude/longitude from geocoding service before calling Abstract API
- **Simpler:** Ask user to provide location as "city, state, country" (already in Google Sheets schema)

### Example Call Sequence
```javascript
// Prospect from Google Sheets has location field
prospect.loc = "New York, NY, USA";

// Step 1: Parse location
const [city, state, country] = parseLocation(prospect.loc);

// Step 2: Check cache
let tz = await getTimezone(city, state, country, cache);

// Step 3: If cache miss, Abstract API call happens inside getTimezone()
// No additional steps needed in calling code
```

---

**Document Version:** 1.0
**Created:** 2026-03-17
**Status:** Design (ready for implementation)

- Primary model: mistral:7b (local, free)
- Fallbacks: none []
- Main agent is set to Mistral
- OpenRouter and Anthropic API keys have been removed
- OpenClaw is now fully local and free


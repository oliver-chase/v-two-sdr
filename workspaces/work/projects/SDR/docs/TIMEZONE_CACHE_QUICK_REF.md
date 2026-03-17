# Timezone Cache: Quick Reference

## Files & Line Count

| Document | Lines | Purpose |
|----------|-------|---------|
| TIMEZONE_CACHE_DESIGN.md | 650+ | Complete design spec (sections 1-12) |
| TIMEZONE_CACHE_SUMMARY.md | 180+ | Executive summary (1-page view) |
| ABSTRACT_API_INTEGRATION.md | 350+ | API integration details |
| TIMEZONE_CACHE_QUICK_REF.md | This file | Developer cheat sheet |

---

## TL;DR: 30-Second Overview

**Problem:** Need 300 timezone lookups/month, have 200 requests/month quota.

**Solution:** Pre-seed JSON cache with 20 common US cities + persist new lookups.

**Result:** ~125 API calls over 30 days (within quota with buffer).

---

## Cache Structure

```json
{
  "New York, NY, USA": "America/New_York",
  "Los Angeles, CA, USA": "America/Los_Angeles",
  // ... 20 seed entries
}
```

**File:** `outreach/timezone-cache.json`
**Key format:** `"{City}, {State}, {Country}"` (case-insensitive)
**Value format:** IANA timezone ID (e.g., `"America/Chicago"`)

---

## Seed Data (Top 20 US Cities)

By time zone:
- **Eastern (5):** New York, Philadelphia, Jacksonville, Columbus, Boston
- **Central (7):** Chicago, Houston, San Antonio, Dallas, Austin, Fort Worth
- **Mountain (2):** Denver, Phoenix (no DST)
- **Pacific (5):** Los Angeles, San Diego, San Jose, San Francisco, Seattle
- **Special (1):** Indianapolis (Eastern but Indiana-specific)

---

## Implementation Locations

### Create These Files
1. `lib/timezone-cache.js` (300-400 lines)
   - `initializeTimezoneCache()` — load or create cache
   - `getTimezone(city, state, country, cache)` — main function
   - `saveTimezoneCache(cache)` — persist to disk

2. `test/timezone-cache.test.js` (100-150 lines)
   - Unit tests for all 3 functions
   - Integration test with enrichment pipeline

### Update These Files
1. `config.enrichment.js` (~15 lines)
   - Add `timezone: { enabled, cacheFilePath, seedData, ... }`

2. `enrichment-engine.js` (~20 lines)
   - Import timezone-cache module
   - Call `getTimezone()` in `enrichProspect()` after MX validation
   - Add `enriched.tz = await getTimezone(...)`

3. `daily-run.js` (~5 lines)
   - Log timezone metrics (cache hits/misses)

### Add Secrets (Admin Task)
- `ABSTRACT_API_KEY` (free tier from Abstract API)

---

## Core Function Signature

```javascript
/**
 * @param {string} city - "New York"
 * @param {string} state - "NY"
 * @param {string} country - "USA"
 * @param {Map} cache - Shared enrichment cache
 * @returns {Promise<string>} "America/New_York" or "Unknown"
 */
async function getTimezone(city, state, country, cache) {
  // 1. Normalize key & check cache
  // 2. If miss → call Abstract API
  // 3. Convert Windows → IANA
  // 4. Store in cache + disk
  // 5. Return IANA timezone
}
```

---

## Rate Limit Forecast

| Phase | Days | Expected Calls | Hit Rate |
|-------|------|---|----------|
| Ramp-up | 1-20 | ~100 | 50-60% |
| Steady | 21-30 | ~25 | 70-90% |
| **Total** | 30 | **~125** | **65%** |

**Safe:** 125 < 200 quota ✅

---

## Batch Save Strategy

```
New prospect enriched
   ↓
timezone lookup (API call if miss)
   ↓
unsavedCount++
   ↓
if (unsavedCount >= 5) → save to disk
                      → reset counter
```

**Goal:** Balance disk I/O (expensive) with persistence.

---

## Error Handling Checklist

- [ ] File not found → Create with seed data
- [ ] Corrupted JSON → Reset and recreate
- [ ] API timeout (abstract) → Return "Unknown", don't cache
- [ ] API timeout (geocoding) → Return "Unknown", don't cache
- [ ] Rate limit (429) → Return "Unknown", fall back to default
- [ ] Permission denied → Log warning, skip disk save (in-memory OK)
- [ ] Invalid timezone → Validate with Intl.DateTimeFormat, reject

---

## Testing Quick Reference

### Test Case 1: Cache Hit
```javascript
test('returns cached value without API call', async () => {
  const cache = new Map([['new york, ny, usa', 'America/New_York']]);
  const tz = await getTimezone('New York', 'NY', 'USA', cache);
  expect(tz).toBe('America/New_York');
  expect(mockAPI.calls).toBe(0);
});
```

### Test Case 2: Cache Miss + API
```javascript
test('calls API on cache miss', async () => {
  const cache = new Map();
  mockAPI.getTimezone.mockResolvedValue({
    name: 'Eastern Standard Time',
    abbreviation: 'EST'
  });
  const tz = await getTimezone('Boston', 'MA', 'USA', cache);
  expect(tz).toBe('America/New_York');
  expect(mockAPI.calls).toBe(1);
});
```

### Test Case 3: API Error
```javascript
test('returns fallback on API error', async () => {
  const cache = new Map();
  mockAPI.getTimezone.mockRejectedValue(new Error('Timeout'));
  const tz = await getTimezone('Unknown', 'XX', 'USA', cache);
  expect(tz).toBe('Unknown');
});
```

---

## Abstract API Notes

### Key Details
- **Endpoint:** `GET https://ipgeolocation.abstractapi.com/api/timezone/`
- **Params:** `api_key`, `latitude`, `longitude`
- **Response:** Returns **Windows timezone names** (must convert to IANA)

### Windows → IANA Conversion
```javascript
const WINDOWS_TO_IANA = {
  'Eastern Standard Time': 'America/New_York',
  'Central Standard Time': 'America/Chicago',
  'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles',
  // ... 100+ entries
};
```

### Rate Limits
- **Free tier:** 200 requests/month
- **Per minute:** 20 requests
- **Per second:** ~0.4 requests (handle with queue if needed)

---

## Integration Point in Enrichment Pipeline

```
sync-from-sheets.js (load prospects)
        ↓
enrichment-engine.js (← ADD TIMEZONE HERE)
  ├─ Email generation
  ├─ MX validation
  ├─ Timezone lookup ← NEW STEP 3
  ├─ Web search
  └─ Confidence scoring
        ↓
draft-emails.js (template selection)
        ↓
approve-drafts.js (review)
        ↓
send-approved.js (deliver)
```

---

## Logging Examples

```javascript
// Startup
log('[TIMEZONE] Initialized cache with 20 seed entries', 'success');

// Cache hit
log('[TIMEZONE] Cache hit: "new york, ny, usa"', 'debug');

// Cache miss → API call
log('[TIMEZONE] Cache miss: "denver, co, usa" → calling Abstract API', 'info');

// Success
log('[TIMEZONE] API lookup: "denver, co, usa" → America/Denver', 'success');

// Error
log('[TIMEZONE] API error for "unknown, xx, usa": Request timeout', 'warn');

// Batch metrics
log('[TIMEZONE METRICS] Cache size: 125, Hit rate: 85.3%, API calls: 3', 'info');
```

---

## Config Entry Template

```javascript
// In config.enrichment.js
timezone: {
  enabled: true,
  cacheFilePath: path.join(__dirname, '..', 'outreach', 'timezone-cache.json'),

  // Batch strategy: save to disk every N new lookups
  batchSize: 5,

  // Seed data (20 most common US cities)
  seedData: {
    "New York, NY, USA": "America/New_York",
    "Los Angeles, CA, USA": "America/Los_Angeles",
    // ... 18 more entries
  },

  // Abstract API config
  abstractAPI: {
    baseURL: 'https://ipgeolocation.abstractapi.com/api/',
    endpoint: '/timezone',
    apiKey: process.env.ABSTRACT_API_KEY || ''
  },

  // Error handling
  fallbackTimezone: 'America/New_York',
  skipOnError: true  // Continue enrichment if timezone fails
}
```

---

## Decision Matrix: Lookup Strategy

| Scenario | Approach | Cost | Latency |
|----------|----------|------|---------|
| Seed city (e.g., New York) | Map lookup | Free | <1ms |
| New city → geocode + abstract | Two-step API | Free | 200-650ms |
| Rate limit hit (429) | Fallback "Unknown" | Free | <10ms |
| API timeout | Fallback "Unknown" | Free | <10ms |

**Recommendation:** Hybrid approach (seed + API fallback).

---

## Metrics to Report (End of Batch)

```
[TIMEZONE METRICS]
─────────────────────────────────────
Cache size:           125 entries
Seed size:            20 entries
Hit rate:             85.3% (hits / total lookups)
Cache hits:           120
Cache misses:         20
API calls (success):  18
API calls (failures): 2
API calls (this run): 20
API calls (monthly):  67 / 200
Quota remaining:      133 requests
Last saved:           2026-03-17 10:05:30 UTC
─────────────────────────────────────
```

---

## Troubleshooting

### Issue: Cache file keeps resetting
**Cause:** Corrupted JSON, file not writable, or permission denied
**Fix:** Check file permissions: `chmod 644 outreach/timezone-cache.json`

### Issue: High API usage (>20/day)
**Cause:** Seed data not loaded, or geocoding location names differently
**Fix:** Verify cache initialization, check location string normalization

### Issue: Timezone field always "Unknown"
**Cause:** Abstract API key not set, or no geocoding service
**Fix:** Check ABSTRACT_API_KEY env var, ensure Google Geocoding API key available

### Issue: Cache not persisting between runs
**Cause:** Batch size too large, or save not called at end of batch
**Fix:** Force save in `enrichProspects()` after loop: `await saveTimezoneCache(cache)`

---

## Quick Checklist for Implementation

### Phase 1: Setup (1 hour)
- [ ] Create `lib/timezone-cache.js` with 3 main functions
- [ ] Add config entry to `config.enrichment.js`
- [ ] Generate Windows→IANA lookup table

### Phase 2: Integration (1 hour)
- [ ] Import timezone-cache in `enrichment-engine.js`
- [ ] Call `getTimezone()` in `enrichProspect()` after MX validation
- [ ] Add timezone field to enriched prospect output
- [ ] Update `daily-run.js` logging

### Phase 3: Testing (2 hours)
- [ ] Unit tests for cache functions
- [ ] Integration test with enrichment pipeline
- [ ] Manual test with sample prospects
- [ ] Rate limit behavior test (429 handling)

### Phase 4: Deploy (30 min)
- [ ] Add `ABSTRACT_API_KEY` to GitHub Secrets
- [ ] Test daily-sdr.yml with real Google Sheets sync
- [ ] Monitor API usage in Abstract API dashboard
- [ ] Log metrics from first 3 days

**Total effort:** 4.5 hours (dev + testing)

---

## Files Reference

| Purpose | File | Creator |
|---------|------|---------|
| Full design | `TIMEZONE_CACHE_DESIGN.md` | This session |
| Summary | `TIMEZONE_CACHE_SUMMARY.md` | This session |
| API guide | `ABSTRACT_API_INTEGRATION.md` | This session |
| Quick ref | This file | This session |

---

**Status:** Design Complete ✅
**Ready for:** Implementation phase
**Estimated time:** 4-6 hours (with testing)


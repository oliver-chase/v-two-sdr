# Abstract API Integration Guide

## Service Overview

**Service:** Abstract API - Timezone Lookup
**Purpose:** Convert latitude/longitude to IANA timezone
**Pricing:** Free tier 200 requests/month
**Reliability:** 99.9% uptime SLA

---

## Endpoint Details

### Timezone Lookup Endpoint

```
GET https://ipgeolocation.abstractapi.com/api/timezone/
```

### Request Parameters

| Parameter | Type | Required | Example | Notes |
|-----------|------|----------|---------|-------|
| `api_key` | string | ✓ | (from GitHub Secret) | Free tier key |
| `latitude` | float | ✓ | `40.7128` | Decimal degrees, -90 to 90 |
| `longitude` | float | ✓ | `-74.0060` | Decimal degrees, -180 to 180 |
| `fields` | string | ✗ | `timezone_name,offset` | Comma-separated; default: all |

### Response Format (JSON)

```json
{
  "name": "Eastern Standard Time",
  "abbreviation": "EST",
  "current_time": "2026-03-17 14:30:00",
  "is_dst": false,
  "offset": "-05:00"
}
```

### Response Fields

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `name` | string | `"Eastern Standard Time"` | Windows timezone name (NOT IANA) |
| `abbreviation` | string | `"EST"` | Timezone abbreviation |
| `current_time` | string | `"2026-03-17 14:30:00"` | Server time in that zone |
| `is_dst` | boolean | `false` | Is Daylight Saving Time active? |
| `offset` | string | `"-05:00"` | UTC offset (e.g., -05:00 for EST) |

**⚠️ Important:** Abstract API returns Windows timezone names, NOT IANA identifiers. Conversion required.

---

## Mapping: Windows → IANA Timezone

### Conversion Lookup Table

| Windows Name | IANA Identifier | UTC Offset |
|--------------|-----------------|-----------|
| Eastern Standard Time | America/New_York | -5 |
| Central Standard Time | America/Chicago | -6 |
| Mountain Standard Time | America/Denver | -7 |
| Mountain Standard Time (Arizona) | America/Phoenix | -7 (no DST) |
| Pacific Standard Time | America/Los_Angeles | -8 |
| GMT Standard Time | Europe/London | 0 |
| Central European Standard Time | Europe/Berlin | +1 |
| China Standard Time | Asia/Shanghai | +8 |

**Solution:** Create reverse lookup table during initialization:

```javascript
const WINDOWS_TO_IANA = {
  'Eastern Standard Time': 'America/New_York',
  'Central Standard Time': 'America/Chicago',
  'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles',
  'GMT Standard Time': 'Europe/London',
  // ... full mapping (100+ entries)
};

function windowsToIANA(windowsName) {
  return WINDOWS_TO_IANA[windowsName] || null;
}
```

---

## Implementation Approach

### Problem: We Need IANA, Abstract Returns Windows Names

**Challenge:** Abstract API doesn't directly return IANA timezones. We need to convert.

**Solution Options:**

#### Option A: Full Geocoding + Abstract API (Recommended)
```
User input: "New York, NY, USA"
     ↓
1. Geocode city name → latitude/longitude (Google Geocoding API)
2. Call Abstract API with lat/lon → get Windows timezone name
3. Convert Windows name → IANA identifier
4. Store IANA in cache
```

**Pros:** Most accurate, handles edge cases
**Cons:** Requires second API (Geocoding), adds latency

#### Option B: Offset-Based IANA Inference
```
User input: "New York, NY, USA"
     ↓
1. Call Abstract API → get offset ("-05:00")
2. Map offset → IANA (with state/city hints)
3. Store IANA in cache
```

**Pros:** Single API call, fast
**Cons:** Offset alone is ambiguous (multiple IANA zones per offset)

#### Option C: Hardcoded City → IANA Mapping (Simplest)
```
User input: "New York, NY, USA"
     ↓
1. Lookup in hardcoded map (create from Common US cities)
2. Only call Abstract API for cities NOT in map
3. Store IANA in cache
```

**Pros:** Fastest, most reliable, minimal API calls
**Cons:** Limited to pre-defined cities

### Recommendation: **Option C (Hybrid)**

Use hardcoded mapping for known cities (seed data), fall back to Option A (geocoding) for new cities.

```javascript
async function getTimezone(city, state, country, cache) {
  const key = `${city}, ${state}, ${country}`.toLowerCase();

  // 1. Check cache
  if (cache.has(key)) return cache.get(key);

  // 2. Check hardcoded seed
  if (SEED_TIMEZONE_DATA[key]) {
    return SEED_TIMEZONE_DATA[key];
  }

  // 3. New city → geocode + Abstract API
  try {
    const [lat, lon] = await geocodeCity(city, state, country);
    const response = await abstractAPI.getTimezone(lat, lon);
    const iana = windowsToIANA(response.name);

    cache.set(key, iana);
    await saveCache(cache);

    return iana;
  } catch (error) {
    log(`Failed to resolve timezone for ${key}: ${error.message}`);
    return 'Unknown';
  }
}
```

---

## Geocoding Service (Option A Dependency)

If using Option A, you need a geocoding API. Options:

### Google Geocoding API
```
GET https://maps.googleapis.com/maps/api/geocode/json
?address=New York, NY, USA
&key={GOOGLE_API_KEY}
```

**Free tier:** 25,000 requests/month (sufficient)
**Cost:** Free for first 25k, then $0.005/request
**Already available:** You have GOOGLE_API_KEY for Sheets

### Nominatim (OpenStreetMap)
```
GET https://nominatim.openstreetmap.org/search
?q=New York, NY, USA
&format=json
```

**Free tier:** Unlimited (with rate limits)
**Cost:** Free
**Rate limit:** ~1 request/second

### Recommendation: **Use Google Geocoding** (already have the API key)

---

## Abstract API Rate Limiting

### Free Tier Limits

| Limit | Value |
|-------|-------|
| **Requests/month** | 200 |
| **Requests/minute** | 20 |
| **Requests/second** | ~0.4 |

### Handling Rate Limits

#### When Limit Reached
```
HTTP 429 Too Many Requests

{
  "error": {
    "message": "Too many requests in a short time",
    "type": "rate_limit_exceeded"
  }
}
```

#### Strategy
1. Catch 429 errors
2. Log warning
3. Return "Unknown" (don't retry immediately)
4. Continue enrichment
5. Prioritize cache hits (seeding helps here)

```javascript
async function getTimezone(city, state, country, cache) {
  try {
    const response = await abstractAPI.getTimezone(lat, lon);
    // ...
  } catch (error) {
    if (error.response?.status === 429) {
      log(`Rate limit hit: ${city}. Using fallback timezone.`, 'warn');
      return 'America/New_York';  // Safe default
    }
    throw error;
  }
}
```

---

## API Call Sequence Example

### Happy Path: Cache Hit

```
Prospect: { loc: "New York, NY, USA" }
     ↓
getTimezone("New York", "NY", "USA", cache)
     ↓
Cache lookup: key = "new york, ny, usa"
     ↓
FOUND in cache: "America/New_York"
     ↓
Return instantly (no API call)
```

**API calls:** 0
**Latency:** <1ms

### Unhappy Path: Cache Miss + API Call

```
Prospect: { loc: "Boise, ID, USA" }
     ↓
getTimezone("Boise", "ID", "USA", cache)
     ↓
Cache lookup: not found
Seed lookup: not found
     ↓
Geocode "Boise, ID, USA" → {lat: 43.6150, lon: -116.2023}
     ↓
Call Abstract API:
  GET /api/timezone/?api_key=xxx&latitude=43.6150&longitude=-116.2023
     ↓
Response: { name: "Mountain Standard Time", abbreviation: "MST", offset: "-07:00" }
     ↓
Convert: "Mountain Standard Time" → "America/Boise"
     ↓
Store in cache: cache.set("boise, id, usa", "America/Boise")
     ↓
Save to disk: await saveCache(cache)
     ↓
Return "America/Boise"
```

**API calls:** 2 (1 geocoding + 1 timezone)
**Latency:** 200-500ms
**Result:** Future lookups of "Boise, ID, USA" are instant

---

## Error Handling Examples

### Scenario 1: Network Timeout
```javascript
try {
  const response = await abstractAPI.getTimezone(lat, lon);
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    log(`Abstract API timeout: ${city}`, 'warn');
    return 'Unknown';
  }
}
```

### Scenario 2: Invalid API Key
```javascript
const error = {
  status: 401,
  message: "Unauthorized: Invalid API key"
}

// Solution: Check env var on startup
if (!process.env.ABSTRACT_API_KEY) {
  throw new Error('ABSTRACT_API_KEY not set in environment');
}
```

### Scenario 3: No Results (Invalid Coordinates)
```javascript
// Geocoding returns no results for "Fake City, XX, USA"
try {
  const results = await geocode(...);
  if (results.length === 0) {
    return 'Unknown';
  }
} catch (error) {
  return 'Unknown';
}
```

---

## Testing with Mock Responses

### Unit Test: Cache Hit
```javascript
test('returns cached timezone without API call', async () => {
  const cache = new Map([['new york, ny, usa', 'America/New_York']]);
  const tz = await getTimezone('New York', 'NY', 'USA', cache);

  expect(tz).toBe('America/New_York');
  expect(abstractAPI.getTimezone).not.toHaveBeenCalled();
});
```

### Unit Test: API Call
```javascript
test('calls Abstract API on cache miss', async () => {
  const cache = new Map();

  // Mock response
  abstractAPI.getTimezone.mockResolvedValue({
    name: 'Eastern Standard Time',
    abbreviation: 'EST',
    offset: '-05:00'
  });

  const tz = await getTimezone('Boston', 'MA', 'USA', cache);

  expect(tz).toBe('America/New_York');
  expect(abstractAPI.getTimezone).toHaveBeenCalledTimes(1);
  expect(cache.get('boston, ma, usa')).toBe('America/New_York');
});
```

### Unit Test: Rate Limit Handling
```javascript
test('handles 429 rate limit gracefully', async () => {
  const cache = new Map();

  // Mock rate limit response
  const error = new Error('Rate limit exceeded');
  error.response = { status: 429 };
  abstractAPI.getTimezone.mockRejectedValue(error);

  const tz = await getTimezone('Unknown', 'XX', 'USA', cache);

  expect(tz).toBe('America/New_York');  // Fallback
  expect(cache.get('unknown, xx, usa')).toBeUndefined();  // Not cached
});
```

---

## Performance Considerations

### Latency Breakdown (in milliseconds)

| Operation | Latency | Notes |
|-----------|---------|-------|
| Cache lookup | <1ms | Map.get() |
| Seed lookup | <1ms | Object property access |
| Network (geocoding) | 100-300ms | Google Geocoding API |
| Network (timezone) | 100-300ms | Abstract API |
| JSON parsing | <5ms | Small response |
| File write | 10-50ms | Batch saves help |
| **Total (cache hit)** | <1ms | ✅ Fast |
| **Total (cache miss)** | 200-650ms | ✅ Acceptable |

### Optimization Tips

1. **Batch saves** (every 5 lookups) → Reduce file I/O by 5x
2. **Pre-seed** (20 cities) → 95% cache hit rate
3. **Parallel geocoding** → If needed, geocode all cities at once
4. **Cache in memory** → Don't reload file every time (already done)

---

## Pricing Estimate (30 days)

### Scenario 1: Seeding Strategy (Recommended)
```
Expected API calls:  125 (vs. 200 quota)
Abstract API cost:   Free (within quota)
Geocoding calls:     ~15 (unique new cities)
Geocoding cost:      Free (within 25k/month from GOOGLE_API_KEY)
Total cost:          $0
```

### Scenario 2: No Seeding (Naive)
```
Expected API calls:  300 (exceeds quota)
Abstract API cost:   $4 (100 overage @ $0.04/call... if paid tier)
Geocoding calls:     300
Geocoding cost:      Free (within 25k/month)
Total cost:          $4 + risk of API blocks
```

**Recommendation:** Use seeding strategy (Scenario 1).

---

## Setup Checklist

- [ ] Have `GOOGLE_API_KEY` in environment (for geocoding)
- [ ] Sign up for Abstract API free tier account
- [ ] Get free tier API key
- [ ] Add `ABSTRACT_API_KEY` to GitHub Secrets
- [ ] Create Windows→IANA lookup table (100+ entries)
- [ ] Implement geocoding wrapper (Google Geocoding API)
- [ ] Implement timezone conversion logic
- [ ] Test with sample cities
- [ ] Monitor API usage via Abstract API dashboard

---

## References

- [Abstract API Timezone Docs](https://www.abstractapi.com/api/timezone)
- [IANA Timezone Database](https://www.iana.org/time-zones)
- [List of IANA Timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [Windows to IANA Mapping](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#Windows_to_IANA_Mapping)

---

**Status:** Integration Guide Complete
**Reviewed:** 2026-03-17

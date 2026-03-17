#!/usr/bin/env node

/**
 * Timezone Cache Module
 *
 * Persistent caching system for timezone lookups:
 * - Load/save cache from outreach/timezone-cache.json
 * - Seed data: 20 common US cities with IANA timezones
 * - getTimezone(city, state, country): Check cache first, call Abstract API if missing
 * - Fallback to hardcoded US city data if Abstract API unavailable
 * - Error handling: Network errors, invalid responses, rate limits
 *
 * Integration: enrichment-engine.js calls getTimezone() after MX validation
 *
 * API: Abstract API (200 req/month free tier)
 * Endpoint: https://ipgeolocation.abstractapi.com/api/timezone/
 * Cost: 1 req per new location
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * SEED DATA: 20 common US cities with IANA timezones
 * Format: "City, State, Country" -> "IANA/Timezone"
 */
const SEED_TIMEZONES = {
  'New York, NY, USA': 'America/New_York',
  'Los Angeles, CA, USA': 'America/Los_Angeles',
  'Chicago, IL, USA': 'America/Chicago',
  'Houston, TX, USA': 'America/Chicago',
  'Phoenix, AZ, USA': 'America/Phoenix',
  'Philadelphia, PA, USA': 'America/New_York',
  'San Antonio, TX, USA': 'America/Chicago',
  'San Diego, CA, USA': 'America/Los_Angeles',
  'Dallas, TX, USA': 'America/Chicago',
  'San Jose, CA, USA': 'America/Los_Angeles',
  'Austin, TX, USA': 'America/Chicago',
  'Jacksonville, FL, USA': 'America/New_York',
  'Denver, CO, USA': 'America/Denver',
  'Seattle, WA, USA': 'America/Los_Angeles',
  'Boston, MA, USA': 'America/New_York',
  'Miami, FL, USA': 'America/New_York',
  'Atlanta, GA, USA': 'America/New_York',
  'Minneapolis, MN, USA': 'America/Chicago',
  'Portland, OR, USA': 'America/Los_Angeles',
  'Las Vegas, NV, USA': 'America/Los_Angeles'
};

const CACHE_FILE = path.join(__dirname, '..', 'outreach', 'timezone-cache.json');
const ABSTRACT_API_URL = 'https://ipgeolocation.abstractapi.com/api/timezone/';
const REQUEST_TIMEOUT = 5000; // 5 second timeout

let cache = null;
let apiCallCount = 0;
let apiRateLimitWarning = false;

/**
 * Load cache from disk or initialize with seed data
 *
 * @returns {Object} Timezone cache object
 */
function loadCache() {
  if (cache !== null) {
    return cache;
  }

  try {
    if (fs.existsSync(CACHE_FILE)) {
      const fileContent = fs.readFileSync(CACHE_FILE, 'utf-8');
      cache = JSON.parse(fileContent);
      return cache;
    }
  } catch (error) {
    console.warn(`[timezone-cache] Failed to load cache from disk: ${error.message}`);
  }

  // Initialize with seed data if cache doesn't exist
  cache = { ...SEED_TIMEZONES };
  saveCache();
  return cache;
}

/**
 * Save cache to disk
 * Writes to outreach/timezone-cache.json (persistent across runs)
 *
 * @throws {Error} If write fails
 */
function saveCache() {
  if (!cache) return;

  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error(`[timezone-cache] Failed to save cache to disk: ${error.message}`);
  }
}

/**
 * Normalize location key for cache lookup
 * Format: "City, State, Country" (case-normalized)
 * Note: City names title-cased, states uppercase, country title-cased
 *
 * @param {string} city - City name
 * @param {string} state - State/province code
 * @param {string} country - Country name
 * @returns {string} Normalized cache key
 */
function normalizeLocationKey(city, state, country) {
  if (!city) return null;

  const titleCase = (str) => {
    if (!str) return '';
    return str.trim().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const parts = [];
  if (city) parts.push(titleCase(city));
  if (state) parts.push(state.trim().toUpperCase());
  if (country) parts.push(titleCase(country));

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Call Abstract API for timezone lookup
 * Only called if cache miss - minimizes API usage
 *
 * @param {string} city - City name
 * @param {string} state - State/province code
 * @param {string} country - Country name
 * @param {string} apiKey - Abstract API key
 * @returns {Promise<string|null>} IANA timezone or null if API fails
 */
function callAbstractAPI(city, state, country, apiKey) {
  return new Promise((resolve) => {
    if (!apiKey) {
      console.warn('[timezone-cache] ABSTRACT_API_KEY not set, using cache only');
      resolve(null);
      return;
    }

    // Rate limit warning: free tier is 200 req/month (~6-7 per day)
    apiCallCount++;
    if (apiCallCount > 150 && !apiRateLimitWarning) {
      apiRateLimitWarning = true;
      console.warn('[timezone-cache] Approaching rate limit (150+ calls made, 200/month free tier)');
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      fields: 'timezone'
    });

    if (city) params.append('city', city);
    if (state) params.append('state', state);
    if (country) params.append('country', country);

    const url = `${ABSTRACT_API_URL}?${params.toString()}`;

    const request = https.get(url, { timeout: REQUEST_TIMEOUT }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 401) {
            console.error('[timezone-cache] Invalid API key (401)');
            resolve(null);
            return;
          }

          if (res.statusCode === 429) {
            console.warn('[timezone-cache] Rate limit exceeded (429)');
            resolve(null);
            return;
          }

          if (res.statusCode !== 200) {
            console.warn(`[timezone-cache] API returned ${res.statusCode}`);
            resolve(null);
            return;
          }

          const parsed = JSON.parse(data);
          if (parsed.timezone) {
            resolve(parsed.timezone);
          } else {
            resolve(null);
          }
        } catch (parseError) {
          console.error(`[timezone-cache] Failed to parse API response: ${parseError.message}`);
          resolve(null);
        }
      });
    });

    request.on('timeout', () => {
      request.destroy();
      console.warn('[timezone-cache] API request timed out');
      resolve(null);
    });

    request.on('error', (error) => {
      console.error(`[timezone-cache] API request failed: ${error.message}`);
      resolve(null);
    });
  });
}

/**
 * Get timezone for a location
 *
 * Flow:
 * 1. Check memory cache first (fastest)
 * 2. Check persistent cache from disk
 * 3. If cache miss and API key available: call Abstract API
 * 4. If API fails: return null (let enrichment-engine handle fallback)
 * 5. Save new result to cache
 *
 * @param {string} city - City name
 * @param {string} state - State/province code (e.g., "NY", "CA")
 * @param {string} country - Country name (default: "USA")
 * @param {Object} options - Options object
 * @param {string} options.apiKey - Abstract API key (defaults to env var)
 * @returns {Promise<string|null>} IANA timezone (e.g., "America/New_York") or null
 */
async function getTimezone(city, state, country = 'USA', options = {}) {
  if (!city) {
    return null;
  }

  // Load cache if not loaded
  if (cache === null) {
    loadCache();
  }

  const apiKey = options.apiKey || process.env.ABSTRACT_API_KEY || '';
  const locationKey = normalizeLocationKey(city, state, country);

  if (!locationKey) {
    return null;
  }

  // Check cache first (exact match)
  if (cache.hasOwnProperty(locationKey)) {
    return cache[locationKey];
  }

  // Fallback: case-insensitive cache lookup
  const cacheKeyLower = locationKey.toLowerCase();
  for (const key in cache) {
    if (key.toLowerCase() === cacheKeyLower) {
      return cache[key];
    }
  }

  // Fallback 2: Partial match (city only, case-insensitive)
  if (city && !state) {
    const cityLower = city.toLowerCase();
    for (const key in cache) {
      const keyParts = key.split(',').map(p => p.trim());
      if (keyParts[0].toLowerCase() === cityLower && (!country || keyParts[2]?.toLowerCase() === country.toLowerCase())) {
        return cache[key];
      }
    }
  }

  // Cache miss - try Abstract API
  let timezone = null;
  if (apiKey) {
    timezone = await callAbstractAPI(city, state, country, apiKey);
  }

  // If API returned a result, cache it
  if (timezone) {
    cache[locationKey] = timezone;
    saveCache();
  }

  return timezone;
}

/**
 * Get all cached timezones (for reporting/debugging)
 *
 * @returns {Object} Current cache contents
 */
function getAllCached() {
  if (cache === null) {
    loadCache();
  }

  return { ...cache };
}

/**
 * Get cache statistics (for monitoring)
 *
 * @returns {Object} Stats object
 */
function getCacheStats() {
  if (cache === null) {
    loadCache();
  }

  return {
    totalEntries: Object.keys(cache).length,
    seedEntries: Object.keys(SEED_TIMEZONES).length,
    apiCallsThisSession: apiCallCount,
    rateLimitWarning: apiRateLimitWarning,
    cacheFile: CACHE_FILE
  };
}

/**
 * Clear cache (for testing/reset)
 *
 * @param {boolean} deleteFile - Also delete cache file from disk
 */
function clearCache(deleteFile = false) {
  cache = null;

  if (deleteFile && fs.existsSync(CACHE_FILE)) {
    try {
      fs.unlinkSync(CACHE_FILE);
    } catch (error) {
      console.error(`[timezone-cache] Failed to delete cache file: ${error.message}`);
    }
  }
}

module.exports = {
  // Main function
  getTimezone,

  // Utilities
  getAllCached,
  getCacheStats,
  clearCache,
  loadCache,
  saveCache,

  // Constants
  SEED_TIMEZONES,
  CACHE_FILE
};

/**
 * Timezone Cache Tests
 *
 * Tests for persistent caching, seed data, and Abstract API integration
 */

const timezoneCache = require('../lib/timezone-cache');
const fs = require('fs');
const path = require('path');

describe('timezone-cache', () => {
  const CACHE_FILE = path.join(__dirname, '..', 'outreach', 'timezone-cache.json');

  afterAll(() => {
    // Clean up after all tests
    timezoneCache.clearCache(false);
  });

  describe('seed data', () => {
    it('should have 20 common US cities in seed data', () => {
      const seeds = timezoneCache.SEED_TIMEZONES;
      expect(Object.keys(seeds).length).toBe(20);
    });

    it('should have valid IANA timezone formats in seed data', () => {
      const seeds = timezoneCache.SEED_TIMEZONES;
      const ianaPattern = /^[A-Za-z]+\/[A-Za-z_]+$/;

      Object.entries(seeds).forEach(([location, tz]) => {
        expect(tz).toMatch(ianaPattern);
      });
    });

    it('should initialize cache with seed data on first load', () => {
      timezoneCache.clearCache(false);
      const cached = timezoneCache.loadCache();
      expect(Object.keys(cached).length).toBeGreaterThanOrEqual(20);
      expect(cached['New York, NY, USA']).toBe('America/New_York');
    });
  });

  describe('cache persistence', () => {
    it('should save and reload cache from disk', () => {
      timezoneCache.clearCache(false);
      timezoneCache.loadCache();
      timezoneCache.saveCache();

      // Verify file exists
      expect(fs.existsSync(CACHE_FILE)).toBe(true);

      // Verify file contains valid JSON with seed data
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(content);
      expect(typeof data).toBe('object');
      expect(Object.keys(data).length).toBeGreaterThanOrEqual(20);
    });

    it('should load existing cache from disk', () => {
      // Ensure file exists from previous test
      expect(fs.existsSync(CACHE_FILE)).toBe(true);

      timezoneCache.clearCache(false);
      const cached = timezoneCache.loadCache();

      // Should have loaded seed data from disk
      expect(Object.keys(cached).length).toBeGreaterThanOrEqual(20);
    });

    it('should delete cache file when requested', () => {
      // Create test file
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(CACHE_FILE, '{"Test": "data"}', 'utf-8');
      expect(fs.existsSync(CACHE_FILE)).toBe(true);

      // Clear and delete
      timezoneCache.clearCache(true);

      // File should be gone
      expect(fs.existsSync(CACHE_FILE)).toBe(false);

      // Recreate for other tests
      timezoneCache.clearCache(false);
      timezoneCache.loadCache();
      timezoneCache.saveCache();
    });
  });

  describe('getTimezone', () => {
    beforeEach(() => {
      // Ensure cache is loaded before each test
      if (!timezoneCache.getAllCached() || Object.keys(timezoneCache.getAllCached()).length === 0) {
        timezoneCache.clearCache(false);
        timezoneCache.loadCache();
      }
    });

    it('should return timezone for seeded city', async () => {
      const tz = await timezoneCache.getTimezone('New York', 'NY', 'USA');
      expect(tz).toBe('America/New_York');
    });

    it('should return null for empty city', async () => {
      const tz = await timezoneCache.getTimezone('', 'NY', 'USA');
      expect(tz).toBeNull();
    });

    it('should return null for undefined city', async () => {
      const tz = await timezoneCache.getTimezone(undefined, 'NY', 'USA');
      expect(tz).toBeNull();
    });

    it('should normalize location key (case-insensitive)', async () => {
      const tz1 = await timezoneCache.getTimezone('NEW YORK', 'ny', 'USA');
      const tz2 = await timezoneCache.getTimezone('new york', 'NY', 'usa');

      expect(tz1).toBe('America/New_York');
      expect(tz2).toBe('America/New_York');
    });

    it('should handle location without state (partial match)', async () => {
      const tz = await timezoneCache.getTimezone('Denver', '', 'USA');
      expect(tz).toBe('America/Denver');
    });

    it('should use API key from options', async () => {
      // Without API key and without cache hit, should return null
      const tz = await timezoneCache.getTimezone('Unknown City', 'XX', 'USA', {
        apiKey: 'test-key'
      });

      expect(tz).toBeNull();
    });
  });

  describe('cache operations', () => {
    beforeEach(() => {
      // Ensure cache is loaded
      if (!timezoneCache.getAllCached() || Object.keys(timezoneCache.getAllCached()).length === 0) {
        timezoneCache.clearCache(false);
        timezoneCache.loadCache();
      }
    });

    it('should get all cached entries', () => {
      const all = timezoneCache.getAllCached();
      expect(typeof all).toBe('object');
      expect(Object.keys(all).length).toBeGreaterThanOrEqual(20);
    });

    it('should return cache statistics', () => {
      const stats = timezoneCache.getCacheStats();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('seedEntries');
      expect(stats).toHaveProperty('apiCallsThisSession');
      expect(stats).toHaveProperty('cacheFile');

      expect(stats.seedEntries).toBe(20);
      expect(stats.totalEntries).toBeGreaterThanOrEqual(20);
    });
  });

  describe('location normalization', () => {
    beforeEach(() => {
      // Ensure cache is loaded
      if (!timezoneCache.getAllCached() || Object.keys(timezoneCache.getAllCached()).length === 0) {
        timezoneCache.clearCache(false);
        timezoneCache.loadCache();
      }
    });

    it('should handle Chicago variations', async () => {
      const tz1 = await timezoneCache.getTimezone('Chicago', 'IL', 'USA');
      const tz2 = await timezoneCache.getTimezone('chicago', 'il', 'usa');

      expect(tz1).toBe('America/Chicago');
      expect(tz2).toBe('America/Chicago');
    });

    it('should handle Los Angeles variations', async () => {
      const tz1 = await timezoneCache.getTimezone('Los Angeles', 'CA', 'USA');
      const tz2 = await timezoneCache.getTimezone('los angeles', 'ca', 'usa');

      expect(tz1).toBe('America/Los_Angeles');
      expect(tz2).toBe('America/Los_Angeles');
    });

    it('should handle Denver (Mountain Time)', async () => {
      const tz = await timezoneCache.getTimezone('Denver', 'CO', 'USA');
      expect(tz).toBe('America/Denver');
    });
  });

  describe('error handling', () => {
    it('should handle missing API key gracefully', async () => {
      const originalKey = process.env.ABSTRACT_API_KEY;
      delete process.env.ABSTRACT_API_KEY;

      const tz = await timezoneCache.getTimezone('UnknownCity', 'XX', 'USA');
      expect(tz).toBeNull();

      if (originalKey) {
        process.env.ABSTRACT_API_KEY = originalKey;
      }
    });

    it('should return null for unknown location', async () => {
      if (!timezoneCache.getAllCached() || Object.keys(timezoneCache.getAllCached()).length === 0) {
        timezoneCache.clearCache(false);
        timezoneCache.loadCache();
      }

      const tz = await timezoneCache.getTimezone('Nonexistent City', 'XX', 'USA');
      expect(tz).toBeNull();
    });
  });
});

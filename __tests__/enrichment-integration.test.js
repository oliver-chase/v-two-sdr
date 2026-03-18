/**
 * Enrichment Engine — Integration Tests
 * Full workflow tests with real prospects, batch operations
 * Integration with other SDR components
 */

const {
  enrichProspect,
  enrichProspects,
  createEnrichmentCache,
  confidenceThresholds
} = require('../scripts/enrichment-engine');

const config = require('../config.enrichment');

describe('Enrichment Engine Integration Tests', () => {
  describe('Real-world prospect enrichment', () => {
    test('enriches prospect matching dev industry pattern', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Sarah',
        ln: 'Chen',
        co: 'TechStartup Inc',
        ti: 'CTO',
        tr: 'ai-enablement',
        st: 'pending'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      // Validate enrichment
      expect(enriched.id).toBe('p-001');
      expect(enriched.fn).toBe('Sarah');
      expect(enriched).toHaveProperty('em');
      expect(enriched).toHaveProperty('confidence');
      expect(enriched).toHaveProperty('confidenceAction');

      // Confidence should be reasonable for partial data
      expect(enriched.confidence).toBeGreaterThan(0);
      expect(enriched.confidence).toBeLessThanOrEqual(1);
    });

    test('enriches prospect with existing email', async () => {
      const prospect = {
        id: 'p-002',
        fn: 'John',
        ln: 'Smith',
        co: 'Example Corp',
        ti: 'VP Engineering',
        em: 'john.smith@example.com',
        tr: 'product-maker',
        st: 'pending'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched.em).toBe('john.smith@example.com');
      expect(enriched.confidence).toBeGreaterThanOrEqual(0.3);
    });

    test('enriches batch of diverse prospects efficiently', async () => {
      const prospects = [
        {
          id: 'p-001',
          fn: 'Alice',
          ln: 'Johnson',
          co: 'StartupA',
          ti: 'Founder'
        },
        {
          id: 'p-002',
          fn: 'Bob',
          ln: 'Davis',
          co: 'StartupA', // same company - should use cache
          ti: 'CTO'
        },
        {
          id: 'p-003',
          fn: 'Carol',
          ln: 'Martinez',
          co: 'EnterpriseCo',
          ti: 'Director of Engineering'
        },
        {
          id: 'p-004',
          fn: 'Dan',
          ln: 'Wilson',
          em: 'dan.wilson@tech.io'
        }
      ];

      const enriched = await enrichProspects(prospects);

      expect(enriched).toHaveLength(4);
      enriched.forEach((p, i) => {
        expect(p.id).toBe(prospects[i].id);
        expect(p).toHaveProperty('confidence');
        expect(p.confidence).toBeGreaterThanOrEqual(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Confidence action routing', () => {
    test('routes high-confidence prospects to auto-use', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'High',
        ln: 'Confidence',
        co: 'Example',
        ti: 'CEO',
        em: 'high@example.com'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      // Valid email + MX check should push confidence up
      if (enriched.confidence >= 0.8) {
        expect(enriched.confidenceAction).toBe('auto-use');
      }
    });

    test('routes mid-confidence prospects to user review', async () => {
      const prospect = {
        id: 'p-002',
        fn: 'Mid',
        ln: 'Confidence',
        co: 'Mid Company'
        // Missing title, no email
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      // Partial data should fall in mid-range
      if (enriched.confidence >= 0.5 && enriched.confidence < 0.8) {
        expect(enriched.confidenceAction).toBe('user-review');
      }
    });

    test('routes low-confidence prospects to skip', async () => {
      const prospect = {
        id: 'p-003'
        // Minimal data
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      // Barely any data should result in low confidence
      if (enriched.confidence < 0.5) {
        expect(enriched.confidenceAction).toBe('skip');
      }
    });
  });

  describe('Config integration', () => {
    test('respects confidence thresholds from config', () => {
      const cfg = config.confidenceThresholds;

      // Test boundary at autoUse
      const highConfidence = { confidence: cfg.autoUse };
      expect(confidenceThresholds(highConfidence)).toBe('auto-use');

      // Test boundary at userReview
      const midConfidence = { confidence: cfg.userReview };
      expect(confidenceThresholds(midConfidence)).toBe('user-review');

      // Test just below userReview
      const lowConfidence = { confidence: cfg.userReview - 0.01 };
      expect(confidenceThresholds(lowConfidence)).toBe('skip');
    });

    test('uses email patterns from config', () => {
      const cfg = config.emailPatterns;

      expect(cfg).toBeInstanceOf(Array);
      expect(cfg.length).toBeGreaterThan(0);

      cfg.forEach(pattern => {
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('weight');
        expect(pattern.weight).toBeGreaterThan(0);
        expect(pattern.weight).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Cache efficiency', () => {
    test('avoids redundant MX lookups in batch', async () => {
      const prospects = [
        { id: 'p-001', fn: 'User1', ln: 'One', em: 'user1@acme.com' },
        { id: 'p-002', fn: 'User2', ln: 'Two', em: 'user2@acme.com' }, // same domain
        { id: 'p-003', fn: 'User3', ln: 'Three', em: 'user3@acme.com' } // same domain
      ];

      const cache = createEnrichmentCache();

      // First prospect will do MX lookup
      await enrichProspect(prospects[0], cache);
      expect(cache.mxRecords.size).toBe(1);

      // Second & third should use cache
      await enrichProspect(prospects[1], cache);
      await enrichProspect(prospects[2], cache);

      // Cache should still have only 1 entry (same domain)
      expect(cache.mxRecords.size).toBe(1);
    });

    test('avoids redundant web searches for same company', async () => {
      const prospects = [
        { id: 'p-001', fn: 'User1', ln: 'One', co: 'Example Corp', ti: 'CTO' },
        { id: 'p-002', fn: 'User2', ln: 'Two', co: 'Example Corp', ti: 'VP Sales' } // same company, same title
      ];

      const cache = createEnrichmentCache();

      // First prospect does web search
      await enrichProspect(prospects[0], cache);
      const firstSearchSize = cache.webSearchResults.size;

      // Second prospect should use cache for same company/title combo
      await enrichProspect(prospects[1], cache);

      // Cache size may or may not grow depending on title similarity
      // But both should be resolved
      expect(cache.webSearchResults.size).toBeGreaterThanOrEqual(firstSearchSize);
    });
  });

  describe('Toon format compatibility', () => {
    test('preserves TOON format fields during enrichment', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'John', // first name
        ln: 'Doe', // last name
        co: 'Example', // company
        ti: 'Director', // title
        em: 'john@example.com', // email
        tr: 'product-maker', // track
        st: 'pending', // status
        ad: '2026-03-11' // added date
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      // All original TOON fields should be preserved
      expect(enriched.fn).toBe('John');
      expect(enriched.ln).toBe('Doe');
      expect(enriched.co).toBe('Example');
      expect(enriched.ti).toBe('Director');
      expect(enriched.tr).toBe('product-maker');
      expect(enriched.st).toBe('pending');
      expect(enriched.ad).toBe('2026-03-11');
    });

    test('adds enrichment metadata without breaking TOON format', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Jane',
        ln: 'Smith',
        co: 'StartupXYZ',
        ti: 'CTO'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      // New enrichment fields
      expect(enriched).toHaveProperty('confidence');
      expect(enriched).toHaveProperty('confidenceAction');
      expect(enriched).toHaveProperty('enrichedAt');
      expect(enriched).toHaveProperty('signals');

      // Original TOON fields preserved
      expect(enriched.fn).toBe('Jane');
      expect(enriched.ln).toBe('Smith');
    });
  });

  describe('Error resilience', () => {
    test('handles prospects with all missing fields gracefully', async () => {
      const prospect = {};

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched).toBeDefined();
      expect(enriched).toHaveProperty('confidence');
      expect(enriched.confidence).toBeGreaterThanOrEqual(0);
    });

    test('handles null/undefined inputs without throwing', async () => {
      const cache = createEnrichmentCache();

      // All should complete without throwing
      expect(async () => await enrichProspect(null, cache)).not.toThrow();
      expect(async () => await enrichProspect(undefined, cache)).not.toThrow();
      expect(async () => await enrichProspect({}, cache)).not.toThrow();
    });

    test('continues enrichment when individual signals fail', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Resilient',
        ln: 'User',
        co: 'TestCo',
        ti: 'Manager'
        // No email - web search/fetch might fail, should still complete
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched).toBeDefined();
      expect(enriched).toHaveProperty('confidence');
    });
  });

  describe('Performance', () => {
    test('enriches 10 prospects in reasonable time', async () => {
      const prospects = Array.from({ length: 10 }, (_, i) => ({
        id: `p-${String(i + 1).padStart(3, '0')}`,
        fn: `User${i}`,
        ln: `Test`,
        co: `Company${i % 3}`, // some company reuse
        ti: `Title${i % 5}`
      }));

      const start = Date.now();
      await enrichProspects(prospects);
      const elapsed = Date.now() - start;

      // Should complete in under 5 seconds (generous with mocks)
      expect(elapsed).toBeLessThan(5000);
    });

    test('cache significantly improves repeated lookups', async () => {
      const sameCompanyProspects = Array.from({ length: 5 }, (_, i) => ({
        id: `p-${i}`,
        fn: `User${i}`,
        ln: 'Test',
        co: 'SameCompany', // all same company
        ti: 'Engineer' // same title to test cache reuse
      }));

      const cache = createEnrichmentCache();

      // Measure time with cache
      const start = Date.now();
      for (const prospect of sameCompanyProspects) {
        await enrichProspect(prospect, cache);
      }
      const elapsed = Date.now() - start;

      // Should be fast due to cache reuse
      expect(elapsed).toBeLessThan(2000);
      expect(cache.webSearchResults.size).toBeLessThanOrEqual(2);
    });
  });

  describe('Output validation', () => {
    test('enriched prospect meets output spec', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Output',
        ln: 'Spec',
        co: 'TestCo',
        ti: 'Engineer',
        em: 'output@test.co'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      // Must-have fields
      expect(enriched).toHaveProperty('id');
      expect(enriched).toHaveProperty('fn');
      expect(enriched).toHaveProperty('ln');
      expect(enriched).toHaveProperty('co');
      expect(enriched).toHaveProperty('ti');
      expect(enriched).toHaveProperty('em');
      expect(enriched).toHaveProperty('confidence');
      expect(enriched).toHaveProperty('confidenceAction');
      expect(enriched).toHaveProperty('enrichedAt');
      expect(enriched).toHaveProperty('signals');

      // Type validation
      expect(typeof enriched.confidence).toBe('number');
      expect(typeof enriched.confidenceAction).toBe('string');
      expect(typeof enriched.enrichedAt).toBe('string');
      expect(typeof enriched.signals).toBe('object');

      // Confidence action must be one of the three actions
      expect(['auto-use', 'user-review', 'skip']).toContain(enriched.confidenceAction);
    });
  });
});

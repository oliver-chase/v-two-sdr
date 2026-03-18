/**
 * Enrichment Engine — Unit & Integration Tests
 * Tests email validation, MX checks, web search/fetch, confidence scoring
 * TDD: Write tests first, implement to pass
 */

const {
  generateEmailCandidates,
  validateEmail,
  validateMXRecord,
  calculateDeliverabilityScore,
  enrichProspectWebSearch,
  enrichProspectWebFetch,
  createEnrichmentCache,
  enrichProspect,
  confidenceThresholds
} = require('../scripts/enrichment-engine');

describe('Enrichment Engine', () => {
  describe('Email Candidate Generation', () => {
    test('generates common email patterns from domain and name', () => {
      const candidates = generateEmailCandidates('john', 'smith', 'acme.com');

      expect(candidates).toBeInstanceOf(Array);
      expect(candidates.length).toBeGreaterThan(0);

      // Should include common patterns
      const patterns = candidates.map(c => c.em);
      expect(patterns).toContain('john.smith@acme.com');
      expect(patterns).toContain('jsmith@acme.com');
      expect(patterns).toContain('john@acme.com');
    });

    test('handles special characters in names', () => {
      const candidates = generateEmailCandidates('jean-pierre', "o'brien", 'example.com');

      expect(candidates.length).toBeGreaterThan(0);
      candidates.forEach(c => {
        expect(c.em).toMatch(/@example\.com$/);
        expect(c.em).not.toMatch(/\s/); // no spaces
      });
    });

    test('prioritizes emails by likelihood score', () => {
      const candidates = generateEmailCandidates('alice', 'johnson', 'techcorp.io');

      expect(candidates[0]).toHaveProperty('pattern');
      expect(candidates[0]).toHaveProperty('score');

      // First candidate should have highest score
      const scores = candidates.map(c => c.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });
  });

  describe('Email Validation', () => {
    test('validates correct email format', () => {
      expect(validateEmail('john@acme.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
    });
  });

  describe('MX Record Validation', () => {
    test('validates MX record for valid domain', async () => {
      // Mock: google.com has valid MX records
      const result = await validateMXRecord('google.com');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('mxRecords');
      expect(typeof result.valid).toBe('boolean');
    });

    test('rejects invalid domain', async () => {
      const result = await validateMXRecord('notarealdomain12345xyz.com');

      expect(result.valid).toBe(false);
      expect(result.mxRecords).toEqual([]);
    });

    test('handles DNS lookup errors gracefully', async () => {
      const result = await validateMXRecord('invalid..domain.com');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('error');
    });

    test('caches MX results within same run', async () => {
      const domain = 'example.com';
      const cache = createEnrichmentCache();

      const result1 = await validateMXRecord(domain, cache);
      const result2 = await validateMXRecord(domain, cache);

      // Both should return (second from cache)
      expect(result1).toEqual(result2);
    });
  });

  describe('Deliverability Scoring', () => {
    test('calculates score from multiple signals', () => {
      const signals = {
        mxValid: true,       // +0.3
        domainWhoisRecent: true, // +0.2
        webSearchFound: true,    // +0.2
        emailPatternMatch: true  // +0.2
      };

      const score = calculateDeliverabilityScore(signals);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
      expect(score).toBeCloseTo(0.9, 5); // 0.3 + 0.2 + 0.2 + 0.2
    });

    test('handles partial signals', () => {
      const signals = {
        mxValid: true,      // +0.3
        emailPatternMatch: true // +0.2
      };

      const score = calculateDeliverabilityScore(signals);

      expect(score).toBe(0.5); // Only these two contribute
      expect(score).toBeGreaterThan(0);
    });

    test('returns 0 for no signals', () => {
      const score = calculateDeliverabilityScore({});
      expect(score).toBe(0);
    });

    test('caps score at 1.0', () => {
      const signals = {
        mxValid: true,
        domainWhoisRecent: true,
        webSearchFound: true,
        emailPatternMatch: true,
        extraSignal: true
      };

      const score = calculateDeliverabilityScore(signals);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Confidence Thresholds', () => {
    test('auto-use for high confidence (>= 0.8)', () => {
      const prospect = {
        fn: 'Jane',
        ln: 'Doe',
        em: 'jane@example.com',
        confidence: 0.85
      };

      const action = confidenceThresholds(prospect);
      expect(action).toBe('auto-use');
    });

    test('flag for user review (0.5-0.8)', () => {
      const prospect = {
        fn: 'John',
        ln: 'Smith',
        em: 'john@example.com',
        confidence: 0.65
      };

      const action = confidenceThresholds(prospect);
      expect(action).toBe('user-review');
    });

    test('skip for low confidence (< 0.5)', () => {
      const prospect = {
        fn: 'Bob',
        ln: 'Jones',
        em: 'bob@example.com',
        confidence: 0.3
      };

      const action = confidenceThresholds(prospect);
      expect(action).toBe('skip');
    });

    test('boundary at 0.8', () => {
      expect(confidenceThresholds({ confidence: 0.8 })).toBe('auto-use');
      expect(confidenceThresholds({ confidence: 0.79 })).toBe('user-review');
    });

    test('boundary at 0.5', () => {
      expect(confidenceThresholds({ confidence: 0.5 })).toBe('user-review');
      expect(confidenceThresholds({ confidence: 0.49 })).toBe('skip');
    });
  });

  describe('Web Search Wrapper (OpenClaw)', () => {
    test('searches for company context', async () => {
      const prospect = {
        fn: 'John',
        ln: 'Doe',
        co: 'Example Corp',
        ti: 'Engineering Manager'
      };

      const result = await enrichProspectWebSearch(prospect);

      expect(result).toHaveProperty('searches');
      expect(result).toHaveProperty('found');
      expect(typeof result.found).toBe('boolean');
    });

    test('extracts hiring signals from search results', async () => {
      const prospect = {
        fn: 'Sarah',
        ln: 'Chen',
        co: 'TechStartup Inc',
        ti: 'CTO'
      };

      const result = await enrichProspectWebSearch(prospect);

      expect(result).toHaveProperty('signals');
      if (result.found) {
        expect(result.signals).toBeInstanceOf(Array);
      }
    });

    test('uses cache to avoid duplicate searches', async () => {
      const cache = createEnrichmentCache();
      const prospect = {
        fn: 'Alice',
        ln: 'Johnson',
        co: 'Another Company',
        ti: 'Manager'
      };

      const result1 = await enrichProspectWebSearch(prospect, cache);
      const result2 = await enrichProspectWebSearch(prospect, cache);

      // Results should be identical (second from cache)
      expect(result1).toEqual(result2);
    });

    test('returns empty results for invalid input', async () => {
      const prospect = {
        fn: '',
        ln: '',
        co: ''
      };

      const result = await enrichProspectWebSearch(prospect);

      expect(result.found).toBe(false);
    });
  });

  describe('Web Fetch Wrapper (Company Website)', () => {
    test('fetches company website information', async () => {
      const prospect = {
        co: 'example.com',
        ti: 'Product Manager'
      };

      const result = await enrichProspectWebFetch(prospect);

      expect(result).toHaveProperty('fetched');
      expect(result).toHaveProperty('context');
      expect(typeof result.fetched).toBe('boolean');
    });

    test('extracts industry and location from website', async () => {
      const prospect = {
        co: 'techcompany.io',
        ti: 'VP Engineering'
      };

      const result = await enrichProspectWebFetch(prospect);

      if (result.fetched) {
        expect(result.context).toHaveProperty('industry');
        expect(result.context).toHaveProperty('location');
      }
    });

    test('uses cache for company websites', async () => {
      const cache = createEnrichmentCache();
      const prospect = {
        co: 'example.com',
        ti: 'Manager'
      };

      const result1 = await enrichProspectWebFetch(prospect, cache);
      const result2 = await enrichProspectWebFetch(prospect, cache);

      expect(result1).toEqual(result2);
    });

    test('handles missing company information', async () => {
      const prospect = {
        co: '',
        ti: 'Manager'
      };

      const result = await enrichProspectWebFetch(prospect);

      expect(result.fetched).toBe(false);
    });
  });

  describe('Enrichment Cache', () => {
    test('creates empty cache', () => {
      const cache = createEnrichmentCache();

      expect(cache).toHaveProperty('mxRecords');
      expect(cache).toHaveProperty('webSearchResults');
      expect(cache).toHaveProperty('webFetchResults');
      expect(cache.mxRecords.size).toBe(0);
    });

    test('cache persists within run', () => {
      const cache = createEnrichmentCache();

      cache.mxRecords.set('example.com', { valid: true });

      expect(cache.mxRecords.has('example.com')).toBe(true);
      expect(cache.mxRecords.get('example.com').valid).toBe(true);
    });

    test('separate caches per run', () => {
      const cache1 = createEnrichmentCache();
      const cache2 = createEnrichmentCache();

      cache1.mxRecords.set('test.com', { valid: true });

      expect(cache1.mxRecords.has('test.com')).toBe(true);
      expect(cache2.mxRecords.has('test.com')).toBe(false);
    });
  });

  describe('Full Prospect Enrichment', () => {
    test('enriches prospect with all signals', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'John',
        ln: 'Doe',
        co: 'Example Corp',
        ti: 'Engineering Manager',
        em: 'john@example.com'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched).toHaveProperty('id');
      expect(enriched).toHaveProperty('fn');
      expect(enriched).toHaveProperty('em');
      expect(enriched).toHaveProperty('confidence');
      expect(enriched).toHaveProperty('confidenceAction');
      expect(typeof enriched.confidence).toBe('number');
    });

    test('generates email candidates if missing', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Jane',
        ln: 'Smith',
        co: 'Tech Inc',
        ti: 'Director'
        // no email
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched).toHaveProperty('em');
      expect(enriched.em).toMatch(/@tech\.?inc/i);
    });

    test('preserves existing email', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Bob',
        ln: 'Jones',
        co: 'Corp Inc',
        ti: 'CEO',
        em: 'bob@corp.com'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched.em).toBe('bob@corp.com');
    });

    test('adds enrichment metadata', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Sarah',
        ln: 'Chen',
        co: 'StartupXYZ',
        ti: 'CTO',
        em: 'sarah@startup.com'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched).toHaveProperty('enrichedAt');
      expect(enriched).toHaveProperty('signals');
      expect(enriched.signals).toBeInstanceOf(Object);
    });

    test('handles missing required fields gracefully', async () => {
      const prospect = {
        id: 'p-001',
        fn: 'Incomplete'
        // missing other fields
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched).toBeDefined();
      expect(enriched).toHaveProperty('confidence');
    });
  });

  describe('Integration: Batch Enrichment', () => {
    test('enriches multiple prospects with shared cache', async () => {
      const prospects = [
        {
          id: 'p-001',
          fn: 'John',
          ln: 'Doe',
          co: 'Example Corp',
          ti: 'Manager',
          em: 'john@example.com'
        },
        {
          id: 'p-002',
          fn: 'Jane',
          ln: 'Smith',
          co: 'Example Corp', // same company, should use cache
          ti: 'Director',
          em: 'jane@example.com'
        }
      ];

      const cache = createEnrichmentCache();
      const enriched = [];

      for (const prospect of prospects) {
        enriched.push(await enrichProspect(prospect, cache));
      }

      expect(enriched).toHaveLength(2);
      enriched.forEach(p => {
        expect(p).toHaveProperty('confidence');
        expect(p.confidence).toBeGreaterThanOrEqual(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('handles null prospect gracefully', async () => {
      const cache = createEnrichmentCache();

      // Should not throw
      expect(() => enrichProspect(null, cache)).not.toThrow();
    });

    test('handles prospect without contact info', async () => {
      const prospect = {
        id: 'p-001',
        co: 'Company Name'
      };

      const cache = createEnrichmentCache();
      const enriched = await enrichProspect(prospect, cache);

      expect(enriched).toBeDefined();
      expect(enriched.confidence).toBeLessThanOrEqual(0.3);
    });

    test('confidence score always valid (0-1 range)', async () => {
      const prospects = [
        { id: 'p-001', fn: 'Test', ln: 'User', co: 'Inc', ti: 'Dev', em: 'test@inc.com' },
        { id: 'p-002', fn: 'Jane', ln: 'Doe', co: 'Corp' },
        { id: 'p-003', co: 'Unknown' },
        { id: 'p-004' }
      ];

      const cache = createEnrichmentCache();

      for (const prospect of prospects) {
        const enriched = await enrichProspect(prospect, cache);
        expect(enriched.confidence).toBeGreaterThanOrEqual(0);
        expect(enriched.confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});

#!/usr/bin/env node

/**
 * SDR Enrichment Engine
 *
 * Core responsibilities:
 * 1. Generate email candidates from name + domain (pattern-based)
 * 2. Validate MX records (domain accepts mail)
 * 3. Calculate deliverability confidence scores (0-1 scale)
 * 4. Web search for company context (OpenClaw integration)
 * 5. Web fetch for website enrichment (company info extraction)
 * 6. Per-run caching (avoid duplicate requests)
 * 7. Confidence thresholds (auto-use >= 0.8, user-review 0.5-0.8, skip < 0.5)
 *
 * Integration:
 * - Input: prospects.json (TOON format)
 * - Output: prospects with em, confidence, signals
 * - Used by: Chunk 4 (state machine), Chunk 5 (email drafting)
 *
 * Email Discovery Strategy (Zero API Cost):
 * - OpenClaw researches company email patterns via web_search
 * - System generates 7 candidates ranked by likelihood
 * - MX validation confirms domain is real
 * - NO upfront API verification — only if emails bounce (pay-as-you-go)
 *
 * Tech: Node.js, dns module, web_search + web_fetch (OpenClaw), Jest
 */

const dns = require('dns').promises;
const { validateEmail } = require('./validate-prospects');
const timezoneCache = require('../lib/timezone-cache');
const hunterVerifier = require('./hunter-verifier');

/**
 * SECTION 1: EMAIL CANDIDATE GENERATION
 */

/**
 * Common email patterns, ranked by likelihood (industry-standard)
 * @type {Array<{pattern: string, weight: number}>}
 */
const EMAIL_PATTERNS = [
  { pattern: '{f}.{l}@{d}', weight: 0.95 },    // john.smith@example.com
  { pattern: '{f}{l}@{d}', weight: 0.85 },     // johnsmith@example.com
  { pattern: '{f}@{d}', weight: 0.75 },        // john@example.com
  { pattern: '{i}{l}@{d}', weight: 0.7 },      // jsmith@example.com
  { pattern: '{l}.{f}@{d}', weight: 0.65 },    // smith.john@example.com
  { pattern: '{f}_{l}@{d}', weight: 0.6 },     // john_smith@example.com
  { pattern: '{f}-{l}@{d}', weight: 0.55 }     // john-smith@example.com
];

/**
 * Generate email candidate addresses from name and domain
 * Returns ordered list (highest confidence first)
 *
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} domain - Company domain
 * @returns {Array<{em: string, pattern: string, score: number}>}
 */
function generateEmailCandidates(firstName, lastName, domain) {
  if (!firstName || !lastName || !domain) {
    return [];
  }

  // Normalize inputs
  const f = firstName.toLowerCase().replace(/\s+/g, '').replace(/[^\w-]/g, '');
  const l = lastName.toLowerCase().replace(/\s+/g, '').replace(/[^\w-]/g, '');
  const d = domain.toLowerCase().trim();
  const i = f.charAt(0); // first initial

  const candidates = EMAIL_PATTERNS.map(({ pattern, weight }) => {
    let email = pattern
      .replace(/{f}/g, f)
      .replace(/{l}/g, l)
      .replace(/{i}/g, i)
      .replace(/{d}/g, d);

    return {
      em: email,
      pattern,
      score: weight
    };
  });

  // Remove duplicates, preserve order
  const seen = new Set();
  const unique = candidates.filter(c => {
    if (seen.has(c.em)) return false;
    seen.add(c.em);
    return true;
  });

  return unique;
}

/**
 * SECTION 2: EMAIL & DOMAIN VALIDATION
 */

/**
 * Validates email format (basic regex check)
 *
 * @param {string} email - Email address
 * @returns {boolean}
 */
function validateEmailFormat(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates MX records for domain (domain accepts mail)
 * Caches results within a single run
 *
 * @param {string} domain - Domain to validate
 * @param {Object} cache - Per-run enrichment cache
 * @returns {Promise<{valid: boolean, mxRecords: Array, error?: string}>}
 */
async function validateMXRecord(domain, cache = null) {
  if (!domain) {
    return { valid: false, mxRecords: [] };
  }

  // Check cache first
  if (cache && cache.mxRecords.has(domain)) {
    return cache.mxRecords.get(domain);
  }

  try {
    const mxRecords = await dns.resolveMx(domain);

    const result = {
      valid: mxRecords && mxRecords.length > 0,
      mxRecords: mxRecords || []
    };

    // Cache for this run
    if (cache) {
      cache.mxRecords.set(domain, result);
    }

    return result;
  } catch (error) {
    const result = {
      valid: false,
      mxRecords: [],
      error: error.message
    };

    if (cache) {
      cache.mxRecords.set(domain, result);
    }

    return result;
  }
}

/**
 * SECTION 3: DELIVERABILITY SCORING
 */

/**
 * Calculates confidence score from multiple signals
 * Each signal contributes +0.2 (4 max), capped at 1.0
 *
 * Signals:
 * - mxValid: Domain has MX records (+0.3)
 * - domainWhoisRecent: Domain registered recently (+0.2)
 * - webSearchFound: Web search found company info (+0.2)
 * - emailPatternMatch: Email matches industry standard (+0.2)
 *
 * @param {Object} signals - {mxValid, domainWhoisRecent, webSearchFound, emailPatternMatch}
 * @returns {number} Confidence score (0-1)
 */
function calculateDeliverabilityScore(signals = {}) {
  let score = 0;

  if (signals.mxValid) score += 0.3;
  if (signals.domainWhoisRecent) score += 0.2;
  if (signals.webSearchFound) score += 0.2;
  if (signals.emailPatternMatch) score += 0.2;

  return Math.min(score, 1.0);
}

/**
 * SECTION 4: CONFIDENCE THRESHOLDS
 */

/**
 * Determines action based on confidence score
 * >= 0.8: auto-use (approved for sending)
 * 0.5-0.8: user-review (flag for manual approval)
 * < 0.5: skip (too risky)
 *
 * @param {Object} prospect - Prospect with confidence score
 * @returns {string} Action: 'auto-use' | 'user-review' | 'skip'
 */
function confidenceThresholds(prospect) {
  const confidence = prospect.confidence || 0;

  if (confidence >= 0.8) return 'auto-use';
  if (confidence >= 0.5) return 'user-review';
  return 'skip';
}

/**
 * SECTION 5: WEB SEARCH INTEGRATION (Serper API)
 */

/**
 * Searches company context via Serper API (Google search)
 * Replaces mocked web search with real Google results
 *
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results {title, snippet, link}
 */
async function searchSerper(query) {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 5 })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.organic || [];
  } catch (error) {
    console.warn(`[enrichment-engine] Serper search failed for "${query}": ${error.message}`);
    return [];
  }
}

/**
 * Searches for company context via Serper API
 * Integration point for Google-backed research
 *
 * In production: calls Serper API for real search results
 * In testing: mocked via Jest
 *
 * @param {Object} prospect - Prospect {fn, ln, co, ti}
 * @param {Object} cache - Per-run cache for deduplication
 * @returns {Promise<{searches: Array, found: boolean, signals: Array, error?: string}>}
 */
async function enrichProspectWebSearch(prospect, cache = null) {
  if (!prospect || !prospect.co || !prospect.ti) {
    return {
      searches: [],
      found: false,
      signals: []
    };
  }

  const cacheKey = `${prospect.co}|${prospect.ti}`;

  // Check cache
  if (cache && cache.webSearchResults.has(cacheKey)) {
    return cache.webSearchResults.get(cacheKey);
  }

  try {
    // Serper API for real Google search results
    const queries = [
      `${prospect.co} ${prospect.ti} hiring`,
      `${prospect.co} funding rounds`,
      `${prospect.co} company news`
    ];

    let found = false;
    const searches = [];

    for (const query of queries) {
      const results = await searchSerper(query);
      searches.push({ query, found: results.length > 0 });
      if (results.length > 0) {
        found = true;
      }
    }

    const result = {
      searches,
      found,
      signals: found ? ['webSearchFound'] : []
    };

    if (cache) {
      cache.webSearchResults.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    const result = {
      searches: [],
      found: false,
      signals: [],
      error: error.message
    };

    if (cache) {
      cache.webSearchResults.set(cacheKey, result);
    }

    return result;
  }
}

/**
 * SECTION 6: WEB FETCH INTEGRATION (Company Website)
 */

/**
 * Fetches company website for enrichment
 * Integration point for extracting company context
 *
 * In production: calls OpenClaw web_fetch for company domain
 * In testing: mocked via Jest
 *
 * @param {Object} prospect - Prospect {co, ti, ...}
 * @param {Object} cache - Per-run cache
 * @returns {Promise<{fetched: boolean, context: Object, error?: string}>}
 */
async function enrichProspectWebFetch(prospect, cache = null) {
  if (!prospect || !prospect.co) {
    return {
      fetched: false,
      context: {}
    };
  }

  const cacheKey = prospect.co.toLowerCase();

  // Check cache
  if (cache && cache.webFetchResults.has(cacheKey)) {
    return cache.webFetchResults.get(cacheKey);
  }

  try {
    // In production: call OpenClaw web_fetch here
    // Example: const html = await openClawWebFetch(`https://${prospect.co}`)

    // For now: mock response
    const result = {
      fetched: false,
      context: {
        industry: null,
        location: null,
        employees: null,
        founded: null
      }
    };

    if (cache) {
      cache.webFetchResults.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    const result = {
      fetched: false,
      context: {},
      error: error.message
    };

    if (cache) {
      cache.webFetchResults.set(cacheKey, result);
    }

    return result;
  }
}

/**
 * SECTION 7: PER-RUN CACHING
 */

/**
 * Creates a cache object for a single enrichment run
 * Prevents duplicate MX lookups, web searches, fetches, and Hunter verifications
 *
 * @returns {Object} Cache with mxRecords, webSearchResults, webFetchResults, hunterVerifications Maps
 */
function createEnrichmentCache() {
  return {
    mxRecords: new Map(),           // domain -> {valid, mxRecords, error}
    webSearchResults: new Map(),    // company|title -> {searches, found, signals}
    webFetchResults: new Map(),     // company -> {fetched, context, error}
    hunterVerifications: new Map()  // email -> {success, status, result, score, verifiedAt}
  };
}

/**
 * SECTION 8: FULL PROSPECT ENRICHMENT
 */

/**
 * Enriches a single prospect with all available signals
 * Generates email if missing, calculates confidence score, adds metadata
 *
 * @param {Object} prospect - Prospect in TOON format {id, fn, ln, co, ti, em?, ...}
 * @param {Object} cache - Per-run enrichment cache
 * @returns {Promise<Object>} Enriched prospect with em, confidence, signals
 */
async function enrichProspect(prospect, cache = null) {
  if (!prospect) {
    return { confidence: 0, signals: {} };
  }

  const enriched = { ...prospect };
  const signals = {};

  // Ensure cache exists
  if (!cache) {
    cache = createEnrichmentCache();
  }

  // Step 1: Email validation/generation
  if (!enriched.em || !validateEmailFormat(enriched.em)) {
    if (enriched.fn && enriched.ln) {
      // Prefer explicit domain field; fall back to stripping company name
      let domain = null;
      if (enriched.dm) {
        domain = enriched.dm.toLowerCase().trim()
          .replace(/^https?:\/\//i, '')
          .replace(/\/.*/g, '');
      } else if (enriched.co) {
        // Best-effort: strip non-word chars and append .com
        domain = enriched.co
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^\w]/g, '') + '.com';
      }

      if (domain) {
        const candidates = generateEmailCandidates(enriched.fn, enriched.ln, domain);
        if (candidates.length > 0) {
          enriched.em = candidates[0].em;
          signals.emailPatternMatch = true;
        }
      }
    }
  } else {
    signals.emailPatternMatch = true;
  }

  // Step 2: MX Record validation
  if (enriched.em) {
    const domain = enriched.em.split('@')[1];
    if (domain) {
      const mxResult = await validateMXRecord(domain, cache);
      signals.mxValid = mxResult.valid;
    }
  }

  // Step 2b: Timezone lookup (after MX validation)
  if (enriched.loc) {
    // Parse location "City, State" format
    const locParts = enriched.loc.split(',').map(p => p.trim());
    if (locParts.length >= 2) {
      const city = locParts[0];
      const state = locParts[1];
      const tz = await timezoneCache.getTimezone(city, state, 'USA');
      if (tz) {
        enriched.tz = tz;
        signals.timezoneResolved = true;
      }
    }
  }

  // Step 3: Web search for company context
  if (enriched.co && enriched.ti) {
    const webSearchResult = await enrichProspectWebSearch(enriched, cache);
    signals.webSearchFound = webSearchResult.found;
    enriched.webSearchSignals = webSearchResult.signals;
  }

  // Step 4: Web fetch for website enrichment
  if (enriched.co) {
    const webFetchResult = await enrichProspectWebFetch(enriched, cache);
    if (webFetchResult.fetched) {
      enriched.companyContext = webFetchResult.context;
      signals.websiteEnriched = true;
    }
  }

  // Step 5: Calculate confidence score (before Hunter verification)
  enriched.confidence = calculateDeliverabilityScore(signals);

  // Step 5b: Hunter.io email verification (DISABLED — Pay-as-you-go model)
  //
  // Zero-cost strategy:
  // - OpenClaw researches company email patterns via web_search
  // - System generates candidates based on discovered patterns
  // - Verification only happens on send failures (bounce handling)
  // - See: scripts/mailer.js bounce_handler for retry logic
  //
  // If Hunter verification needed in future:
  // 1. Set HUNTER_IO_API_KEY in GitHub Secrets
  // 2. Uncomment code below
  // 3. Only verify borderline candidates (0.5-0.8 confidence)
  //
  // Current: Disabled (saves ~$49/month)
  //
  // if (enriched.em && enriched.confidence >= 0.5 && enriched.confidence < 0.9) {
  //   try {
  //     const verification = await hunterVerifier.verifyEmail(enriched.em);
  //     if (verification.success && verification.status) {
  //       enriched.hunterVerification = {
  //         status: verification.status,
  //         result: verification.result,
  //         score: verification.score,
  //         verifiedAt: verification.verifiedAt
  //       };
  //       if (verification.status === 'valid') {
  //         signals.hunterVerified = true;
  //         enriched.confidence = Math.min(enriched.confidence + 0.15, 1.0);
  //       } else if (verification.status === 'invalid') {
  //         signals.hunterInvalid = true;
  //         enriched.confidence = Math.max(enriched.confidence - 0.2, 0.0);
  //       } else if (verification.status === 'valid_catchall') {
  //         signals.hunterCatchall = true;
  //         enriched.confidence = Math.max(enriched.confidence - 0.1, 0.0);
  //       }
  //     } else if (verification.error) {
  //       enriched.hunterVerificationError = verification.error;
  //     }
  //   } catch (error) {
  //     console.warn(`[enrichment-engine] Hunter verification error for ${enriched.em}: ${error.message}`);
  //   }
  // }

  // Step 6: Determine action based on confidence
  enriched.confidenceAction = confidenceThresholds(enriched);

  // Step 7: Add enrichment metadata
  enriched.enrichedAt = new Date().toISOString();
  enriched.signals = signals;

  return enriched;
}

/**
 * SECTION 9: BATCH ENRICHMENT
 */

/**
 * Enriches multiple prospects with shared cache
 * Optimizes for reuse of domain/company lookups
 *
 * @param {Array} prospects - Array of prospects in TOON format
 * @returns {Promise<Array>} Array of enriched prospects
 */
async function enrichProspects(prospects) {
  if (!Array.isArray(prospects)) {
    return [];
  }

  const cache = createEnrichmentCache();
  const enriched = [];

  for (const prospect of prospects) {
    enriched.push(await enrichProspect(prospect, cache));
  }

  return enriched;
}

/**
 * SECTION 10: EXPORTS
 */

module.exports = {
  // Email generation
  generateEmailCandidates,
  EMAIL_PATTERNS,

  // Validation
  validateEmail: validateEmailFormat,
  validateMXRecord,

  // Scoring
  calculateDeliverabilityScore,
  confidenceThresholds,

  // Web integration
  searchSerper,
  enrichProspectWebSearch,
  enrichProspectWebFetch,

  // Caching
  createEnrichmentCache,

  // Main enrichment
  enrichProspect,
  enrichProspects,

  // External module access (for direct usage if needed)
  timezoneCache,
  hunterVerifier
};

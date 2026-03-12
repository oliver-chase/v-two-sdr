/**
 * Enrichment Engine Configuration
 *
 * Defines:
 * - Confidence thresholds for action routing
 * - Email pattern weights and priority
 * - Signal weights for scoring
 * - Cache behavior
 * - Web search/fetch integration settings
 *
 * Non-negotiable: Confidence thresholds must be enforced exactly
 * >= 0.8: auto-use (approved for sending)
 * 0.5-0.8: user-review (flag for manual approval)
 * < 0.5: skip (too risky)
 */

module.exports = {
  /**
   * Confidence thresholds (non-negotiable)
   */
  confidenceThresholds: {
    autoUse: 0.8,      // >= 0.8: auto-approve for sending
    userReview: 0.5,   // 0.5-0.8: flag for user confirmation
    skip: 0.0          // < 0.5: skip entirely
  },

  /**
   * Signal weights for scoring
   * Each signal contributes to final confidence score (0-1)
   * Total max: 1.0 (capped)
   */
  signalWeights: {
    mxValid: 0.3,              // Domain has MX records
    domainWhoisRecent: 0.2,    // Domain registered recently
    webSearchFound: 0.2,       // Web search found company info
    emailPatternMatch: 0.2     // Email matches industry standard
  },

  /**
   * Email patterns ranked by likelihood
   * Industry-standard patterns, ordered by prevalence
   * Each has a weight (confidence boost) for matching this pattern
   */
  emailPatterns: [
    {
      pattern: '{f}.{l}@{d}',
      name: 'first.last@domain',
      weight: 0.95,
      description: 'Most common format'
    },
    {
      pattern: '{f}{l}@{d}',
      name: 'firstlast@domain',
      weight: 0.85,
      description: 'Common concatenation'
    },
    {
      pattern: '{f}@{d}',
      name: 'first@domain',
      weight: 0.75,
      description: 'Minimal format'
    },
    {
      pattern: '{i}{l}@{d}',
      name: 'initial+last@domain',
      weight: 0.7,
      description: 'Initial + last name'
    },
    {
      pattern: '{l}.{f}@{d}',
      name: 'last.first@domain',
      weight: 0.65,
      description: 'Reversed order'
    },
    {
      pattern: '{f}_{l}@{d}',
      name: 'first_last@domain',
      weight: 0.6,
      description: 'Underscore separator'
    },
    {
      pattern: '{f}-{l}@{d}',
      name: 'first-last@domain',
      weight: 0.55,
      description: 'Hyphen separator'
    }
  ],

  /**
   * Web search configuration
   * For OpenClaw integration: queries, result parsing, signal extraction
   */
  webSearch: {
    enabled: true,
    queries: [
      '{company} hiring {title}',
      '{company} {title} LinkedIn',
      '{company} jobs "{title}"',
      '{company} team {title}'
    ],
    // Signals to look for in results
    hiringSignals: [
      'hiring',
      'recruiting',
      'job opening',
      'we\'re hiring',
      'join our team',
      'career'
    ],
    // Parse confidence boost for finding signals
    resultBoost: 0.2,
    // Maximum results to fetch per query
    maxResults: 5,
    // Cache results per run
    cachePerRun: true
  },

  /**
   * Web fetch configuration
   * For company website enrichment: target fields, parsing
   */
  webFetch: {
    enabled: true,
    // Company info to extract
    targetFields: [
      'industry',
      'location',
      'employees',
      'founded',
      'description'
    ],
    // Cache results per run
    cachePerRun: true,
    // Timeout for fetch (ms)
    timeout: 5000,
    // Confidence boost for successful fetch
    resultBoost: 0.1
  },

  /**
   * MX record validation
   * DNS lookups to verify domain accepts mail
   */
  mxValidation: {
    enabled: true,
    // Timeout for DNS lookup (ms)
    timeout: 5000,
    // Cache results per run
    cachePerRun: true,
    // Confidence boost for valid MX
    resultBoost: 0.3
  },

  /**
   * Caching behavior
   * Per-run caching: separate cache for each enrichment batch
   * Prevents duplicate requests within single execution
   */
  cache: {
    // Create new cache for each enrichment run
    perRunCaches: true,
    // Clear cache after enrichment completes
    clearAfterRun: false,
    // Cache TTL (ms) - 0 = infinite per-run
    ttl: 0
  },

  /**
   * Output configuration
   * What gets written to enriched prospects
   */
  output: {
    // Always include these fields in enriched prospect
    alwaysInclude: [
      'id',
      'fn',
      'ln',
      'co',
      'ti',
      'em',
      'confidence',
      'confidenceAction',
      'enrichedAt',
      'signals'
    ],
    // Only include if enrichment succeeded
    conditionalInclude: [
      'webSearchSignals',
      'companyContext',
      'mxValidation'
    ]
  },

  /**
   * Error handling
   */
  errors: {
    // Continue enrichment even if web search fails
    skipWebSearchOnError: true,
    // Continue enrichment even if web fetch fails
    skipWebFetchOnError: true,
    // Continue enrichment even if MX lookup fails
    skipMXOnError: true,
    // Default confidence if all enrichment fails
    defaultConfidence: 0.2
  },

  /**
   * Logging
   */
  logging: {
    enabled: true,
    // Log each enrichment step
    verbose: false,
    // Log cache hits/misses
    logCache: false,
    // Log web requests
    logWebRequests: false
  }
};

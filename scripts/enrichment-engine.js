#!/usr/bin/env node
'use strict';

/**
 * scripts/enrichment-engine.js — Prospect enrichment orchestrator
 *
 * Responsibilities:
 *   1. Email candidate generation (enrichment-candidates.js)
 *   2. MX record validation + deliverability scoring
 *   3. Web search + website fetch (enrichment-web.js)
 *   4. Per-run caching to avoid duplicate requests
 *   5. Confidence thresholds: >= 0.8 auto-use, 0.5-0.8 review, < 0.5 skip
 *
 * Public API unchanged — callers (bounce-handler, sync) import from this file.
 */

const dns = require('dns').promises;
const timezoneCache = require('../lib/timezone-cache');
const hunterVerifier = require('./hunter-verifier');
const { EMAIL_PATTERNS, generateEmailCandidates, validateEmailFormat } = require('./enrichment-candidates');
const { searchSerper, enrichProspectWebSearch, enrichProspectWebFetch } = require('./enrichment-web');

// ─── MX validation ────────────────────────────────────────────────────────────

async function validateMXRecord(domain, cache = null) {
  if (!domain) return { valid: false, mxRecords: [] };
  if (cache && cache.mxRecords.has(domain)) return cache.mxRecords.get(domain);

  try {
    const mxRecords = await dns.resolveMx(domain);
    const result = { valid: !!(mxRecords && mxRecords.length > 0), mxRecords: mxRecords || [] };
    if (cache) cache.mxRecords.set(domain, result);
    return result;
  } catch (error) {
    const result = { valid: false, mxRecords: [], error: error.message };
    if (cache) cache.mxRecords.set(domain, result);
    return result;
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Confidence score from enrichment signals (0-1, capped at 1.0).
 * mxValid +0.3, domainWhoisRecent +0.2, webSearchFound +0.2, emailPatternMatch +0.2
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
 * Determine action from confidence score.
 * @returns {'auto-use'|'user-review'|'skip'}
 */
function confidenceThresholds(prospect) {
  const confidence = prospect.confidence || 0;
  if (confidence >= 0.8) return 'auto-use';
  if (confidence >= 0.5) return 'user-review';
  return 'skip';
}

// ─── Caching ──────────────────────────────────────────────────────────────────

function createEnrichmentCache() {
  return {
    mxRecords: new Map(),
    webSearchResults: new Map(),
    webFetchResults: new Map(),
    hunterVerifications: new Map(),
  };
}

// ─── Single prospect enrichment ───────────────────────────────────────────────

async function enrichProspect(prospect, cache = null) {
  if (!prospect) return { confidence: 0, signals: {} };

  const enriched = { ...prospect };
  const signals = {};
  if (!cache) cache = createEnrichmentCache();

  // Email generation if missing
  if (!enriched.em || !validateEmailFormat(enriched.em)) {
    if (enriched.fn && enriched.ln) {
      let domain = null;
      if (enriched.dm) {
        domain = enriched.dm.toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/\/.*/g, '');
      } else if (enriched.co) {
        domain = enriched.co.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '') + '.com';
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

  // MX validation
  if (enriched.em) {
    const domain = enriched.em.split('@')[1];
    if (domain) {
      const mxResult = await validateMXRecord(domain, cache);
      signals.mxValid = mxResult.valid;
    }
  }

  // Timezone lookup
  if (enriched.loc) {
    const parts = enriched.loc.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const tz = await timezoneCache.getTimezone(parts[0], parts[1], 'USA');
      if (tz) { enriched.tz = tz; signals.timezoneResolved = true; }
    }
  }

  // Web search
  if (enriched.co && enriched.ti) {
    const webSearchResult = await enrichProspectWebSearch(enriched, cache);
    signals.webSearchFound = webSearchResult.found;
    enriched.webSearchSignals = webSearchResult.signals;
  }

  // Website fetch
  if (enriched.co) {
    const webFetchResult = await enrichProspectWebFetch(enriched, cache);
    if (webFetchResult.fetched) {
      enriched.companyContext = webFetchResult.context;
      signals.websiteEnriched = true;
    }
  }

  enriched.confidence = calculateDeliverabilityScore(signals);
  enriched.confidenceAction = confidenceThresholds(enriched);
  enriched.enrichedAt = new Date().toISOString();
  enriched.signals = signals;

  return enriched;
}

// ─── Batch enrichment ─────────────────────────────────────────────────────────

async function enrichProspects(prospects) {
  if (!Array.isArray(prospects)) return [];
  const cache = createEnrichmentCache();
  const enriched = [];
  for (const prospect of prospects) {
    enriched.push(await enrichProspect(prospect, cache));
  }
  return enriched;
}

// ─── Exports (full API preserved for callers) ─────────────────────────────────

module.exports = {
  EMAIL_PATTERNS,
  generateEmailCandidates,
  validateEmail: validateEmailFormat,
  validateMXRecord,
  calculateDeliverabilityScore,
  confidenceThresholds,
  searchSerper,
  enrichProspectWebSearch,
  enrichProspectWebFetch,
  createEnrichmentCache,
  enrichProspect,
  enrichProspects,
  timezoneCache,
  hunterVerifier,
};

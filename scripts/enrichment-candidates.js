'use strict';

/**
 * scripts/enrichment-candidates.js
 * Email candidate generation and format validation.
 * Required by enrichment-engine.js — do not import directly elsewhere.
 */

/**
 * Common email patterns ranked by industry likelihood.
 * @type {Array<{pattern: string, weight: number}>}
 */
const EMAIL_PATTERNS = [
  { pattern: '{f}.{l}@{d}', weight: 0.95 },
  { pattern: '{f}{l}@{d}',  weight: 0.85 },
  { pattern: '{f}@{d}',     weight: 0.75 },
  { pattern: '{i}{l}@{d}',  weight: 0.7  },
  { pattern: '{l}.{f}@{d}', weight: 0.65 },
  { pattern: '{f}_{l}@{d}', weight: 0.6  },
  { pattern: '{f}-{l}@{d}', weight: 0.55 },
];

/**
 * Generate email candidates from name + domain, ranked highest-confidence first.
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} domain
 * @returns {Array<{em: string, pattern: string, score: number}>}
 */
function generateEmailCandidates(firstName, lastName, domain) {
  if (!firstName || !lastName || !domain) return [];

  const f = firstName.toLowerCase().replace(/\s+/g, '').replace(/[^\w-]/g, '');
  const l = lastName.toLowerCase().replace(/\s+/g, '').replace(/[^\w-]/g, '');
  const d = domain.toLowerCase().trim();
  const i = f.charAt(0);

  const candidates = EMAIL_PATTERNS.map(({ pattern, weight }) => ({
    em: pattern.replace(/{f}/g, f).replace(/{l}/g, l).replace(/{i}/g, i).replace(/{d}/g, d),
    pattern,
    score: weight,
  }));

  const seen = new Set();
  return candidates.filter(c => {
    if (seen.has(c.em)) return false;
    seen.add(c.em);
    return true;
  });
}

/**
 * Basic email format validation.
 * @param {string} email
 * @returns {boolean}
 */
function validateEmailFormat(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { EMAIL_PATTERNS, generateEmailCandidates, validateEmailFormat };

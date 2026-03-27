'use strict';

/**
 * scripts/bounce-handler.js — Handle email bounces with pattern cycling
 *
 * Called by inbox.js when a bounce is detected. Strategy:
 *
 * 1. Record the bounced email in prospect.tried_patterns (persistent across bounces)
 * 2. Resolve domain: prospect.dm first, then extract from bounced email
 * 3. MX-check the domain — if no MX records, mark bounced_no_alt immediately (free check)
 * 4. Get untried candidates (all patterns minus tried_patterns)
 * 5. If untried candidates remain and this is NOT the last one:
 *    - Set prospect.em to the next untried pattern, st → email_discovered
 *    - No Hunter call (let the bounce mechanism confirm it)
 * 6. If this is the LAST untried candidate:
 *    - Hunter-verify it before committing (one API credit to avoid a guaranteed bounce)
 *    - If verified: use it, st → email_discovered
 *    - If not verified: bounced_no_alt
 * 7. If no untried candidates left: bounced_no_alt
 *
 * Result: Hunter is called at most once per prospect (last candidate only),
 * vs. previously being called for every candidate on every bounce.
 */

const { verifyEmail } = require('./hunter-verifier');
const { generateEmailCandidates, validateMXRecord } = require('./enrichment-engine');

const HUNTER_SCORE_THRESHOLD = 80; // Hunter confidence score 0–100

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract first name, last name from a prospect.
 * Returns null if insufficient name data.
 */
function extractName(prospect) {
  var nm = prospect.nm || '';
  var parts = nm.trim().split(/\s+/);
  var fn = prospect.fn || parts[0] || '';
  var ln = prospect.ln || (parts.length > 1 ? parts[parts.length - 1] : '');
  if (!fn || !ln) return null;
  return { fn: fn, ln: ln };
}

/**
 * Resolve the domain to use for candidate generation.
 * Prefers explicit prospect.dm, falls back to domain of bounced email.
 */
function resolveDomain(prospect) {
  if (prospect.dm) {
    return prospect.dm.toLowerCase().trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*/g, '');
  }
  var em = prospect.em || '';
  return em.includes('@') ? em.split('@')[1] : null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Process a bounce for a prospect.
 *
 * @param {Object} prospect - TOON prospect (mutated in place)
 * @returns {Promise<Object>} Updated prospect
 */
async function handleBounce(prospect) {
  var bouncedEmail = prospect.em;
  console.log('[bounce-handler] Bounce on ' + bouncedEmail + ' — searching for alternate');

  // 1. Track bounced email in tried_patterns
  var tried = Array.isArray(prospect.tried_patterns) ? prospect.tried_patterns.slice() : [];
  var bouncedLower = bouncedEmail.toLowerCase();
  if (!tried.includes(bouncedLower)) {
    tried.push(bouncedLower);
  }
  prospect.tried_patterns = tried;

  // 2. Resolve domain
  var domain = resolveDomain(prospect);
  if (!domain) {
    console.warn('[bounce-handler] Cannot resolve domain for ' + bouncedEmail + ' — bounced_no_alt');
    prospect.st = 'bounced_no_alt';
    return prospect;
  }

  // 3. MX check — bail immediately if domain is dead (free, no API cost)
  var mxResult;
  try {
    mxResult = await validateMXRecord(domain);
  } catch (e) {
    console.warn('[bounce-handler] MX check failed for ' + domain + ': ' + e.message + ' — skipping MX gate');
    mxResult = { valid: true }; // assume valid if check errors, let the send attempt decide
  }

  if (!mxResult.valid) {
    console.warn('[bounce-handler] Domain ' + domain + ' has no MX records — bounced_no_alt');
    prospect.st = 'bounced_no_alt';
    return prospect;
  }

  // 4. Extract name for candidate generation
  var nameParts = extractName(prospect);
  if (!nameParts) {
    console.warn('[bounce-handler] Insufficient name data for ' + bouncedEmail + ' — bounced_no_alt');
    prospect.st = 'bounced_no_alt';
    return prospect;
  }

  var candidates = generateEmailCandidates(nameParts.fn, nameParts.ln, domain);

  // 5. Filter out already-tried addresses
  var untried = candidates.filter(function(c) {
    return !tried.includes(c.em.toLowerCase());
  });

  if (untried.length === 0) {
    console.log('[bounce-handler] All ' + candidates.length + ' pattern(s) tried — bounced_no_alt');
    prospect.st = 'bounced_no_alt';
    return prospect;
  }

  var isLastCandidate = untried.length === 1;
  var next = untried[0];

  // 6. If this is the last untried candidate, verify with Hunter before committing
  if (isLastCandidate) {
    console.log('[bounce-handler] Last candidate: ' + next.em + ' — verifying with Hunter');
    var result;
    try {
      result = await verifyEmail(next.em);
    } catch (e) {
      console.warn('[bounce-handler] Hunter verify error for ' + next.em + ': ' + e.message);
      result = { success: false };
    }

    if (!result.success || result.score < HUNTER_SCORE_THRESHOLD) {
      console.log('[bounce-handler] Hunter rejected ' + next.em +
        ' (score: ' + (result.score || 0) + ') — bounced_no_alt');
      prospect.st = 'bounced_no_alt';
      return prospect;
    }

    console.log('[bounce-handler] Hunter confirmed ' + next.em + ' (score: ' + result.score + ')');
  }

  // 7. Advance to next untried pattern
  console.log('[bounce-handler] Next pattern: ' + next.em +
    ' (' + (untried.length - 1) + ' more untried after this)');
  console.log('[bounce-handler] NOTE: Update Sheet email for prospect ' +
    prospect.id + ' from ' + bouncedEmail + ' \u2192 ' + next.em);

  prospect.em = next.em;
  prospect.st = 'email_discovered';
  return prospect;
}

module.exports = { handleBounce };

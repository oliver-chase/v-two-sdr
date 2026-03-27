'use strict';

/**
 * scripts/bounce-handler.js — Handle email bounces
 *
 * Called by inbox.js when a bounce is detected. Strategy:
 *
 * 1. Generate alternate email candidates from prospect name + domain
 *    (using enrichment-engine's generateEmailCandidates)
 * 2. Verify each candidate via Hunter.io, skipping the bounced address
 * 3. If any candidate scores >= 80 (Hunter confidence 0–100):
 *    - Update prospect.em to the new address
 *    - Log: manual Sheet update required (em is a protected field)
 *    - Set status → email_discovered (re-enters draft queue)
 * 4. If no valid alternate found:
 *    - Set status → bounced_no_alt (terminal)
 *
 * Returns the (mutated) prospect.
 */

const { verifyEmail } = require('./hunter-verifier');
const { generateEmailCandidates } = require('./enrichment-engine');

const CONFIDENCE_THRESHOLD = 80; // Hunter score 0–100

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract first name, last name, and domain from a prospect.
 * Returns null if we don't have enough info to generate candidates.
 */
function extractParts(prospect) {
  const em = prospect.em || '';
  const domain = em.includes('@') ? em.split('@')[1] : null;
  if (!domain) return null;

  // Try to split nm into fn/ln
  const nm = prospect.nm || '';
  const parts = nm.trim().split(/\s+/);
  const fn = prospect.fn || parts[0] || '';
  const ln = prospect.ln || (parts.length > 1 ? parts[parts.length - 1] : '');

  if (!fn || !ln) return null;

  return { fn, ln, domain };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Process a bounce for a prospect.
 *
 * @param {Object} prospect - TOON prospect (mutated in place)
 * @returns {Promise<Object>} Updated prospect
 */
async function handleBounce(prospect) {
  const bouncedEmail = prospect.em;
  console.log(`[bounce-handler] Bounce on ${bouncedEmail} — searching for alternate`);

  const parts = extractParts(prospect);
  if (!parts) {
    console.warn(`[bounce-handler] Not enough name/domain info for ${bouncedEmail} — marking bounced_no_alt`);
    prospect.st = 'bounced_no_alt';
    return prospect;
  }

  const { fn, ln, domain } = parts;
  const candidates = generateEmailCandidates(fn, ln, domain);

  // Filter out the bounced address and already-seen patterns
  const toTry = candidates.filter(c => c.em.toLowerCase() !== bouncedEmail.toLowerCase());

  if (toTry.length === 0) {
    console.warn(`[bounce-handler] No alternate candidates for ${bouncedEmail} — marking bounced_no_alt`);
    prospect.st = 'bounced_no_alt';
    return prospect;
  }

  for (const candidate of toTry) {
    let result;
    try {
      result = await verifyEmail(candidate.em);
    } catch (e) {
      console.warn(`[bounce-handler] Verify error for ${candidate.em}: ${e.message}`);
      continue;
    }

    if (!result.success) continue;

    if (result.score >= CONFIDENCE_THRESHOLD) {
      console.log(`[bounce-handler] Alternate found: ${candidate.em} (score: ${result.score})`);
      console.log(`[bounce-handler] NOTE: Update Sheet email for prospect ${prospect.id} from ${bouncedEmail} → ${candidate.em}`);

      prospect.em = candidate.em;
      prospect.st = 'email_discovered';
      return prospect;
    }
  }

  console.log(`[bounce-handler] No alternate with score >= ${CONFIDENCE_THRESHOLD} — marking bounced_no_alt`);
  prospect.st = 'bounced_no_alt';
  return prospect;
}

module.exports = { handleBounce };

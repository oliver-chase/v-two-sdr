'use strict';

/**
 * scripts/bounce-handler.js — Handle email bounces
 *
 * Called by inbox.js when a bounce is classified. Verifies the email
 * via Hunter.io. If invalid, marks the prospect closed_negative.
 * If the key is missing or Hunter is unavailable, marks closed_negative
 * anyway — a bounced email is not retryable without manual intervention.
 *
 * Returns the (possibly mutated) prospect object.
 */

const { verifyEmail } = require('./hunter-verifier');

/**
 * Process a bounce for a prospect.
 *
 * @param {Object} prospect - TOON prospect object (mutated in place)
 * @returns {Promise<Object>} Updated prospect
 */
async function handleBounce(prospect) {
  console.log(`[bounce-handler] Bounce detected for ${prospect.em}`);

  let verifyResult = null;
  try {
    verifyResult = await verifyEmail(prospect.em);
  } catch (e) {
    console.warn(`[bounce-handler] Verification error for ${prospect.em}: ${e.message}`);
  }

  if (verifyResult && verifyResult.success) {
    console.log(`[bounce-handler] Hunter says: ${prospect.em} → ${verifyResult.status}`);
  } else {
    console.warn(`[bounce-handler] Could not verify ${prospect.em} — marking closed_negative`);
  }

  // Either way: email bounced, close the sequence
  prospect.st = 'closed_negative';
  console.log(`[bounce-handler] ${prospect.em} → closed_negative`);

  return prospect;
}

module.exports = { handleBounce };

/**
 * Approve Drafts -- Interactive CLI for reviewing and approving email drafts
 *
 * Responsibilities:
 * - Load draft-plan.json, filter to status='draft' entries
 * - Display each draft to console for review
 * - Prompt user: (a)pprove / (r)eject / (s)kip
 * - Write updated statuses back to draft-plan.json
 * - Append approved drafts to approved-sends.json
 * - Print summary at end
 * - Does NOT send emails (sending is a separate step)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================================
// LOAD DRAFTS
// ============================================================================

/**
 * Load draft-plan.json and return only entries with status='draft'
 *
 * @param {string} draftPlanPath - Path to draft-plan.json
 * @returns {Array} Array of draft objects
 */
function loadDrafts(draftPlanPath) {
  if (!fs.existsSync(draftPlanPath)) {
    return [];
  }

  const raw = fs.readFileSync(draftPlanPath, 'utf8');
  const all = JSON.parse(raw);

  return all.filter(function(d) { return d.status === 'draft'; });
}

// ============================================================================
// DISPLAY DRAFT
// ============================================================================

/**
 * Pretty-print a draft to the console for review
 *
 * @param {Object} draft  - Draft object
 * @param {number} index  - 1-based current index
 * @param {number} total  - Total number of drafts to review
 */
function displayDraft(draft, index, total) {
  const separator = '='.repeat(60);
  const divider = '-'.repeat(60);

  console.log('\n' + separator);
  console.log('Draft ' + index + ' of ' + total);
  console.log(divider);
  console.log('Prospect : ' + draft.fn + ' ' + (draft.ln || '') + ' <' + draft.em + '>');
  console.log('Company  : ' + draft.co);
  console.log('Title    : ' + draft.ti);
  console.log('Track    : ' + draft.tr + '  |  Template: ' + draft.tpl);
  console.log(divider);
  console.log('Subject  : ' + draft.subject);
  console.log(divider);
  console.log(draft.body);
  console.log(separator);
}

// ============================================================================
// PROMPT ACTION
// ============================================================================

/**
 * Prompt the user for an action on the current draft
 * Returns a promise resolving to 'approve', 'reject', or 'skip'
 *
 * @param {Object} rl    - readline.Interface (or compatible mock)
 * @param {Object} draft - Draft object (for display context)
 * @returns {Promise<string>} 'approve' | 'reject' | 'skip'
 */
function promptAction(rl, draft) {
  return new Promise(function(resolve) {
    rl.question('\n[a] Approve  [r] Reject  [s] Skip  > ', function(answer) {
      const normalized = (answer || '').trim().toLowerCase();

      if (normalized === 'a' || normalized === 'approve') {
        resolve('approve');
      } else if (normalized === 'r' || normalized === 'reject') {
        resolve('reject');
      } else {
        // Any other input (including 's', 'skip', or blank) -> skip
        resolve('skip');
      }
    });
  });
}

// ============================================================================
// SAVE DRAFT PLAN
// ============================================================================

/**
 * Write the full (updated) drafts array back to draft-plan.json
 *
 * @param {Array}  drafts        - Full array of draft objects (all statuses)
 * @param {string} draftPlanPath - Path to draft-plan.json
 */
function saveDraftPlan(drafts, draftPlanPath) {
  fs.writeFileSync(draftPlanPath, JSON.stringify(drafts, null, 2));
}

// ============================================================================
// LOAD / SAVE APPROVED SENDS
// ============================================================================

function loadApprovedSends(approvedSendsPath) {
  if (!fs.existsSync(approvedSendsPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(approvedSendsPath, 'utf8'));
}

function saveApprovedSends(sends, approvedSendsPath) {
  const dir = path.dirname(approvedSendsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(approvedSendsPath, JSON.stringify(sends, null, 2));
}

// ============================================================================
// MAIN CLI LOOP
// ============================================================================

/**
 * Run the interactive approval CLI
 *
 * @param {Object} config
 * @param {Object} config.paths
 * @param {string} config.paths.draftPlanPath     - Path to draft-plan.json
 * @param {string} config.paths.approvedSendsPath - Path to approved-sends.json
 * @param {Object} [rl]  - Optional readline interface (for testing). If omitted, creates one.
 *
 * @returns {Promise<{ approved: number, rejected: number, skipped: number }>}
 */
async function runApproval(config, rl) {
  const { draftPlanPath, approvedSendsPath } = config.paths;

  // Create readline if not injected
  const ownRl = !rl;
  if (ownRl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Load current full draft plan (all statuses) so we can write it back correctly
  let allDrafts = [];
  if (fs.existsSync(draftPlanPath)) {
    allDrafts = JSON.parse(fs.readFileSync(draftPlanPath, 'utf8'));
  }

  // Filter to only the ones that need review
  const pending = allDrafts.filter(function(d) { return d.status === 'draft'; });

  const summary = { approved: 0, rejected: 0, skipped: 0 };

  if (pending.length === 0) {
    console.log('\nNo drafts pending review.');
    if (ownRl) rl.close();
    return summary;
  }

  console.log('\nStarting approval review: ' + pending.length + ' draft(s) to review.');

  // Load existing approved sends so we can append
  const approvedSends = loadApprovedSends(approvedSendsPath);
  const newlyApproved = [];

  for (let i = 0; i < pending.length; i++) {
    const draft = pending[i];
    displayDraft(draft, i + 1, pending.length);

    const action = await promptAction(rl, draft);

    // Find and update the matching entry in allDrafts
    const idx = allDrafts.findIndex(function(d) { return d.id === draft.id; });

    if (action === 'approve') {
      allDrafts[idx].status = 'approved';
      summary.approved++;
      newlyApproved.push(Object.assign({}, allDrafts[idx]));
    } else if (action === 'reject') {
      allDrafts[idx].status = 'rejected';
      summary.rejected++;
    } else {
      // skipped — leave status as 'draft'
      summary.skipped++;
    }
  }

  // Persist updated draft plan
  saveDraftPlan(allDrafts, draftPlanPath);

  // Append newly approved to approved-sends.json
  if (newlyApproved.length > 0) {
    const updatedSends = approvedSends.concat(newlyApproved);
    saveApprovedSends(updatedSends, approvedSendsPath);
  }

  // Print summary
  console.log('\n--- Approval Summary ---');
  console.log('Approved : ' + summary.approved);
  console.log('Rejected : ' + summary.rejected);
  console.log('Skipped  : ' + summary.skipped);
  console.log('------------------------\n');

  if (ownRl) rl.close();

  return summary;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { loadDrafts, displayDraft, promptAction, saveDraftPlan, runApproval };

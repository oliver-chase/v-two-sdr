'use strict';

/**
 * scripts/handle-approval.js — Process approve or reject for a draft
 *
 * Called by approval-handler.yml with:
 *   DRAFT_ID — the draft_id to process
 *   ACTION   — "approve" or "reject"
 *
 * Approve: copies draft to outreach/approved/{draft_id}.json, marks
 *          draft status → approved in drafts file.
 *
 * Reject:  marks draft status → rejected in drafts file, resets
 *          prospect status back to pre-draft state so it re-queues tomorrow.
 */

const fs = require('fs');
const path = require('path');

const DRAFTS_DIR = path.join(__dirname, '..', 'outreach', 'drafts');
const APPROVED_DIR = path.join(__dirname, '..', 'outreach', 'approved');
const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Scan all YYYY-MM-DD.json files in outreach/drafts/ for a given draft_id.
 * Returns { file, drafts, index } or null if not found.
 */
function findDraft(draftId) {
  if (!fs.existsSync(DRAFTS_DIR)) return null;

  const files = fs.readdirSync(DRAFTS_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse(); // newest first

  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    let drafts;
    try {
      drafts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      continue;
    }
    const index = drafts.findIndex(d => d.draft_id === draftId);
    if (index !== -1) return { file: filePath, drafts, index };
  }
  return null;
}

/**
 * Determine the pre-draft status to restore on rejection.
 * draft.touch is "INITIAL OUTREACH" or "FOLLOW-UP (Day N)".
 */
function preDraftStatus(draft) {
  return (draft.touch || '').includes('FOLLOW-UP') ? 'followup_due' : 'email_discovered';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const draftId = process.env.DRAFT_ID;
  const action = (process.env.ACTION || '').toLowerCase();

  if (!draftId) {
    console.error('[handle-approval] DRAFT_ID not set');
    process.exit(1);
  }
  if (action !== 'approve' && action !== 'reject') {
    console.error(`[handle-approval] Invalid ACTION "${action}" — must be approve or reject`);
    process.exit(1);
  }

  // Find the draft
  const found = findDraft(draftId);
  if (!found) {
    console.error(`[handle-approval] Draft not found: ${draftId}`);
    process.exit(1);
  }

  const { file, drafts, index } = found;
  const draft = drafts[index];

  if (draft.status !== 'pending_approval') {
    console.log(`[handle-approval] Draft ${draftId} already processed (status: ${draft.status}) — skipping`);
    return;
  }

  if (action === 'approve') {
    // Write to outreach/approved/
    if (!fs.existsSync(APPROVED_DIR)) fs.mkdirSync(APPROVED_DIR, { recursive: true });
    const approvedFile = path.join(APPROVED_DIR, `${draftId}.json`);
    fs.writeFileSync(approvedFile, JSON.stringify(draft, null, 2));
    console.log(`[handle-approval] Approved → ${path.relative(process.cwd(), approvedFile)}`);

    // Update draft status
    drafts[index] = { ...draft, status: 'approved' };
    fs.writeFileSync(file, JSON.stringify(drafts, null, 2));

  } else {
    // Reject: reset prospect status so it re-queues tomorrow
    const restoreStatus = preDraftStatus(draft);

    const raw = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
    const prospects = raw.prospects || [];
    const pi = prospects.findIndex(p => p.id === draft.prospect_id);
    if (pi !== -1) {
      prospects[pi].st = restoreStatus;
      const byState = prospects.reduce((acc, p) => {
        const k = p.st || 'unknown';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});
      fs.writeFileSync(PROSPECTS_FILE, JSON.stringify({
        prospects,
        metadata: { ...raw.metadata, lu: new Date().toISOString(), by_st: byState }
      }, null, 2));
      console.log(`[handle-approval] Prospect ${draft.prospect_id} reset → ${restoreStatus}`);
    }

    // Update draft status
    drafts[index] = { ...draft, status: 'rejected' };
    fs.writeFileSync(file, JSON.stringify(drafts, null, 2));
    console.log(`[handle-approval] Rejected draft ${draftId}`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[handle-approval] Fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, findDraft, preDraftStatus };

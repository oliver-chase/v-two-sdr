/**
 * Send Approved Emails
 *
 * Reads outreach/approved-sends.json and queues each for sending via send-queue.js.
 * Queued emails are sent at the next Tue-Thu 9-11 AM in the prospect's timezone
 * via queue-executor.js.
 *
 * Called by OpenClaw after approve-drafts.js confirms drafts.
 *
 * Usage: node scripts/send-approved.js [--dry-run]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { queueSend } = require('./send-queue');

const SDR_ROOT = path.join(__dirname, '..');
const APPROVED_PATH = path.join(SDR_ROOT, 'outreach/approved-sends.json');
const DRY_RUN = process.argv.includes('--dry-run');

async function sendApproved() {
  if (!fs.existsSync(APPROVED_PATH)) {
    console.log('[SDR] No approved-sends.json found. Run approve-drafts.js first.');
    return { queued: 0, failed: 0 };
  }

  const approved = JSON.parse(fs.readFileSync(APPROVED_PATH, 'utf8'));
  const pending = approved.filter(d => d.status === 'approved');

  if (pending.length === 0) {
    console.log('[SDR] No approved drafts pending queue.');
    return { queued: 0, failed: 0 };
  }

  console.log(`[SDR] Queueing ${pending.length} approved emails${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  if (DRY_RUN) {
    for (const draft of pending) {
      console.log(`[SDR] [DRY] → ${draft.em} | ${draft.subject}`);
    }
    return { queued: 0, failed: 0, dry_run: true };
  }

  let queued = 0;
  let failed = 0;

  for (const draft of pending) {
    const result = await queueSend(draft);

    if (result.ok) {
      queued++;
      draft.status = 'queued';
      draft.queuedAt = new Date().toISOString();
      draft.scheduledSendAt = result.scheduledSendAt;
      console.log(`[SDR] Queued ${draft.em} for ${new Date(result.scheduledSendAt).toLocaleString()}`);
    } else {
      failed++;
      draft.status = 'queue_failed';
      draft.error = result.error;
      console.error(`[SDR] Failed to queue ${draft.em}: ${result.error}`);
    }
  }

  // Update approved-sends.json with queued statuses
  const updated = approved.map(d => pending.find(p => p.id === d.id) || d);
  fs.writeFileSync(APPROVED_PATH, JSON.stringify(updated, null, 2));

  console.log(`[SDR] Done: ${queued} queued, ${failed} failed`);
  return { queued, failed };
}

if (require.main === module) {
  sendApproved().catch(err => {
    console.error('Send failed:', err.message);
    process.exit(1);
  });
}

module.exports = { sendApproved };

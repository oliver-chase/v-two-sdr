/**
 * Send Approved Emails
 *
 * Reads outreach/approved-sends.json and sends each via mailer.js.
 * Called by OpenClaw after approve-drafts.js confirms drafts.
 *
 * Usage: node scripts/send-approved.js [--dry-run]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Mailer } = require('./mailer');

const SDR_ROOT = path.join(__dirname, '..');
const APPROVED_PATH = path.join(SDR_ROOT, 'outreach/approved-sends.json');
const DRY_RUN = process.argv.includes('--dry-run');

async function sendApproved() {
  if (!fs.existsSync(APPROVED_PATH)) {
    console.log('No approved-sends.json found. Run approve-drafts.js first.');
    return { sent: 0, failed: 0 };
  }

  const approved = JSON.parse(fs.readFileSync(APPROVED_PATH, 'utf8'));
  const pending = approved.filter(d => d.status === 'approved');

  if (pending.length === 0) {
    console.log('No approved drafts pending send.');
    return { sent: 0, failed: 0 };
  }

  console.log(`Sending ${pending.length} approved emails${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  if (DRY_RUN) {
    for (const draft of pending) {
      console.log(`  [DRY] → ${draft.em} | ${draft.subject}`);
    }
    return { sent: 0, failed: 0, dry_run: true };
  }

  const config = require('../config.email');
  const oauthConfig = require('../config/config.oauth');
  const mailer = new Mailer(config, oauthConfig);
  await mailer.verify();

  const emails = pending.map(draft => ({
    prospect: { id: draft.id, fn: draft.fn, em: draft.em, co: draft.co },
    subject: draft.subject,
    body: draft.body
  }));

  const results = await mailer.sendBatch(emails);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    pending[i].status = r.ok ? 'sent' : 'failed';
    pending[i].sentAt = new Date().toISOString();
    if (r.ok) { sent++; console.log(`  ✓ ${pending[i].em}`); }
    else { failed++; console.error(`  ✗ ${pending[i].em}: ${r.error}`); }
  }

  // Update approved-sends.json with sent statuses
  const updated = approved.map(d => pending.find(p => p.id === d.id) || d);
  fs.writeFileSync(APPROVED_PATH, JSON.stringify(updated, null, 2));

  console.log(`\nDone: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

if (require.main === module) {
  sendApproved().catch(err => {
    console.error('Send failed:', err.message);
    process.exit(1);
  });
}

module.exports = { sendApproved };
